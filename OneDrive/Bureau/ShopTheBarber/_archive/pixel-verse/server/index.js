import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { query, get, run } from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, city, address, role } = req.body;
    
    // Validation des champs requis
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Tous les champs obligatoires doivent être remplis',
        required: ['email', 'password', 'firstName', 'lastName']
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Check if user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Validate role
    const allowedRoles = ['client', 'barber', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'client';

    // Insert user
    const result = await run(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, city, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, phone || null, city || null, address || null, userRole]
    );

    // Generate token
    const token = jwt.sign({ userId: result.id, email, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      message: 'Inscription réussie',
      token, 
      userId: result.id, 
      role: userRole,
      user: {
        id: result.id,
        email,
        firstName,
        lastName,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, userId: user.id, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Services routes
app.get('/api/services', async (req, res) => {
  try {
    const services = await query('SELECT * FROM services ORDER BY category, name');
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des services' });
  }
});

// Barbers routes
app.get('/api/barbers', async (req, res) => {
  try {
    const { services, location, locationType } = req.query;
    
    let sql = `
      SELECT DISTINCT b.*, 
             GROUP_CONCAT(s.name) as service_names,
             GROUP_CONCAT(bs.price) as service_prices
      FROM barbers b
      LEFT JOIN barber_services bs ON b.id = bs.barber_id
      LEFT JOIN services s ON bs.service_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (services) {
      const serviceIds = services.split(',');
      conditions.push(`b.id IN (
        SELECT DISTINCT barber_id 
        FROM barber_services 
        WHERE service_id IN (${serviceIds.map(() => '?').join(',')})
      )`);
      params.push(...serviceIds);
    }
    
    if (location) {
      conditions.push('b.location LIKE ?');
      params.push(`%${location}%`);
    }
    
    if (locationType === 'home') {
      conditions.push('b.accepts_home = 1');
    } else if (locationType === 'shop') {
      conditions.push('b.accepts_shop = 1');
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY b.id ORDER BY b.rating DESC';
    
    const barbers = await query(sql, params);
    res.json(barbers);
  } catch (error) {
    console.error('Get barbers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des barbiers' });
  }
});

app.get('/api/barbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const barber = await get(`
      SELECT b.*, 
             GROUP_CONCAT(s.name) as service_names,
             GROUP_CONCAT(bs.price) as service_prices
      FROM barbers b
      LEFT JOIN barber_services bs ON b.id = bs.barber_id
      LEFT JOIN services s ON bs.service_id = s.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [id]);
    
    if (!barber) {
      return res.status(404).json({ error: 'Barbier non trouvé' });
    }
    
    // Get availability
    const availability = await query('SELECT * FROM barber_availability WHERE barber_id = ?', [id]);
    
    // Get reviews
    const reviews = await query(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE r.barber_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);
    
    // Get videos
    const videos = await query(`
      SELECT * FROM barber_videos 
      WHERE barber_id = ? AND is_active = 1
      ORDER BY order_index, created_at DESC
    `, [id]);
    
    // Get published articles by this barber
    const articles = await query(`
      SELECT ba.*, GROUP_CONCAT(ac.name) as categories
      FROM blog_articles ba
      LEFT JOIN article_category_relations acr ON ba.id = acr.article_id
      LEFT JOIN article_categories ac ON acr.category_id = ac.id
      WHERE ba.author_id = ? AND ba.status = 'published'
      GROUP BY ba.id
      ORDER BY ba.published_at DESC
      LIMIT 5
    `, [barber.user_id]);
    
    res.json({ ...barber, availability, reviews, videos, articles });
  } catch (error) {
    console.error('Get barber error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du barbier' });
  }
});

// Upload image endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      message: 'Image uploadée avec succès',
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
});

// Appointments routes
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { barberId, services, date, time, locationType, address, notes, referenceImage } = req.body;
    const clientId = req.user.userId;
    
    // Calculate total price
    const servicePrices = await query(`
      SELECT SUM(bs.price) as total
      FROM barber_services bs
      WHERE bs.barber_id = ? AND bs.service_id IN (${services.map(() => '?').join(',')})
    `, [barberId, ...services]);
    
    const totalPrice = servicePrices[0].total || 0;
    
    // Create appointment
    const appointmentResult = await run(`
      INSERT INTO appointments (client_id, barber_id, appointment_date, appointment_time, location_type, address, total_price, notes, reference_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientId, barberId, date, time, locationType, address, totalPrice, notes, referenceImage || null]);
    
    // Add appointment services
    for (const serviceId of services) {
      const servicePrice = await get('SELECT price FROM barber_services WHERE barber_id = ? AND service_id = ?', [barberId, serviceId]);
      await run('INSERT INTO appointment_services (appointment_id, service_id, price) VALUES (?, ?, ?)', 
        [appointmentResult.id, serviceId, servicePrice.price]);
    }
    
    res.json({ appointmentId: appointmentResult.id, message: 'Réservation créée avec succès' });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
});

app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId;
    
    const appointments = await query(`
      SELECT a.*, b.name as barber_name, b.salon_name, b.image_url,
             GROUP_CONCAT(s.name) as service_names
      FROM appointments a
      JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      WHERE a.client_id = ?
      GROUP BY a.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [clientId]);
    
    // Add full URL for reference images
    const appointmentsWithImageUrls = appointments.map(appointment => ({
      ...appointment,
      reference_image: appointment.reference_image ? `http://localhost:3001${appointment.reference_image}` : null
    }));
    
    res.json(appointmentsWithImageUrls);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

app.put('/api/appointments/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    
    const result = await run(`
      UPDATE appointments 
      SET status = 'cancelled' 
      WHERE id = ? AND client_id = ?
    `, [id, clientId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    res.json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

// Reviews routes
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { appointmentId, barberId, rating, comment } = req.body;
    const clientId = req.user.userId;
    
    const result = await run(`
      INSERT INTO reviews (appointment_id, client_id, barber_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [appointmentId, clientId, barberId, rating, comment]);
    
    // Update barber rating
    const avgRating = await get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews WHERE barber_id = ?
    `, [barberId]);
    
    await run(`
      UPDATE barbers 
      SET rating = ?, review_count = ?
      WHERE id = ?
    `, [avgRating.avg_rating, avgRating.review_count, barberId]);
    
    res.json({ message: 'Avis ajouté avec succès' });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'avis' });
  }
});

// Favorites routes
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { barberId } = req.body;
    const clientId = req.user.userId;
    
    await run(`
      INSERT OR IGNORE INTO favorites (client_id, barber_id)
      VALUES (?, ?)
    `, [clientId, barberId]);
    
    res.json({ message: 'Barbier ajouté aux favoris' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout aux favoris' });
  }
});

app.delete('/api/favorites/:barberId', authenticateToken, async (req, res) => {
  try {
    const { barberId } = req.params;
    const clientId = req.user.userId;
    
    await run(`
      DELETE FROM favorites 
      WHERE client_id = ? AND barber_id = ?
    `, [clientId, barberId]);
    
    res.json({ message: 'Barbier retiré des favoris' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des favoris' });
  }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId;
    
    const favorites = await query(`
      SELECT b.*, f.created_at as favorited_at
      FROM favorites f
      JOIN barbers b ON f.barber_id = b.id
      WHERE f.client_id = ?
      ORDER BY f.created_at DESC
    `, [clientId]);
    
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des favoris' });
  }
});

// Notifications routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await query(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const total = await query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [userId]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to create notifications
async function createNotification(userId, title, message, type = 'info') {
  try {
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [userId, title, message, type]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// User profile routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await get('SELECT id, email, first_name, last_name, phone, city, address, avatar_url, role FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // If user is a barber, get barber profile
    if (user.role === 'barber') {
      const barber = await get('SELECT * FROM barbers WHERE user_id = ?', [userId]);
      if (barber) {
        user.barberProfile = barber;
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, city, address } = req.body;
    
    await run(`
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, city = ?, address = ?
      WHERE id = ?
    `, [firstName, lastName, phone, city, address, userId]);
    
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Barber profile creation route
app.post('/api/barber-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, salon_name, description, location, accepts_home, accepts_shop, services } = req.body;
    
    // Check if user is a barber
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.role !== 'barber') {
      return res.status(403).json({ error: 'Seuls les barbiers peuvent créer un profil barbier' });
    }
    
    // Check if barber profile already exists
    const existingBarber = await get('SELECT id FROM barbers WHERE user_id = ?', [userId]);
    if (existingBarber) {
      return res.status(400).json({ error: 'Profil barbier déjà existant' });
    }
    
    // Create barber profile
    const barberResult = await run(`
      INSERT INTO barbers (user_id, name, salon_name, description, location, accepts_home, accepts_shop)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, name, salon_name, description, location, accepts_home ? 1 : 0, accepts_shop ? 1 : 0]);
    
    // Add services with prices
    if (services && services.length > 0) {
      for (const service of services) {
        await run(`
          INSERT INTO barber_services (barber_id, service_id, price)
          VALUES (?, ?, ?)
        `, [barberResult.id, service.serviceId, service.price]);
      }
    }
    
    res.json({ 
      message: 'Profil barbier créé avec succès',
      barberId: barberResult.id 
    });
  } catch (error) {
    console.error('Create barber profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du profil barbier' });
  }
});

// User settings routes
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user settings from database
    const settings = await get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        notifications: {
          email: true,
          sms: false,
          push: true,
          booking_reminders: true,
          promotional_emails: false
        },
        privacy: {
          profile_visibility: 'public',
          show_phone: false,
          show_email: false,
          allow_reviews: true,
          allow_contact: true
        },
        app: {
          theme: 'dark',
          language: 'fr',
          timezone: 'Africa/Casablanca',
          currency: 'MAD',
          date_format: 'DD/MM/YYYY',
          time_format: '24h'
        }
      };
      
      await run(`
        INSERT INTO user_settings (user_id, notifications, privacy, app)
        VALUES (?, ?, ?, ?)
      `, [userId, JSON.stringify(defaultSettings.notifications), JSON.stringify(defaultSettings.privacy), JSON.stringify(defaultSettings.app)]);
      
      res.json(defaultSettings);
    } else {
      res.json({
        notifications: JSON.parse(settings.notifications || '{}'),
        privacy: JSON.parse(settings.privacy || '{}'),
        app: JSON.parse(settings.app || '{}')
      });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notifications, privacy, app } = req.body;
    
    // Update or create user settings
    await run(`
      INSERT OR REPLACE INTO user_settings (user_id, notifications, privacy, app)
      VALUES (?, ?, ?, ?)
    `, [userId, JSON.stringify(notifications), JSON.stringify(privacy), JSON.stringify(app)]);
    
    res.json({ message: 'Paramètres mis à jour avec succès' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Barber settings routes
app.get('/api/barber-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is a barber
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.role !== 'barber') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Get barber profile and settings
    const barber = await get('SELECT * FROM barbers WHERE user_id = ?', [userId]);
    const settings = await get('SELECT * FROM barber_settings WHERE user_id = ?', [userId]);
    
    if (!settings) {
      // Create default barber settings
      const defaultSettings = {
        business: {
          auto_accept_bookings: false,
          require_deposit: false,
          deposit_percentage: 20,
          cancellation_policy: '24h',
          allow_walk_ins: true
        },
        notifications: {
          booking_requests: true,
          booking_reminders: true,
          review_notifications: true,
          new_client_alerts: true
        }
      };
      
      await run(`
        INSERT INTO barber_settings (user_id, business, notifications)
        VALUES (?, ?, ?)
      `, [userId, JSON.stringify(defaultSettings.business), JSON.stringify(defaultSettings.notifications)]);
      
      res.json({ barber, settings: defaultSettings });
    } else {
      res.json({
        barber,
        settings: {
          business: JSON.parse(settings.business || '{}'),
          notifications: JSON.parse(settings.notifications || '{}')
        }
      });
    }
  } catch (error) {
    console.error('Get barber settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres barbier' });
  }
});

app.put('/api/barber-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { barberProfile, business, notifications } = req.body;
    
    // Check if user is a barber
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.role !== 'barber') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Update barber profile
    if (barberProfile) {
      await run(`
        UPDATE barbers 
        SET salon_name = ?, description = ?, location = ?, accepts_home = ?, accepts_shop = ?
        WHERE user_id = ?
      `, [barberProfile.salonName, barberProfile.description, barberProfile.location, 
          barberProfile.acceptsHome ? 1 : 0, barberProfile.acceptsShop ? 1 : 0, userId]);
    }
    
    // Update barber settings
    await run(`
      INSERT OR REPLACE INTO barber_settings (user_id, business, notifications)
      VALUES (?, ?, ?)
    `, [userId, JSON.stringify(business), JSON.stringify(notifications)]);
    
    res.json({ message: 'Paramètres barbier mis à jour avec succès' });
  } catch (error) {
    console.error('Update barber settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres barbier' });
  }
});

// Admin settings routes
app.get('/api/admin-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Get admin settings
    const settings = await get('SELECT * FROM admin_settings WHERE user_id = ?', [userId]);
    
    if (!settings) {
      // Create default admin settings
      const defaultSettings = {
        system: {
          maintenance_mode: false,
          registration_enabled: true,
          email_verification: true,
          max_login_attempts: 5,
          session_timeout: 24
        },
        security: {
          two_factor_auth: true,
          brute_force_protection: true,
          rate_limiting: true
        },
        moderation: {
          auto_moderation: true,
          profanity_filter: true,
          review_threshold: 3
        }
      };
      
      await run(`
        INSERT INTO admin_settings (user_id, system, security, moderation)
        VALUES (?, ?, ?, ?)
      `, [userId, JSON.stringify(defaultSettings.system), JSON.stringify(defaultSettings.security), JSON.stringify(defaultSettings.moderation)]);
      
      res.json(defaultSettings);
    } else {
      res.json({
        system: JSON.parse(settings.system || '{}'),
        security: JSON.parse(settings.security || '{}'),
        moderation: JSON.parse(settings.moderation || '{}')
      });
    }
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres admin' });
  }
});

app.put('/api/admin-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { system, security, moderation } = req.body;
    
    // Check if user is admin
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Update admin settings
    await run(`
      INSERT OR REPLACE INTO admin_settings (user_id, system, security, moderation)
      VALUES (?, ?, ?, ?)
    `, [userId, JSON.stringify(system), JSON.stringify(security), JSON.stringify(moderation)]);
    
    res.json({ message: 'Paramètres admin mis à jour avec succès' });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres admin' });
  }
});

// Change password route
app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    // Get current user
    const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
    
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// Analytics and Reports routes
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    
    let analytics = {};
    
    if (user.role === 'admin') {
      // Admin analytics
      const totalUsers = await get('SELECT COUNT(*) as count FROM users');
      const totalBarbers = await get('SELECT COUNT(*) as count FROM barbers');
      const totalAppointments = await get('SELECT COUNT(*) as count FROM appointments');
      const totalRevenue = await get('SELECT SUM(total_price) as total FROM appointments WHERE status = "completed"');
      const monthlyAppointments = await query(`
        SELECT strftime('%Y-%m', appointment_date) as month, COUNT(*) as count
        FROM appointments 
        WHERE appointment_date >= date('now', '-6 months')
        GROUP BY month
        ORDER BY month
      `);
      const topServices = await query(`
        SELECT s.name, COUNT(*) as count
        FROM appointment_services aps
        JOIN services s ON aps.service_id = s.id
        JOIN appointments a ON aps.appointment_id = a.id
        WHERE a.status = 'completed'
        GROUP BY s.id
        ORDER BY count DESC
        LIMIT 5
      `);
      
      analytics = {
        totalUsers: totalUsers.count,
        totalBarbers: totalBarbers.count,
        totalAppointments: totalAppointments.count,
        totalRevenue: totalRevenue.total || 0,
        monthlyAppointments,
        topServices
      };
    } else if (user.role === 'barber') {
      // Barber analytics
      const barber = await get('SELECT id FROM barbers WHERE user_id = ?', [userId]);
      if (!barber) {
        return res.status(404).json({ error: 'Profil barbier non trouvé' });
      }
      
      const totalAppointments = await get('SELECT COUNT(*) as count FROM appointments WHERE barber_id = ?', [barber.id]);
      const completedAppointments = await get('SELECT COUNT(*) as count FROM appointments WHERE barber_id = ? AND status = "completed"', [barber.id]);
      const totalRevenue = await get('SELECT SUM(total_price) as total FROM appointments WHERE barber_id = ? AND status = "completed"', [barber.id]);
      const avgRating = await get('SELECT AVG(rating) as avg FROM reviews WHERE barber_id = ?', [barber.id]);
      const monthlyRevenue = await query(`
        SELECT strftime('%Y-%m', appointment_date) as month, SUM(total_price) as revenue
        FROM appointments 
        WHERE barber_id = ? AND status = 'completed' AND appointment_date >= date('now', '-6 months')
        GROUP BY month
        ORDER BY month
      `, [barber.id]);
      const topServices = await query(`
        SELECT s.name, COUNT(*) as count, AVG(aps.price) as avg_price
        FROM appointment_services aps
        JOIN services s ON aps.service_id = s.id
        JOIN appointments a ON aps.appointment_id = a.id
        WHERE a.barber_id = ? AND a.status = 'completed'
        GROUP BY s.id
        ORDER BY count DESC
        LIMIT 5
      `, [barber.id]);
      
      analytics = {
        totalAppointments: totalAppointments.count,
        completedAppointments: completedAppointments.count,
        totalRevenue: totalRevenue.total || 0,
        avgRating: avgRating.avg || 0,
        monthlyRevenue,
        topServices
      };
    } else {
      // Client analytics
      const totalBookings = await get('SELECT COUNT(*) as count FROM appointments WHERE client_id = ?', [userId]);
      const completedBookings = await get('SELECT COUNT(*) as count FROM appointments WHERE client_id = ? AND status = "completed"', [userId]);
      const totalSpent = await get('SELECT SUM(total_price) as total FROM appointments WHERE client_id = ? AND status = "completed"', [userId]);
      const favoriteBarbers = await get('SELECT COUNT(*) as count FROM favorites WHERE client_id = ?', [userId]);
      const monthlySpending = await query(`
        SELECT strftime('%Y-%m', appointment_date) as month, SUM(total_price) as spent
        FROM appointments 
        WHERE client_id = ? AND status = 'completed' AND appointment_date >= date('now', '-6 months')
        GROUP BY month
        ORDER BY month
      `, [userId]);
      const topBarbers = await query(`
        SELECT b.name, b.salon_name, COUNT(*) as bookings, AVG(r.rating) as avg_rating
        FROM appointments a
        JOIN barbers b ON a.barber_id = b.id
        LEFT JOIN reviews r ON a.id = r.appointment_id
        WHERE a.client_id = ? AND a.status = 'completed'
        GROUP BY b.id
        ORDER BY bookings DESC
        LIMIT 5
      `, [userId]);
      
      analytics = {
        totalBookings: totalBookings.count,
        completedBookings: completedBookings.count,
        totalSpent: totalSpent.total || 0,
        favoriteBarbers: favoriteBarbers.count,
        monthlySpending,
        topBarbers
      };
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des analytics' });
  }
});

app.get('/api/analytics/revenue', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    const { period = 'monthly' } = req.query;
    
    let revenueData = [];
    
    if (user.role === 'admin') {
      // Admin revenue analytics
      if (period === 'monthly') {
        revenueData = await query(`
          SELECT strftime('%Y-%m', appointment_date) as period, 
                 SUM(total_price) as revenue,
                 COUNT(*) as appointments
          FROM appointments 
          WHERE status = 'completed' AND appointment_date >= date('now', '-12 months')
          GROUP BY period
          ORDER BY period
        `);
      } else if (period === 'weekly') {
        revenueData = await query(`
          SELECT strftime('%Y-W%W', appointment_date) as period,
                 SUM(total_price) as revenue,
                 COUNT(*) as appointments
          FROM appointments 
          WHERE status = 'completed' AND appointment_date >= date('now', '-12 weeks')
          GROUP BY period
          ORDER BY period
        `);
      }
    } else if (user.role === 'barber') {
      // Barber revenue analytics
      const barber = await get('SELECT id FROM barbers WHERE user_id = ?', [userId]);
      if (!barber) {
        return res.status(404).json({ error: 'Profil barbier non trouvé' });
      }
      
      if (period === 'monthly') {
        revenueData = await query(`
          SELECT strftime('%Y-%m', appointment_date) as period,
                 SUM(total_price) as revenue,
                 COUNT(*) as appointments
          FROM appointments 
          WHERE barber_id = ? AND status = 'completed' AND appointment_date >= date('now', '-12 months')
          GROUP BY period
          ORDER BY period
        `, [barber.id]);
      } else if (period === 'weekly') {
        revenueData = await query(`
          SELECT strftime('%Y-W%W', appointment_date) as period,
                 SUM(total_price) as revenue,
                 COUNT(*) as appointments
          FROM appointments 
          WHERE barber_id = ? AND status = 'completed' AND appointment_date >= date('now', '-12 weeks')
          GROUP BY period
          ORDER BY period
        `, [barber.id]);
      }
    }
    
    res.json(revenueData);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de revenus' });
  }
});

app.get('/api/analytics/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    const { status, period = 'monthly' } = req.query;
    
    let appointmentData = [];
    
    if (user.role === 'admin') {
      // Admin appointment analytics
      let whereClause = 'appointment_date >= date("now", "-6 months")';
      if (status) {
        whereClause += ` AND status = '${status}'`;
      }
      
      if (period === 'monthly') {
        appointmentData = await query(`
          SELECT strftime('%Y-%m', appointment_date) as period,
                 COUNT(*) as count,
                 status
          FROM appointments 
          WHERE ${whereClause}
          GROUP BY period, status
          ORDER BY period
        `);
      } else if (period === 'daily') {
        appointmentData = await query(`
          SELECT strftime('%Y-%m-%d', appointment_date) as period,
                 COUNT(*) as count,
                 status
          FROM appointments 
          WHERE ${whereClause}
          GROUP BY period, status
          ORDER BY period
        `);
      }
    } else if (user.role === 'barber') {
      // Barber appointment analytics
      const barber = await get('SELECT id FROM barbers WHERE user_id = ?', [userId]);
      if (!barber) {
        return res.status(404).json({ error: 'Profil barbier non trouvé' });
      }
      
      let whereClause = `barber_id = ${barber.id} AND appointment_date >= date("now", "-6 months")`;
      if (status) {
        whereClause += ` AND status = '${status}'`;
      }
      
      if (period === 'monthly') {
        appointmentData = await query(`
          SELECT strftime('%Y-%m', appointment_date) as period,
                 COUNT(*) as count,
                 status
          FROM appointments 
          WHERE ${whereClause}
          GROUP BY period, status
          ORDER BY period
        `, [barber.id]);
      } else if (period === 'daily') {
        appointmentData = await query(`
          SELECT strftime('%Y-%m-%d', appointment_date) as period,
                 COUNT(*) as count,
                 status
          FROM appointments 
          WHERE ${whereClause}
          GROUP BY period, status
          ORDER BY period
        `, [barber.id]);
      }
    }
    
    res.json(appointmentData);
  } catch (error) {
    console.error('Appointment analytics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de rendez-vous' });
  }
});

app.get('/api/analytics/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await get('SELECT role FROM users WHERE id = ?', [userId]);
    
    let performanceData = {};
    
    if (user.role === 'admin') {
      // Admin performance analytics
      const topBarbers = await query(`
        SELECT b.name, b.salon_name, 
               COUNT(a.id) as appointments,
               AVG(r.rating) as avg_rating,
               SUM(a.total_price) as revenue
        FROM barbers b
        LEFT JOIN appointments a ON b.id = a.barber_id AND a.status = 'completed'
        LEFT JOIN reviews r ON a.id = r.appointment_id
        GROUP BY b.id
        ORDER BY revenue DESC
        LIMIT 10
      `);
      
      const servicePerformance = await query(`
        SELECT s.name, s.category,
               COUNT(aps.id) as bookings,
               AVG(aps.price) as avg_price
        FROM services s
        LEFT JOIN appointment_services aps ON s.id = aps.service_id
        LEFT JOIN appointments a ON aps.appointment_id = a.id AND a.status = 'completed'
        GROUP BY s.id
        ORDER BY bookings DESC
        LIMIT 10
      `);
      
      performanceData = { topBarbers, servicePerformance };
    } else if (user.role === 'barber') {
      // Barber performance analytics
      const barber = await get('SELECT id FROM barbers WHERE user_id = ?', [userId]);
      if (!barber) {
        return res.status(404).json({ error: 'Profil barbier non trouvé' });
      }
      
      const monthlyPerformance = await query(`
        SELECT strftime('%Y-%m', appointment_date) as month,
               COUNT(*) as appointments,
               AVG(r.rating) as avg_rating,
               SUM(total_price) as revenue
        FROM appointments a
        LEFT JOIN reviews r ON a.id = r.appointment_id
        WHERE a.barber_id = ? AND a.status = 'completed'
        GROUP BY month
        ORDER BY month
      `, [barber.id]);
      
      const serviceBreakdown = await query(`
        SELECT s.name,
               COUNT(aps.id) as bookings,
               AVG(aps.price) as avg_price,
               SUM(aps.price) as total_revenue
        FROM services s
        JOIN appointment_services aps ON s.id = aps.service_id
        JOIN appointments a ON aps.appointment_id = a.id
        WHERE a.barber_id = ? AND a.status = 'completed'
        GROUP BY s.id
        ORDER BY bookings DESC
      `, [barber.id]);
      
      performanceData = { monthlyPerformance, serviceBreakdown };
    }
    
    res.json(performanceData);
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de performance' });
  }
});

// Barber services management
app.get('/api/barber-services/:barberId', authenticateToken, async (req, res) => {
  try {
    const { barberId } = req.params;
    
    // Vérifier que l'utilisateur est le propriétaire du profil barbier
    if (req.user.role !== 'barber' || req.user.userId !== parseInt(barberId)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const services = await query(`
      SELECT bs.*, s.name as service_name, s.category, s.description as service_description
      FROM barber_services bs
      JOIN services s ON bs.service_id = s.id
      WHERE bs.barber_id = ?
      ORDER BY s.category, s.name
    `, [barberId]);
    
    res.json(services);
  } catch (error) {
    console.error('Get barber services error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des services' });
  }
});

app.post('/api/barber-services', authenticateToken, async (req, res) => {
  try {
    const { barberId, serviceId, price, customName, customDescription } = req.body;
    
    // Vérifier que l'utilisateur est le propriétaire du profil barbier
    if (req.user.role !== 'barber' || req.user.userId !== barberId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Vérifier si le service existe déjà pour ce barbier
    const existingService = await get(
      'SELECT id FROM barber_services WHERE barber_id = ? AND service_id = ?',
      [barberId, serviceId]
    );
    
    if (existingService) {
      return res.status(400).json({ error: 'Ce service existe déjà pour ce barbier' });
    }
    
    const result = await run(
      'INSERT INTO barber_services (barber_id, service_id, price, custom_name, custom_description) VALUES (?, ?, ?, ?, ?)',
      [barberId, serviceId, price, customName || null, customDescription || null]
    );
    
    res.status(201).json({ 
      message: 'Service ajouté avec succès',
      serviceId: result.id 
    });
  } catch (error) {
    console.error('Add barber service error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du service' });
  }
});

app.put('/api/barber-services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { price, customName, customDescription } = req.body;
    
    // Vérifier que l'utilisateur est le propriétaire du service
    const service = await get(`
      SELECT bs.* FROM barber_services bs
      JOIN barbers b ON bs.barber_id = b.id
      WHERE bs.id = ? AND b.user_id = ?
    `, [id, req.user.userId]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    await run(
      'UPDATE barber_services SET price = ?, custom_name = ?, custom_description = ? WHERE id = ?',
      [price, customName || null, customDescription || null, id]
    );
    
    res.json({ message: 'Service mis à jour avec succès' });
  } catch (error) {
    console.error('Update barber service error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du service' });
  }
});

app.delete('/api/barber-services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est le propriétaire du service
    const service = await get(`
      SELECT bs.* FROM barber_services bs
      JOIN barbers b ON bs.barber_id = b.id
      WHERE bs.id = ? AND b.user_id = ?
    `, [id, req.user.userId]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    await run('DELETE FROM barber_services WHERE id = ?', [id]);
    
    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Delete barber service error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du service' });
  }
});

// Barber videos routes
app.get('/api/barber-videos/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    
    const videos = await query(`
      SELECT * FROM barber_videos 
      WHERE barber_id = ? AND is_active = 1
      ORDER BY order_index, created_at DESC
    `, [barberId]);
    
    res.json(videos);
  } catch (error) {
    console.error('Get barber videos error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});

app.post('/api/barber-videos', authenticateToken, async (req, res) => {
  try {
    const { barberId, title, description, videoUrl, thumbnailUrl, duration } = req.body;
    
    // Vérifier que l'utilisateur est le propriétaire du profil barbier
    const barber = await get('SELECT id FROM barbers WHERE id = ? AND user_id = ?', [barberId, req.user.userId]);
    if (!barber) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Vérifier le nombre maximum de vidéos (3)
    const videoCount = await get('SELECT COUNT(*) as count FROM barber_videos WHERE barber_id = ? AND is_active = 1', [barberId]);
    if (videoCount.count >= 3) {
      return res.status(400).json({ error: 'Vous ne pouvez pas avoir plus de 3 vidéos actives' });
    }
    
    // Obtenir le prochain order_index
    const maxOrder = await get('SELECT MAX(order_index) as max_order FROM barber_videos WHERE barber_id = ?', [barberId]);
    const nextOrder = (maxOrder.max_order || 0) + 1;
    
    const result = await run(`
      INSERT INTO barber_videos (barber_id, title, description, video_url, thumbnail_url, duration, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [barberId, title, description || null, videoUrl, thumbnailUrl || null, duration || null, nextOrder]);
    
    res.status(201).json({ 
      message: 'Vidéo ajoutée avec succès',
      videoId: result.id 
    });
  } catch (error) {
    console.error('Add barber video error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la vidéo' });
  }
});

app.put('/api/barber-videos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, thumbnailUrl, duration, orderIndex } = req.body;
    
    // Vérifier que l'utilisateur est le propriétaire de la vidéo
    const video = await get(`
      SELECT bv.* FROM barber_videos bv
      JOIN barbers b ON bv.barber_id = b.id
      WHERE bv.id = ? AND b.user_id = ?
    `, [id, req.user.userId]);
    
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }
    
    await run(`
      UPDATE barber_videos 
      SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, duration = ?, order_index = ?
      WHERE id = ?
    `, [title, description || null, videoUrl, thumbnailUrl || null, duration || null, orderIndex || video.order_index, id]);
    
    res.json({ message: 'Vidéo mise à jour avec succès' });
  } catch (error) {
    console.error('Update barber video error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la vidéo' });
  }
});

app.delete('/api/barber-videos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est le propriétaire de la vidéo
    const video = await get(`
      SELECT bv.* FROM barber_videos bv
      JOIN barbers b ON bv.barber_id = b.id
      WHERE bv.id = ? AND b.user_id = ?
    `, [id, req.user.userId]);
    
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }
    
    await run('DELETE FROM barber_videos WHERE id = ?', [id]);
    
    res.json({ message: 'Vidéo supprimée avec succès' });
  } catch (error) {
    console.error('Delete barber video error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la vidéo' });
  }
});

// Blog articles routes
app.get('/api/blog/articles', async (req, res) => {
  try {
    const { status = 'published', category, author, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT ba.*, u.first_name, u.last_name, u.role as author_role,
             GROUP_CONCAT(ac.name) as categories
      FROM blog_articles ba
      JOIN users u ON ba.author_id = u.id
      LEFT JOIN article_category_relations acr ON ba.id = acr.article_id
      LEFT JOIN article_categories ac ON acr.category_id = ac.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status !== 'all') {
      conditions.push('ba.status = ?');
      params.push(status);
    }
    
    if (category) {
      conditions.push('ac.name = ?');
      params.push(category);
    }
    
    if (author) {
      conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ?)');
      params.push(`%${author}%`, `%${author}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY ba.id ORDER BY ba.published_at DESC, ba.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const articles = await query(sql, params);
    
    // Get total count for pagination
    let countSql = `
      SELECT COUNT(DISTINCT ba.id) as total
      FROM blog_articles ba
      JOIN users u ON ba.author_id = u.id
      LEFT JOIN article_category_relations acr ON ba.id = acr.article_id
      LEFT JOIN article_categories ac ON acr.category_id = ac.id
    `;
    
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await get(countSql, params.slice(0, -2));
    
    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get blog articles error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});

app.get('/api/blog/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await get(`
      SELECT ba.*, u.first_name, u.last_name, u.role as author_role,
             GROUP_CONCAT(ac.name) as categories
      FROM blog_articles ba
      JOIN users u ON ba.author_id = u.id
      LEFT JOIN article_category_relations acr ON ba.id = acr.article_id
      LEFT JOIN article_categories ac ON acr.category_id = ac.id
      WHERE ba.id = ?
      GROUP BY ba.id
    `, [id]);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    // Increment view count
    await run('UPDATE blog_articles SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json(article);
  } catch (error) {
    console.error('Get blog article error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

app.post('/api/blog/articles', authenticateToken, async (req, res) => {
  try {
    const { title, content, excerpt, featuredImage, videoUrl, categories, status = 'draft' } = req.body;
    const authorId = req.user.userId;
    const authorType = req.user.role;
    
    // Vérifier que l'utilisateur peut créer des articles
    if (!['barber', 'admin'].includes(authorType)) {
      return res.status(403).json({ error: 'Seuls les barbiers et administrateurs peuvent créer des articles' });
    }
    
    // Créer l'article
    const result = await run(`
      INSERT INTO blog_articles (author_id, author_type, title, content, excerpt, featured_image, video_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [authorId, authorType, title, content, excerpt || null, featuredImage || null, videoUrl || null, status]);
    
    // Ajouter les catégories
    if (categories && categories.length > 0) {
      for (const categoryName of categories) {
        // Vérifier si la catégorie existe
        let category = await get('SELECT id FROM article_categories WHERE name = ?', [categoryName]);
        if (!category) {
          // Créer la catégorie si elle n'existe pas
          const categoryResult = await run('INSERT INTO article_categories (name) VALUES (?)', [categoryName]);
          category = { id: categoryResult.id };
        }
        
        // Lier l'article à la catégorie
        await run('INSERT INTO article_category_relations (article_id, category_id) VALUES (?, ?)', [result.id, category.id]);
      }
    }
    
    res.status(201).json({ 
      message: 'Article créé avec succès',
      articleId: result.id 
    });
  } catch (error) {
    console.error('Create blog article error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
  }
});

app.put('/api/blog/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, featuredImage, videoUrl, categories, status } = req.body;
    
    // Vérifier que l'utilisateur est l'auteur ou un admin
    const article = await get('SELECT author_id, author_type FROM blog_articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    if (article.author_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Mettre à jour l'article
    await run(`
      UPDATE blog_articles 
      SET title = ?, content = ?, excerpt = ?, featured_image = ?, video_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, excerpt || null, featuredImage || null, videoUrl || null, status, id]);
    
    // Mettre à jour les catégories
    if (categories) {
      // Supprimer les anciennes relations
      await run('DELETE FROM article_category_relations WHERE article_id = ?', [id]);
      
      // Ajouter les nouvelles catégories
      if (categories.length > 0) {
        for (const categoryName of categories) {
          let category = await get('SELECT id FROM article_categories WHERE name = ?', [categoryName]);
          if (!category) {
            const categoryResult = await run('INSERT INTO article_categories (name) VALUES (?)', [categoryName]);
            category = { id: categoryResult.id };
          }
          
          await run('INSERT INTO article_category_relations (article_id, category_id) VALUES (?, ?)', [id, category.id]);
        }
      }
    }
    
    res.json({ message: 'Article mis à jour avec succès' });
  } catch (error) {
    console.error('Update blog article error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
  }
});

app.delete('/api/blog/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est l'auteur ou un admin
    const article = await get('SELECT author_id FROM blog_articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    if (article.author_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    await run('DELETE FROM blog_articles WHERE id = ?', [id]);
    
    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    console.error('Delete blog article error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
});

// Blog categories routes
app.get('/api/blog/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM article_categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// Article likes routes
app.post('/api/blog/articles/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Vérifier si l'article existe
    const article = await get('SELECT id FROM blog_articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà liké
    const existingLike = await get('SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?', [id, userId]);
    if (existingLike) {
      return res.status(400).json({ error: 'Vous avez déjà liké cet article' });
    }
    
    // Ajouter le like
    await run('INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)', [id, userId]);
    
    // Incrémenter le compteur de likes
    await run('UPDATE blog_articles SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    
    res.json({ message: 'Article liké avec succès' });
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({ error: 'Erreur lors du like de l\'article' });
  }
});

app.delete('/api/blog/articles/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Supprimer le like
    const result = await run('DELETE FROM article_likes WHERE article_id = ? AND user_id = ?', [id, userId]);
    
    if (result.changes > 0) {
      // Décrémenter le compteur de likes
      await run('UPDATE blog_articles SET likes_count = likes_count - 1 WHERE id = ?', [id]);
    }
    
    res.json({ message: 'Like supprimé avec succès' });
  } catch (error) {
    console.error('Unlike article error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du like' });
  }
});

// Admin barber management routes
app.get('/api/admin/barbers', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const barbers = await query(`
      SELECT 
        b.id,
        b.name,
        b.email,
        b.salon_name,
        b.location,
        b.phone,
        b.rating,
        b.is_verified,
        b.is_active,
        b.created_at,
        b.profile_image,
        COUNT(DISTINCT bs.service_id) as services_count,
        COUNT(DISTINCT a.id) as appointments_count
      FROM barbers b
      LEFT JOIN barber_services bs ON b.id = bs.barber_id
      LEFT JOIN appointments a ON b.id = a.barber_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    
    res.json(barbers);
  } catch (error) {
    console.error('Get admin barbers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des barbiers' });
  }
});

app.patch('/api/admin/barbers/:id/verify', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    const { is_verified } = req.body;
    
    // Vérifier que le barbier existe
    const barber = await get('SELECT id FROM barbers WHERE id = ?', [id]);
    if (!barber) {
      return res.status(404).json({ error: 'Barbier non trouvé' });
    }
    
    // Mettre à jour la vérification
    await run('UPDATE barbers SET is_verified = ? WHERE id = ?', [is_verified, id]);
    
    res.json({ message: 'Statut de vérification mis à jour avec succès' });
  } catch (error) {
    console.error('Toggle barber verification error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la vérification' });
  }
});

app.patch('/api/admin/barbers/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Vérifier que le barbier existe
    const barber = await get('SELECT id FROM barbers WHERE id = ?', [id]);
    if (!barber) {
      return res.status(404).json({ error: 'Barbier non trouvé' });
    }
    
    // Mettre à jour le statut
    await run('UPDATE barbers SET is_active = ? WHERE id = ?', [is_active, id]);
    
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Toggle barber status error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

app.delete('/api/admin/barbers/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    
    // Vérifier que le barbier existe
    const barber = await get('SELECT id FROM barbers WHERE id = ?', [id]);
    if (!barber) {
      return res.status(404).json({ error: 'Barbier non trouvé' });
    }
    
    // Supprimer le barbier
    await run('DELETE FROM barbers WHERE id = ?', [id]);
    
    res.json({ message: 'Barbier supprimé avec succès' });
  } catch (error) {
    console.error('Delete barber error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du barbier' });
  }
});

// User management routes (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const users = await query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        u.is_active,
        u.first_name,
        u.last_name,
        u.phone
      FROM users u
      ORDER BY u.created_at DESC
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

app.patch('/api/users/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour le statut
    await run('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
    
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    
    // Vérifier que l'utilisateur existe
    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    await run('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// Modération de contenu - Routes pour l'admin
app.get('/api/admin/moderation/content', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { type = 'all', status = 'pending_review', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let content = [];
    let total = 0;
    
    if (type === 'all' || type === 'articles') {
      // Récupérer les articles à modérer
      const articlesSql = `
        SELECT ba.*, u.first_name, u.last_name, u.role as author_role,
               GROUP_CONCAT(ac.name) as categories
        FROM blog_articles ba
        JOIN users u ON ba.author_id = u.id
        LEFT JOIN article_category_relations acr ON ba.id = acr.article_id
        LEFT JOIN article_categories ac ON acr.category_id = ac.id
        WHERE ba.status = ?
        GROUP BY ba.id
        ORDER BY ba.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const articles = await query(articlesSql, [status, limit, offset]);
      
      // Compter le total
      const countSql = `
        SELECT COUNT(*) as total
        FROM blog_articles ba
        WHERE ba.status = ?
      `;
      const countResult = await get(countSql, [status]);
      
      content = articles.map(article => ({
        ...article,
        content_type: 'article',
        title: article.title,
        author: `${article.first_name} ${article.last_name}`,
        created_date: article.created_at
      }));
      
      total = countResult.total;
    }
    
    if (type === 'all' || type === 'videos') {
      // Récupérer les vidéos à modérer (si nécessaire)
      const videosSql = `
        SELECT bv.*, b.name as barber_name, b.salon_name
        FROM barber_videos bv
        JOIN barbers b ON bv.barber_id = b.id
        WHERE bv.is_active = 1
        ORDER BY bv.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const videos = await query(videosSql, [limit, offset]);
      
      const videoContent = videos.map(video => ({
        ...video,
        content_type: 'video',
        title: video.title,
        author: video.barber_name,
        created_date: video.created_at
      }));
      
      if (type === 'videos') {
        content = videoContent;
        total = videos.length;
      } else {
        content = [...content, ...videoContent];
        total += videos.length;
      }
    }
    
    res.json({
      content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get moderation content error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du contenu à modérer' });
  }
});

// Modérer un article (accepter/refuser)
app.put('/api/admin/moderation/articles/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'delete'
    
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }
    
    const article = await get('SELECT * FROM blog_articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    let newStatus;
    let message;
    
    switch (action) {
      case 'approve':
        newStatus = 'published';
        message = 'Article approuvé et publié';
        await run(`
          UPDATE blog_articles 
          SET status = ?, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newStatus, id]);
        break;
        
      case 'reject':
        newStatus = 'rejected';
        message = 'Article rejeté';
        await run(`
          UPDATE blog_articles 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newStatus, id]);
        break;
        
      case 'delete':
        await run('DELETE FROM blog_articles WHERE id = ?', [id]);
        message = 'Article supprimé';
        break;
    }
    
    // Créer une notification pour l'auteur
    if (action !== 'delete' && article.author_id) {
      const notificationTitle = action === 'approve' ? 'Article approuvé' : 'Article rejeté';
      const notificationMessage = action === 'approve' 
        ? 'Votre article a été approuvé et publié'
        : `Votre article a été rejeté${reason ? `: ${reason}` : ''}`;
      
      await createNotification(article.author_id, notificationTitle, notificationMessage, 'moderation');
    }
    
    res.json({ message });
  } catch (error) {
    console.error('Moderate article error:', error);
    res.status(500).json({ error: 'Erreur lors de la modération de l\'article' });
  }
});

// Modérer une vidéo (accepter/refuser/supprimer)
app.put('/api/admin/moderation/videos/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'delete'
    
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }
    
    const video = await get('SELECT bv.*, b.user_id FROM barber_videos bv JOIN barbers b ON bv.barber_id = b.id WHERE bv.id = ?', [id]);
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }
    
    let message;
    
    switch (action) {
      case 'approve':
        message = 'Vidéo approuvée';
        await run('UPDATE barber_videos SET is_active = 1 WHERE id = ?', [id]);
        break;
        
      case 'reject':
        message = 'Vidéo rejetée';
        await run('UPDATE barber_videos SET is_active = 0 WHERE id = ?', [id]);
        break;
        
      case 'delete':
        await run('DELETE FROM barber_videos WHERE id = ?', [id]);
        message = 'Vidéo supprimée';
        break;
    }
    
    // Créer une notification pour le barbier
    if (action !== 'delete' && video.user_id) {
      const notificationTitle = action === 'approve' ? 'Vidéo approuvée' : 'Vidéo rejetée';
      const notificationMessage = action === 'approve' 
        ? 'Votre vidéo a été approuvée'
        : `Votre vidéo a été rejetée${reason ? `: ${reason}` : ''}`;
      
      await createNotification(video.user_id, notificationTitle, notificationMessage, 'moderation');
    }
    
    res.json({ message });
  } catch (error) {
    console.error('Moderate video error:', error);
    res.status(500).json({ error: 'Erreur lors de la modération de la vidéo' });
  }
});

// --- MODÉRATION ADMIN ---
// Middleware pour vérifier le rôle admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé à l\'admin' });
  }
  next();
}

// --- Blog Articles ---
// Liste filtrée
app.get('/api/admin/blog-articles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM blog_articles';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const articles = await query(sql, params);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});
// Détail
app.get('/api/admin/blog-articles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const article = await get('SELECT * FROM blog_articles WHERE id = ?', [req.params.id]);
    if (!article) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});
// Accepter
app.put('/api/admin/blog-articles/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE blog_articles SET status = \'published\', published_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
    res.json({ message: 'Article approuvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});
// Refuser
app.put('/api/admin/blog-articles/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE blog_articles SET status = \'rejected\' WHERE id = ?', [req.params.id]);
    res.json({ message: 'Article rejeté' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});
// Supprimer
app.delete('/api/admin/blog-articles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('DELETE FROM blog_articles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Article supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// --- Barber Videos ---
app.get('/api/admin/barber-videos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM barber_videos';
    const params = [];
    if (status) {
      if (status === 'pending') {
        sql += ' WHERE is_active = 0';
      } else if (status === 'active') {
        sql += ' WHERE is_active = 1';
      } else if (status === 'rejected') {
        sql += ' WHERE is_active = 0 AND (status = \'rejected\' OR status IS NULL)';
      }
    }
    sql += ' ORDER BY created_at DESC';
    const videos = await query(sql, params);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});
app.get('/api/admin/barber-videos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const video = await get('SELECT * FROM barber_videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Vidéo non trouvée' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la vidéo' });
  }
});
app.put('/api/admin/barber-videos/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE barber_videos SET is_active = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vidéo approuvée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});
app.put('/api/admin/barber-videos/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE barber_videos SET is_active = 0, status = \'rejected\' WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vidéo rejetée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});
app.delete('/api/admin/barber-videos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('DELETE FROM barber_videos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vidéo supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// --- Avis ---
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM reviews';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const reviews = await query(sql, params);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
});
app.get('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const review = await get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!review) return res.status(404).json({ error: 'Avis non trouvé' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'avis' });
  }
});
app.put('/api/admin/reviews/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE reviews SET status = \'approved\' WHERE id = ?', [req.params.id]);
    res.json({ message: 'Avis approuvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});
app.put('/api/admin/reviews/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('UPDATE reviews SET status = \'rejected\' WHERE id = ?', [req.params.id]);
    res.json({ message: 'Avis rejeté' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});
app.delete('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for build process
export function createServer() {
  return app;
} 