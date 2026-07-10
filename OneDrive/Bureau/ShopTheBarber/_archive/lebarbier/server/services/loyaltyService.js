// Loyalty and Gift Card Service
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const LoyaltyService = {
  async getPoints(userId) {
    const row = await db.get('SELECT points FROM loyalty_points WHERE user_id = ?', [userId]);
    return row ? row.points : 0;
  },

  async addPoints(userId, points, description = '', relatedId = null, type = 'earn') {
    await db.run('INSERT INTO loyalty_transactions (user_id, points, type, description, related_id) VALUES (?, ?, ?, ?, ?)', [userId, points, type, description, relatedId]);
    await db.run('INSERT INTO loyalty_points (user_id, points) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET points = points + excluded.points, updated_at = CURRENT_TIMESTAMP', [userId, points]);
  },

  async redeemPoints(userId, points, description = '', relatedId = null) {
    const current = await this.getPoints(userId);
    if (current < points) throw new Error('Not enough points');
    await db.run('INSERT INTO loyalty_transactions (user_id, points, type, description, related_id) VALUES (?, ?, ?, ?, ?)', [userId, -points, 'redeem', description, relatedId]);
    await db.run('UPDATE loyalty_points SET points = points - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [points, userId]);
  },

  async getTransactions(userId) {
    return db.all('SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },

  async createGiftCard(senderId, recipientEmail, amount, message = '', currency = 'points') {
    const code = uuidv4();
    const recipient = await db.get('SELECT id FROM users WHERE email = ?', [recipientEmail]);
    await db.run('INSERT INTO gift_cards (code, sender_id, recipient_id, amount, currency, message) VALUES (?, ?, ?, ?, ?, ?)', [code, senderId, recipient ? recipient.id : null, amount, currency, message]);
    if (currency === 'points') await this.redeemPoints(senderId, amount, 'Gift card sent', null);
    return code;
  },

  async redeemGiftCard(userId, code) {
    const card = await db.get('SELECT * FROM gift_cards WHERE code = ? AND is_redeemed = 0', [code]);
    if (!card) throw new Error('Invalid or already redeemed');
    await db.run('UPDATE gift_cards SET is_redeemed = 1, redeemed_at = CURRENT_TIMESTAMP, recipient_id = ? WHERE id = ?', [userId, card.id]);
    if (card.currency === 'points') await this.addPoints(userId, card.amount, 'Gift card redeemed', card.id, 'gift');
    // For currency, handle wallet/cash logic
  },

  async getGiftCards(userId) {
    return db.all('SELECT * FROM gift_cards WHERE sender_id = ? OR recipient_id = ?', [userId, userId]);
  }
};

module.exports = LoyaltyService; 