import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';
import AppleStrategy from 'passport-apple';
import { query, run } from '../database/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [profile.id, profile.emails[0].value]
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      // Update Google ID if not set
      if (!user.google_id) {
        await run(
          'UPDATE users SET google_id = ? WHERE id = ?',
          [profile.id, user.id]
        );
      }
      return done(null, user);
    }

    // Create new user
    const newUser = {
      email: profile.emails[0].value,
      firstName: profile.name.givenName || '',
      lastName: profile.name.familyName || '',
      google_id: profile.id,
      role: 'client',
      email_verified: true,
      created_at: new Date().toISOString()
    };

    const result = await run(
      'INSERT INTO users (email, first_name, last_name, google_id, role, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newUser.email, newUser.firstName, newUser.lastName, newUser.google_id, newUser.role, newUser.email_verified, newUser.created_at]
    );

    newUser.id = result.lastID;
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Configure Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id',
  clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'picture']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE facebook_id = ? OR email = ?',
      [profile.id, profile.emails[0].value]
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      // Update Facebook ID if not set
      if (!user.facebook_id) {
        await run(
          'UPDATE users SET facebook_id = ? WHERE id = ?',
          [profile.id, user.id]
        );
      }
      return done(null, user);
    }

    // Create new user
    const newUser = {
      email: profile.emails[0].value,
      firstName: profile.name.givenName || '',
      lastName: profile.name.familyName || '',
      facebook_id: profile.id,
      role: 'client',
      email_verified: true,
      created_at: new Date().toISOString()
    };

    const result = await run(
      'INSERT INTO users (email, first_name, last_name, facebook_id, role, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newUser.email, newUser.firstName, newUser.lastName, newUser.facebook_id, newUser.role, newUser.email_verified, newUser.created_at]
    );

    newUser.id = result.lastID;
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Configure Apple OAuth Strategy
passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID || 'your-apple-client-id',
  teamID: process.env.APPLE_TEAM_ID || 'your-apple-team-id',
  keyID: process.env.APPLE_KEY_ID || 'your-apple-key-id',
  privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH || './AuthKey_XXXXXXXXXX.p8',
  callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3001/api/auth/apple/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {
  try {
    const email = profile.email || req.body.email;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE apple_id = ? OR email = ?',
      [profile.id, email]
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      // Update Apple ID if not set
      if (!user.apple_id) {
        await run(
          'UPDATE users SET apple_id = ? WHERE id = ?',
          [profile.id, user.id]
        );
      }
      return done(null, user);
    }

    // Create new user
    const newUser = {
      email: email,
      firstName: profile.name?.firstName || '',
      lastName: profile.name?.lastName || '',
      apple_id: profile.id,
      role: 'client',
      email_verified: true,
      created_at: new Date().toISOString()
    };

    const result = await run(
      'INSERT INTO users (email, first_name, last_name, apple_id, role, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newUser.email, newUser.firstName, newUser.lastName, newUser.apple_id, newUser.role, newUser.email_verified, newUser.created_at]
    );

    newUser.id = result.lastID;
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token for OAuth users
export const generateOAuthToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export default passport; 