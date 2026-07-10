-- ShopTheBarber Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Made optional for OAuth users
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    address TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT, -- TOTP secret for authenticator apps
    mfa_method TEXT DEFAULT 'email', -- 'email', 'sms', 'authenticator'
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    -- OAuth provider IDs
    google_id TEXT UNIQUE,
    facebook_id TEXT UNIQUE,
    apple_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OTP (One-Time Password) table for MFA
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL, -- 'email', 'sms', 'reset_password'
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    device_info TEXT, -- JSON string with device information
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login attempts tracking for security
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Barbers table
CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    salon_name TEXT NOT NULL,
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    location TEXT NOT NULL,
    latitude DECIMAL(10,8), -- For geolocation search
    longitude DECIMAL(11,8), -- For geolocation search
    accepts_home BOOLEAN DEFAULT FALSE,
    accepts_shop BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    search_tags TEXT, -- JSON array of searchable tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Barber videos table (max 3 videos per barber)
CREATE TABLE IF NOT EXISTS barber_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE
);

-- Blog articles table
CREATE TABLE IF NOT EXISTS blog_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    author_type TEXT NOT NULL, -- 'barber', 'admin'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    video_url TEXT, -- Optional video for the article
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'pending_review', 'rejected'
    published_at DATETIME,
    view_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Article categories table
CREATE TABLE IF NOT EXISTS article_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Article category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS article_category_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE CASCADE,
    UNIQUE(article_id, category_id)
);

-- Article likes table
CREATE TABLE IF NOT EXISTS article_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(article_id, user_id)
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_range TEXT NOT NULL,
    description TEXT
);

-- Barber services (many-to-many relationship)
CREATE TABLE IF NOT EXISTS barber_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    custom_name TEXT,
    custom_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barber_id) REFERENCES barbers(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    UNIQUE(barber_id, service_id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    barber_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    location_type TEXT NOT NULL, -- 'shop' or 'home'
    address TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    reference_image TEXT, -- URL de l'image de référence
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

-- Appointment services (many-to-many relationship)
CREATE TABLE IF NOT EXISTS appointment_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    barber_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    barber_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (barber_id) REFERENCES barbers(id),
    UNIQUE(client_id, barber_id)
);

-- Barber availability table
CREATE TABLE IF NOT EXISTS barber_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

-- Barber special offers table
CREATE TABLE IF NOT EXISTS barber_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL,
    valid_days TEXT, -- JSON array of days
    min_services INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_barber_services_barber_id ON barber_services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_videos_barber_id ON barber_videos(barber_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_author_id ON blog_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notifications TEXT, -- JSON string for notification preferences
    privacy TEXT, -- JSON string for privacy settings
    app TEXT, -- JSON string for app preferences
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- Barber settings table
CREATE TABLE IF NOT EXISTS barber_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business TEXT, -- JSON string for business settings
    notifications TEXT, -- JSON string for notification preferences
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    system TEXT, -- JSON string for system settings
    security TEXT, -- JSON string for security settings
    moderation TEXT, -- JSON string for moderation settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- User profiles table for extended profile information
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    bio TEXT,
    preferences TEXT, -- JSON string for user preferences
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address_type TEXT NOT NULL DEFAULT 'home', -- 'home', 'work', 'other'
    is_default BOOLEAN DEFAULT FALSE,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Morocco',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User payment methods table
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    payment_type TEXT NOT NULL, -- 'card', 'paypal', 'apple_pay', 'google_pay'
    is_default BOOLEAN DEFAULT FALSE,
    card_last_four TEXT, -- Last 4 digits for cards
    card_brand TEXT, -- 'visa', 'mastercard', 'amex', etc.
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    paypal_email TEXT,
    payment_token TEXT, -- Encrypted payment token
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User favorites table (enhanced)
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    favorite_type TEXT NOT NULL, -- 'barber', 'service', 'product'
    favorite_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, favorite_type, favorite_id)
);

-- Loyalty Program Tables
CREATE TABLE IF NOT EXISTS loyalty_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'earn', 'redeem', 'gift', 'admin_adjust'
    description TEXT,
    related_id INTEGER, -- appointment_id, gift_card_id, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gift_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    sender_id INTEGER,
    recipient_id INTEGER,
    amount INTEGER NOT NULL, -- points or currency
    currency TEXT DEFAULT 'points', -- 'points' or 'MAD'
    message TEXT,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default article categories
INSERT OR IGNORE INTO article_categories (name, description) VALUES
('Coiffures', 'Tendances et styles de coiffures'),
('Soins', 'Conseils et produits de soins capillaires'),
('Techniques', 'Techniques professionnelles de coiffure'),
('Tendances', 'Dernières tendances de la mode capillaire'),
('Conseils', 'Conseils pour entretenir ses cheveux'),
('Événements', 'Événements et actualités du secteur');

-- Data Privacy Controls Tables

-- Data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    request_type TEXT NOT NULL, -- 'full', 'profile', 'appointments', 'reviews'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_path TEXT, -- Path to exported file
    file_size INTEGER, -- Size in bytes
    expires_at DATETIME, -- When the export expires
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Account deletion requests
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reason TEXT, -- Optional reason for deletion
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    scheduled_for DATETIME, -- When the account will be deleted
    processed_at DATETIME, -- When the deletion was processed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type TEXT NOT NULL UNIQUE, -- 'user_profiles', 'appointments', 'reviews', 'logs'
    retention_period_days INTEGER NOT NULL, -- How long to keep data
    auto_delete BOOLEAN DEFAULT TRUE, -- Whether to automatically delete
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Privacy consent tracking
CREATE TABLE IF NOT EXISTS privacy_consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    consent_type TEXT NOT NULL, -- 'data_processing', 'marketing', 'analytics', 'third_party'
    granted BOOLEAN NOT NULL,
    version TEXT NOT NULL, -- Version of privacy policy
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Data access logs for audit trail
CREATE TABLE IF NOT EXISTS data_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'export', 'view', 'delete', 'consent_change'
    data_type TEXT NOT NULL, -- What type of data was accessed
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default data retention policies
INSERT OR IGNORE INTO data_retention_policies (data_type, retention_period_days, auto_delete) VALUES
('user_profiles', 2555, TRUE), -- 7 years
('appointments', 1095, TRUE), -- 3 years
('reviews', 1825, TRUE), -- 5 years
('logs', 365, TRUE), -- 1 year
('export_requests', 30, TRUE), -- 30 days
('deletion_requests', 2555, FALSE); -- 7 years, don't auto-delete 

-- Search and filtering indexes
CREATE INDEX IF NOT EXISTS idx_barbers_location ON barbers(location);
CREATE INDEX IF NOT EXISTS idx_barbers_rating ON barbers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_barbers_accepts_home ON barbers(accepts_home);
CREATE INDEX IF NOT EXISTS idx_barbers_accepts_shop ON barbers(accepts_shop);
CREATE INDEX IF NOT EXISTS idx_barbers_is_active ON barbers(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_is_verified ON barbers(is_verified);
CREATE INDEX IF NOT EXISTS idx_barbers_coordinates ON barbers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_barbers_search_tags ON barbers(search_tags);

-- Full-text search index for barber names and descriptions
CREATE VIRTUAL TABLE IF NOT EXISTS barbers_fts USING fts5(
    name, 
    salon_name, 
    description, 
    location,
    content='barbers',
    content_rowid='id'
);

-- Trigger to keep FTS index updated
CREATE TRIGGER IF NOT EXISTS barbers_ai AFTER INSERT ON barbers BEGIN
    INSERT INTO barbers_fts(rowid, name, salon_name, description, location) 
    VALUES (new.id, new.name, new.salon_name, new.description, new.location);
END;

CREATE TRIGGER IF NOT EXISTS barbers_ad AFTER DELETE ON barbers BEGIN
    INSERT INTO barbers_fts(barbers_fts, rowid, name, salon_name, description, location) 
    VALUES('delete', old.id, old.name, old.salon_name, old.description, old.location);
END;

CREATE TRIGGER IF NOT EXISTS barbers_au AFTER UPDATE ON barbers BEGIN
    INSERT INTO barbers_fts(barbers_fts, rowid, name, salon_name, description, location) 
    VALUES('delete', old.id, old.name, old.salon_name, old.description, old.location);
    INSERT INTO barbers_fts(rowid, name, salon_name, description, location) 
    VALUES (new.id, new.name, new.salon_name, new.description, new.location);
END; 