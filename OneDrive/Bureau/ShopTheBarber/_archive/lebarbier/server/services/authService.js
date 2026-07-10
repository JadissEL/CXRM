import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { get, run, query } from '../database/db.js';
import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export class AuthService {
  // Password validation
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
    }
    if (!hasUpperCase) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!hasLowerCase) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!hasNumbers) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!hasSpecialChar) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone validation
  static validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Check if user is locked
  static async isUserLocked(email) {
    const user = await get("SELECT locked_until FROM users WHERE email = ?", [email]);
    if (!user) return false;
    
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      const now = new Date();
      return lockedUntil > now;
    }
    return false;
  }

  // Track login attempt
  static async trackLoginAttempt(email, ipAddress, userAgent, success) {
    await run(
      "INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)",
      [email, ipAddress, userAgent, success]
    );

    if (!success) {
      // Update user's login attempts
      await run(
        "UPDATE users SET login_attempts = login_attempts + 1 WHERE email = ?",
        [email]
      );

      // Check if user should be locked
      const user = await get("SELECT login_attempts FROM users WHERE email = ?", [email]);
      if (user && user.login_attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await run(
          "UPDATE users SET locked_until = ? WHERE email = ?",
          [lockUntil.toISOString(), email]
        );
      }
    } else {
      // Reset login attempts on successful login
      await run(
        "UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE email = ?",
        [email]
      );
    }
  }

  // Generate JWT tokens
  static generateTokens(userId, email, role) {
    const accessToken = jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, email, role, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  // Create user session
  static async createSession(userId, accessToken, refreshToken, deviceInfo, ipAddress, userAgent) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await run(
      "INSERT INTO user_sessions (user_id, session_token, refresh_token, device_info, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, accessToken, refreshToken, JSON.stringify(deviceInfo), ipAddress, userAgent, expiresAt.toISOString()]
    );
  }

  // Generate OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create OTP record
  static async createOTP(userId, type, expiresInMinutes = 10) {
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    await run(
      "INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?, ?, ?, ?)",
      [userId, code, type, expiresAt.toISOString()]
    );
    
    return code;
  }

  // Verify OTP
  static async verifyOTP(userId, code, type) {
    const otp = await get(
      "SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND type = ? AND used = FALSE AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1",
      [userId, code, type]
    );

    if (otp) {
      // Mark OTP as used
      await run(
        "UPDATE otp_codes SET used = TRUE WHERE id = ?",
        [otp.id]
      );
      return true;
    }
    return false;
  }

  // Generate TOTP secret for authenticator apps
  static generateTOTPSecret(email) {
    return speakeasy.generateSecret({
      name: `ShopTheBarber (${email})`,
      issuer: 'ShopTheBarber',
      length: 32
    });
  }

  // Generate QR code for authenticator apps
  static async generateQRCode(secret) {
    try {
      return await qrcode.toDataURL(secret.otpauth_url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Verify TOTP code
  static verifyTOTP(token, secret) {
    return speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) of tolerance
    });
  }

  // Send OTP via email
  static async sendOTPEmail(email, code, type = 'login') {
    const subject = type === 'login' ? 'Code de connexion ShopTheBarber' : 'Code de vérification ShopTheBarber';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">ShopTheBarber</h2>
        <p>Votre code de vérification est :</p>
        <h1 style="color: #f59e0b; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">${code}</h1>
        <p>Ce code expire dans 10 minutes.</p>
        <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
      </div>
    `;
    
    return await sendEmail(email, subject, html);
  }

  // Send OTP via SMS
  static async sendOTPSMS(phone, code, type = 'login') {
    const message = `Votre code ShopTheBarber: ${code}. Expire dans 10 minutes.`;
    return await sendSMS(phone, message);
  }

  // Register new user
  static async register(userData, ipAddress, userAgent) {
    const { email, password, firstName, lastName, phone, city, address, role } = userData;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Tous les champs obligatoires doivent être remplis');
    }

    if (!this.validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    if (phone && !this.validatePhone(phone)) {
      throw new Error('Format de téléphone invalide');
    }

    // Check if user already exists
    const existingUser = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser) {
      throw new Error('Email déjà utilisé');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate role
    const allowedRoles = ["client", "barber", "admin"];
    const userRole = allowedRoles.includes(role) ? role : "client";

    // Insert user
    const result = await run(
      "INSERT INTO users (email, password_hash, first_name, last_name, phone, city, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, firstName, lastName, phone || null, city || null, address || null, userRole]
    );

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(result.id, email, userRole);

    // Create session
    await this.createSession(result.id, accessToken, refreshToken, {}, ipAddress, userAgent);

    return {
      message: "Inscription réussie",
      accessToken,
      refreshToken,
      userId: result.id,
      role: userRole,
      user: {
        id: result.id,
        email,
        firstName,
        lastName,
        role: userRole,
        mfaEnabled: false
      }
    };
  }

  // Login user
  static async login(email, password, ipAddress, userAgent, mfaCode = null) {
    // Check if user is locked
    if (await this.isUserLocked(email)) {
      throw new Error('Compte temporairement verrouillé. Réessayez dans 15 minutes.');
    }

    // Get user
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      await this.trackLoginAttempt(email, ipAddress, userAgent, false);
      throw new Error('Email ou mot de passe incorrect');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await this.trackLoginAttempt(email, ipAddress, userAgent, false);
      throw new Error('Email ou mot de passe incorrect');
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaCode) {
        // Generate and send OTP
        const otpCode = await this.createOTP(user.id, 'mfa');
        
        if (user.mfa_method === 'email') {
          await this.sendOTPEmail(user.email, otpCode, 'mfa');
        } else if (user.mfa_method === 'sms' && user.phone) {
          await this.sendOTPSMS(user.phone, otpCode, 'mfa');
        }
        
        throw new Error('MFA_REQUIRED');
      }

      // Verify MFA code
      let mfaValid = false;
      if (user.mfa_method === 'authenticator') {
        mfaValid = this.verifyTOTP(mfaCode, user.mfa_secret);
      } else {
        mfaValid = await this.verifyOTP(user.id, mfaCode, 'mfa');
      }

      if (!mfaValid) {
        await this.trackLoginAttempt(email, ipAddress, userAgent, false);
        throw new Error('Code MFA invalide');
      }
    }

    // Track successful login
    await this.trackLoginAttempt(email, ipAddress, userAgent, true);

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email, user.role);

    // Create session
    await this.createSession(user.id, accessToken, refreshToken, {}, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        city: user.city,
        mfaEnabled: user.mfa_enabled,
        mfaMethod: user.mfa_method
      }
    };
  }

  // Refresh token
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if session exists
      const session = await get(
        "SELECT * FROM user_sessions WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP",
        [refreshToken]
      );

      if (!session) {
        throw new Error('Session expired');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        decoded.userId,
        decoded.email,
        decoded.role
      );

      // Update session
      await run(
        "UPDATE user_sessions SET session_token = ?, refresh_token = ? WHERE id = ?",
        [accessToken, newRefreshToken, session.id]
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout
  static async logout(sessionToken) {
    await run(
      "DELETE FROM user_sessions WHERE session_token = ?",
      [sessionToken]
    );
  }

  // Setup MFA
  static async setupMFA(userId, method) {
    const user = await get("SELECT email, phone FROM users WHERE id = ?", [userId]);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (method === 'authenticator') {
      const secret = this.generateTOTPSecret(user.email);
      const qrCode = await this.generateQRCode(secret);
      
      return {
        secret: secret.base32,
        qrCode,
        otpauthUrl: secret.otpauth_url
      };
    } else if (method === 'email' || method === 'sms') {
      if (method === 'sms' && !user.phone) {
        throw new Error('Numéro de téléphone requis pour l\'authentification SMS');
      }
      
      const otpCode = await this.createOTP(userId, 'mfa_setup');
      
      if (method === 'email') {
        await this.sendOTPEmail(user.email, otpCode, 'mfa_setup');
      } else {
        await this.sendOTPSMS(user.phone, otpCode, 'mfa_setup');
      }
      
      return { message: 'Code envoyé' };
    }
  }

  // Enable MFA
  static async enableMFA(userId, method, code, secret = null) {
    let isValid = false;

    if (method === 'authenticator') {
      if (!secret) {
        throw new Error('Secret requis pour l\'authentificateur');
      }
      isValid = this.verifyTOTP(code, { base32: secret });
    } else {
      isValid = await this.verifyOTP(userId, code, 'mfa_setup');
    }

    if (!isValid) {
      throw new Error('Code invalide');
    }

    // Update user
    await run(
      "UPDATE users SET mfa_enabled = TRUE, mfa_method = ?, mfa_secret = ? WHERE id = ?",
      [method, secret, userId]
    );

    return { message: 'MFA activé avec succès' };
  }

  // Disable MFA
  static async disableMFA(userId, code) {
    const user = await get("SELECT mfa_secret, mfa_method FROM users WHERE id = ?", [userId]);
    if (!user || !user.mfa_enabled) {
      throw new Error('MFA non activé');
    }

    let isValid = false;
    if (user.mfa_method === 'authenticator') {
      isValid = this.verifyTOTP(code, { base32: user.mfa_secret });
    } else {
      isValid = await this.verifyOTP(userId, code, 'mfa_disable');
    }

    if (!isValid) {
      throw new Error('Code invalide');
    }

    // Update user
    await run(
      "UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_method = 'email' WHERE id = ?",
      [userId]
    );

    return { message: 'MFA désactivé avec succès' };
  }

  // Forgot password
  static async forgotPassword(email) {
    const user = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'Si cet email existe, un code de réinitialisation a été envoyé' };
    }

    const otpCode = await this.createOTP(user.id, 'reset_password');
    await this.sendOTPEmail(email, otpCode, 'reset_password');

    return { message: 'Si cet email existe, un code de réinitialisation a été envoyé' };
  }

  // Reset password
  static async resetPassword(email, code, newPassword) {
    const user = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isValid = await this.verifyOTP(user.id, code, 'reset_password');
    if (!isValid) {
      throw new Error('Code invalide ou expiré');
    }

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashedPassword, user.id]
    );

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // Get user sessions
  static async getUserSessions(userId) {
    return await query(
      "SELECT id, device_info, ip_address, user_agent, created_at, expires_at FROM user_sessions WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC",
      [userId]
    );
  }

  // Revoke session
  static async revokeSession(userId, sessionId) {
    await run(
      "DELETE FROM user_sessions WHERE id = ? AND user_id = ?",
      [sessionId, userId]
    );
  }

  // Revoke all sessions except current
  static async revokeAllSessions(userId, currentSessionId) {
    await run(
      "DELETE FROM user_sessions WHERE user_id = ? AND id != ?",
      [userId, currentSessionId]
    );
  }
} 