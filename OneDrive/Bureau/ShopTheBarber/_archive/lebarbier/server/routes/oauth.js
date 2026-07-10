import express from 'express';
import passport from '../config/oauth.js';
import { generateOAuthToken } from '../config/oauth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateOAuthToken(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/oauth-callback?token=${token}&provider=google`;
    res.redirect(redirectUrl);
  }
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateOAuthToken(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/oauth-callback?token=${token}&provider=facebook`;
    res.redirect(redirectUrl);
  }
);

// Apple OAuth routes
router.get('/apple', passport.authenticate('apple'));

router.post('/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateOAuthToken(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/oauth-callback?token=${token}&provider=apple`;
    res.redirect(redirectUrl);
  }
);

// OAuth status check
router.get('/status', (req, res) => {
  res.json({
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not configured'
    },
    facebook: {
      enabled: !!process.env.FACEBOOK_APP_ID,
      appId: process.env.FACEBOOK_APP_ID ? 'configured' : 'not configured'
    },
    apple: {
      enabled: !!process.env.APPLE_CLIENT_ID,
      clientId: process.env.APPLE_CLIENT_ID ? 'configured' : 'not configured'
    }
  });
});

export default router; 