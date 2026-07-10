import express from 'express';
import { query, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
// Simple validation functions (temporary fix for build issues)
const validateProfileUpdate = (data) => {
  if (data.firstName && data.firstName.length < 2) {
    throw new Error('First name must be at least 2 characters');
  }
  if (data.lastName && data.lastName.length < 2) {
    throw new Error('Last name must be at least 2 characters');
  }
  return data;
};

const validateAddress = (data) => {
  if (!data.streetAddress || data.streetAddress.length < 5) {
    throw new Error('Street address must be at least 5 characters');
  }
  if (!data.city || data.city.length < 2) {
    throw new Error('City must be at least 2 characters');
  }
  return data;
};

const validatePaymentMethod = (data) => {
  if (!data.paymentType) {
    throw new Error('Payment type is required');
  }
  return data;
};

const validateFavorite = (data) => {
  if (!data.favoriteType) {
    throw new Error('Favorite type is required');
  }
  if (!data.favoriteId) {
    throw new Error('Favorite ID is required');
  }
  return data;
};

const router = express.Router();

// Apply authentication middleware to all profile routes
router.use(authenticateToken);

// GET /api/profile - Get complete user profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get basic user info
    const [user] = await query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get extended profile
    const [profile] = await query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    // Get addresses
    const addresses = await query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
      [userId]
    );

    // Get payment methods
    const paymentMethods = await query(
      'SELECT * FROM user_payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC',
      [userId]
    );

    // Get favorites
    const favorites = await query(
      'SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Parse JSON fields
    const parsedProfile = profile ? {
      ...profile,
      preferences: profile.preferences ? JSON.parse(profile.preferences) : {}
    } : null;

    const parsedPaymentMethods = paymentMethods.map(pm => ({
      ...pm,
      paymentToken: undefined // Don't send sensitive data
    }));

    res.json({
      ...user,
      profile: parsedProfile,
      addresses,
      paymentMethods: parsedPaymentMethods,
      favorites
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = validateProfileUpdate(req.body);

    // Update basic user info
    if (updateData.firstName || updateData.lastName || updateData.phone || updateData.avatarUrl) {
      const userUpdates = [];
      const userValues = [];
      
      if (updateData.firstName) {
        userUpdates.push('first_name = ?');
        userValues.push(updateData.firstName);
      }
      if (updateData.lastName) {
        userUpdates.push('last_name = ?');
        userValues.push(updateData.lastName);
      }
      if (updateData.phone) {
        userUpdates.push('phone = ?');
        userValues.push(updateData.phone);
      }
      if (updateData.avatarUrl) {
        userUpdates.push('avatar_url = ?');
        userValues.push(updateData.avatarUrl);
      }

      userUpdates.push('updated_at = CURRENT_TIMESTAMP');
      userValues.push(userId);

      await run(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userValues
      );
    }

    // Update extended profile
    if (updateData.profile) {
      const [existingProfile] = await query(
        'SELECT id FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      if (existingProfile) {
        // Update existing profile
        const profileUpdates = [];
        const profileValues = [];
        
        Object.entries(updateData.profile).forEach(([key, value]) => {
          if (value !== undefined) {
            profileUpdates.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
            profileValues.push(key === 'preferences' ? JSON.stringify(value) : value);
          }
        });

        if (profileUpdates.length > 0) {
          profileUpdates.push('updated_at = CURRENT_TIMESTAMP');
          profileValues.push(existingProfile.id);

          await run(
            `UPDATE user_profiles SET ${profileUpdates.join(', ')} WHERE id = ?`,
            profileValues
          );
        }
      } else {
        // Create new profile
        const profileData = {
          user_id: userId,
          ...updateData.profile,
          preferences: updateData.profile.preferences ? JSON.stringify(updateData.profile.preferences) : null
        };

        await run(
          'INSERT INTO user_profiles (user_id, date_of_birth, gender, bio, preferences, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            profileData.user_id,
            profileData.dateOfBirth,
            profileData.gender,
            profileData.bio,
            profileData.preferences,
            profileData.emergencyContactName,
            profileData.emergencyContactPhone,
            profileData.emergencyContactRelationship
          ]
        );
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADDRESSES

// GET /api/profile/addresses - Get user addresses
router.get('/addresses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
      [userId]
    );
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/addresses - Add new address
router.post('/addresses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addressData = validateAddress(req.body);

    // If this is the first address or marked as default, update other addresses
    if (addressData.isDefault) {
      await run(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    const result = await run(
      'INSERT INTO user_addresses (user_id, address_type, is_default, street_address, city, state, postal_code, country, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        addressData.addressType,
        addressData.isDefault,
        addressData.streetAddress,
        addressData.city,
        addressData.state,
        addressData.postalCode,
        addressData.country,
        addressData.latitude,
        addressData.longitude
      ]
    );

    const [newAddress] = await query(
      'SELECT * FROM user_addresses WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Error adding address:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/addresses/:id - Update address
router.put('/addresses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addressId = parseInt(req.params.id);
    const updateData = addressUpdateSchema.parse(req.body);

    // Verify ownership
    const [existingAddress] = await query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, update other addresses
    if (updateData.isDefault) {
      await run(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id != ?',
        [userId, addressId]
      );
    }

    const updates = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updates.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
        values.push(value);
      }
    });

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(addressId);

      await run(
        `UPDATE user_addresses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedAddress] = await query(
      'SELECT * FROM user_addresses WHERE id = ?',
      [addressId]
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile/addresses/:id - Delete address
router.delete('/addresses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addressId = parseInt(req.params.id);

    // Verify ownership
    const [address] = await query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await run(
      'DELETE FROM user_addresses WHERE id = ?',
      [addressId]
    );

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PAYMENT METHODS

// GET /api/profile/payment-methods - Get user payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentMethods = await query(
      'SELECT id, payment_type, is_default, card_last_four, card_brand, card_expiry_month, card_expiry_year, paypal_email, is_active, created_at FROM user_payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC',
      [userId]
    );
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/payment-methods - Add new payment method
router.post('/payment-methods', async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentData = validatePaymentMethod(req.body);

    // If this is the first payment method or marked as default, update others
    if (paymentData.isDefault) {
      await run(
        'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    const result = await run(
      'INSERT INTO user_payment_methods (user_id, payment_type, is_default, card_last_four, card_brand, card_expiry_month, card_expiry_year, paypal_email, payment_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        paymentData.paymentType,
        paymentData.isDefault,
        paymentData.cardLastFour,
        paymentData.cardBrand,
        paymentData.cardExpiryMonth,
        paymentData.cardExpiryYear,
        paymentData.paypalEmail,
        paymentData.paymentToken
      ]
    );

    const [newPaymentMethod] = await query(
      'SELECT id, payment_type, is_default, card_last_four, card_brand, card_expiry_month, card_expiry_year, paypal_email, is_active, created_at FROM user_payment_methods WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newPaymentMethod);
  } catch (error) {
    console.error('Error adding payment method:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/payment-methods/:id - Update payment method
router.put('/payment-methods/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentId = parseInt(req.params.id);
    const updateData = paymentMethodUpdateSchema.parse(req.body);

    // Verify ownership
    const [existingPayment] = await query(
      'SELECT * FROM user_payment_methods WHERE id = ? AND user_id = ?',
      [paymentId, userId]
    );

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // If setting as default, update others
    if (updateData.isDefault) {
      await run(
        'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ? AND id != ?',
        [userId, paymentId]
      );
    }

    const updates = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updates.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
        values.push(value);
      }
    });

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(paymentId);

      await run(
        `UPDATE user_payment_methods SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedPayment] = await query(
      'SELECT id, payment_type, is_default, card_last_four, card_brand, card_expiry_month, card_expiry_year, paypal_email, is_active, created_at FROM user_payment_methods WHERE id = ?',
      [paymentId]
    );

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment method:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile/payment-methods/:id - Delete payment method
router.delete('/payment-methods/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentId = parseInt(req.params.id);

    // Verify ownership
    const [payment] = await query(
      'SELECT * FROM user_payment_methods WHERE id = ? AND user_id = ?',
      [paymentId, userId]
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Soft delete by setting is_active to false
    await run(
      'UPDATE user_payment_methods SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [paymentId]
    );

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FAVORITES

// GET /api/profile/favorites - Get user favorites
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.query;

    let query = 'SELECT * FROM user_favorites WHERE user_id = ?';
    let params = [userId];

    if (type) {
      query += ' AND favorite_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const favorites = await query(query, params);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/favorites - Add new favorite
router.post('/favorites', async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteData = validateFavorite(req.body);

    const result = await run(
      'INSERT INTO user_favorites (user_id, favorite_type, favorite_id, notes) VALUES (?, ?, ?, ?)',
      [userId, favoriteData.favoriteType, favoriteData.favoriteId, favoriteData.notes]
    );

    const [newFavorite] = await query(
      'SELECT * FROM user_favorites WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newFavorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Favorite already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/favorites/:id - Update favorite
router.put('/favorites/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteId = parseInt(req.params.id);
    const updateData = favoriteUpdateSchema.parse(req.body);

    // Verify ownership
    const [existingFavorite] = await query(
      'SELECT * FROM user_favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId]
    );

    if (!existingFavorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    const updates = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updates.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
        values.push(value);
      }
    });

    if (updates.length > 0) {
      values.push(favoriteId);

      await run(
        `UPDATE user_favorites SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedFavorite] = await query(
      'SELECT * FROM user_favorites WHERE id = ?',
      [favoriteId]
    );

    res.json(updatedFavorite);
  } catch (error) {
    console.error('Error updating favorite:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile/favorites/:id - Delete favorite
router.delete('/favorites/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteId = parseInt(req.params.id);

    // Verify ownership
    const [favorite] = await query(
      'SELECT * FROM user_favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId]
    );

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await run(
      'DELETE FROM user_favorites WHERE id = ?',
      [favoriteId]
    );

    res.json({ message: 'Favorite deleted successfully' });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 