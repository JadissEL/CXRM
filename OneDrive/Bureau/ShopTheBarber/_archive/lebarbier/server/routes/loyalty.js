const express = require('express');
const LoyaltyService = require('../services/loyaltyService');
const router = express.Router();

// Middleware to get userId from auth (assume req.user.id is set)
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Get current user's loyalty points
router.get('/points', requireAuth, async (req, res) => {
  try {
    const points = await LoyaltyService.getPoints(req.user.id);
    res.json({ points });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get loyalty transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const txs = await LoyaltyService.getTransactions(req.user.id);
    res.json({ transactions: txs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Redeem points
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { points, description } = req.body;
    await LoyaltyService.redeemPoints(req.user.id, points, description);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Create a gift card
router.post('/gift', requireAuth, async (req, res) => {
  try {
    const { recipientEmail, amount, message, currency } = req.body;
    const code = await LoyaltyService.createGiftCard(req.user.id, recipientEmail, amount, message, currency);
    res.json({ code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Redeem a gift card
router.post('/gift/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    await LoyaltyService.redeemGiftCard(req.user.id, code);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all gift cards for user
router.get('/gift', requireAuth, async (req, res) => {
  try {
    const cards = await LoyaltyService.getGiftCards(req.user.id);
    res.json({ giftCards: cards });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router; 