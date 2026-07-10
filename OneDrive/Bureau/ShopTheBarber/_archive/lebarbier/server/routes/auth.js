import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/authService.js';
import { sendWelcomeEmail, sendEmail } from '../services/emailService.js';
import { formatPhoneNumber, sendSMS } from '../services/smsService.js';
import { get, run } from '../database/db.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: {
    error: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 password reset requests per windowMs
  message: {
    error: 'Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

// Register new user
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    const result = await AuthService.register(req.body, ipAddress, userAgent);
    
    // Send welcome email
    try {
      await sendWelcomeEmail(req.body.email, req.body.firstName);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    const result = await AuthService.login(email, password, ipAddress, userAgent, mfaCode);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'MFA_REQUIRED') {
      res.status(200).json({ 
        mfaRequired: true, 
        message: 'Code MFA requis' 
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }
    
    const result = await AuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (sessionToken) {
      await AuthService.logout(sessionToken);
    }
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// Forgot password
router.post('/forgot-password', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
}), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    const result = await AuthService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code de réinitialisation' });
  }
});

// Reset password
router.post('/reset-password', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
}), async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code et nouveau mot de passe requis' });
    }
    
    const result = await AuthService.resetPassword(email, code, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Setup MFA
router.post('/mfa/setup', async (req, res) => {
  try {
    const { userId, method } = req.body;
    
    if (!userId || !method) {
      return res.status(400).json({ error: 'ID utilisateur et méthode requis' });
    }
    
    const result = await AuthService.setupMFA(userId, method);
    res.json(result);
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Enable MFA
router.post('/mfa/enable', async (req, res) => {
  try {
    const { userId, method, code, secret } = req.body;
    
    if (!userId || !method || !code) {
      return res.status(400).json({ error: 'ID utilisateur, méthode et code requis' });
    }
    
    const result = await AuthService.enableMFA(userId, method, code, secret);
    res.json(result);
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Disable MFA
router.post('/mfa/disable', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'ID utilisateur et code requis' });
    }
    
    const result = await AuthService.disableMFA(userId, code);
    res.json(result);
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user sessions
router.get('/sessions', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    const sessions = await AuthService.getUserSessions(userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// Revoke session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'ID utilisateur et ID session requis' });
    }
    
    await AuthService.revokeSession(userId, sessionId);
    res.json({ message: 'Session révoquée avec succès' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Erreur lors de la révocation de la session' });
  }
});

// Revoke all sessions except current
router.delete('/sessions', async (req, res) => {
  try {
    const { userId, currentSessionId } = req.body;
    
    if (!userId || !currentSessionId) {
      return res.status(400).json({ error: 'ID utilisateur et ID session actuelle requis' });
    }
    
    await AuthService.revokeAllSessions(userId, currentSessionId);
    res.json({ message: 'Toutes les autres sessions ont été révoquées' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de la révocation des sessions' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code requis' });
    }
    
    // Get user by email
    const user = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Verify OTP
    const isValid = await AuthService.verifyOTP(user.id, code, 'email_verification');
    if (!isValid) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }
    
    // Update user
    await run(
      "UPDATE users SET email_verified = TRUE WHERE id = ?",
      [user.id]
    );
    
    res.json({ message: 'Email vérifié avec succès' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
  }
});

// Send email verification
router.post('/send-email-verification', rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Trop de tentatives. Réessayez dans 5 minutes.' }
}), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    // Get user by email
    const user = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Create OTP
    const otpCode = await AuthService.createOTP(user.id, 'email_verification');
    
    // Send email
    await sendEmail(email, 'Vérification de votre email - ShopTheBarber', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b;">ShopTheBarber</h1>
        <h2>Vérification de votre email</h2>
        <p>Utilisez le code suivant pour vérifier votre email :</p>
        <h1 style="color: #f59e0b; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">${otpCode}</h1>
        <p>Ce code expire dans 10 minutes.</p>
      </div>
    `);
    
    res.json({ message: 'Code de vérification envoyé' });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code de vérification' });
  }
});

// Verify phone
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ error: 'Téléphone et code requis' });
    }
    
    // Get user by phone
    const user = await get("SELECT id FROM users WHERE phone = ?", [phone]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Verify OTP
    const isValid = await AuthService.verifyOTP(user.id, code, 'phone_verification');
    if (!isValid) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }
    
    // Update user
    await run(
      "UPDATE users SET phone_verified = TRUE WHERE id = ?",
      [user.id]
    );
    
    res.json({ message: 'Téléphone vérifié avec succès' });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du téléphone' });
  }
});

// Send phone verification
router.post('/send-phone-verification', rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Trop de tentatives. Réessayez dans 5 minutes.' }
}), async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Téléphone requis' });
    }
    
    // Get user by phone
    const user = await get("SELECT id FROM users WHERE phone = ?", [phone]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Create OTP
    const otpCode = await AuthService.createOTP(user.id, 'phone_verification');
    
    // Send SMS
    const formattedPhone = formatPhoneNumber(phone);
    await sendSMS(formattedPhone, `Code de vérification ShopTheBarber: ${otpCode}. Expire dans 10 minutes.`);
    
    res.json({ message: 'Code de vérification envoyé' });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code de vérification' });
  }
});

// Forgot password via email
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    const result = await AuthService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

// Forgot password via SMS
router.post('/forgot-password-sms', passwordResetLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }
    
    // Get user by phone
    const user = await get("SELECT id, email FROM users WHERE phone = ?", [phone]);
    if (!user) {
      // Don't reveal if phone exists
      return res.json({ message: 'Si ce numéro existe, un code de réinitialisation a été envoyé' });
    }
    
    // Create OTP for password reset
    const otpCode = await AuthService.createOTP(user.id, 'reset_password_sms');
    
    // Send SMS
    const formattedPhone = formatPhoneNumber(phone);
    await sendSMS(formattedPhone, `Code de réinitialisation ShopTheBarber: ${otpCode}. Expire dans 10 minutes.`);
    
    res.json({ message: 'Si ce numéro existe, un code de réinitialisation a été envoyé' });
  } catch (error) {
    console.error('Forgot password SMS error:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

// Reset password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email, code, newPassword, phone } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    }
    
    let result;
    if (email && code) {
      // Reset via email
      result = await AuthService.resetPassword(email, code, newPassword);
    } else if (phone && code) {
      // Reset via SMS
      const user = await get("SELECT id FROM users WHERE phone = ?", [phone]);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const isValid = await AuthService.verifyOTP(user.id, code, 'reset_password_sms');
      if (!isValid) {
        return res.status(400).json({ error: 'Code invalide ou expiré' });
      }
      
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.errors.join(', ') });
      }
      
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await run(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [hashedPassword, user.id]
      );
      
      result = { message: 'Mot de passe réinitialisé avec succès' };
    } else {
      return res.status(400).json({ error: 'Email/phone et code requis' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { email, code, phone } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code requis' });
    }
    
    let user;
    let isValid = false;
    
    if (email) {
      user = await get("SELECT id FROM users WHERE email = ?", [email]);
      if (user) {
        isValid = await AuthService.verifyOTP(user.id, code, 'reset_password');
      }
    } else if (phone) {
      user = await get("SELECT id FROM users WHERE phone = ?", [phone]);
      if (user) {
        isValid = await AuthService.verifyOTP(user.id, code, 'reset_password_sms');
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (!isValid) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }
    
    res.json({ message: 'Code valide', valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router; 