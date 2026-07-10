import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

// 2FA middleware
export const require2FA = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const user = decoded as any;
    
    if (user.requires2FA && !req.headers['x-2fa-code']) {
      return res.status(403).json({ error: 'Code 2FA requis' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Audit logging middleware
export const auditLog = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent');
  
  console.log(`[AUDIT] ${timestamp} - ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
  
  // Log des actions sensibles
  if (['POST', 'PUT', 'DELETE'].includes(method) && url.includes('/admin')) {
    console.log(`[SECURITY] Action admin détectée: ${method} ${url}`);
  }
  
  next();
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsConfig = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-2FA-Code']
});

// XSS protection
export const xssProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Nettoyer les entrées utilisateur
  const sanitizeInput = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object') {
      for (let key in obj) {
        obj[key] = sanitizeInput(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  
  next();
};

// Export all security middlewares
export const securityMiddleware = [
  limiter,
  securityHeaders,
  corsConfig,
  auditLog,
  xssProtection
]; 