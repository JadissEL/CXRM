-- Service Catalog Enhancement Migration
-- Adds missing fields and optimizations for the Service Catalog feature

-- Add missing columns to services table if they don't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[],
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 0, -- Minutes needed before service
ADD COLUMN IF NOT EXISTS cleanup_time INTEGER DEFAULT 0; -- Minutes needed after service

-- Create service categories table for better organization
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT, -- For UI icons
    color_code TEXT, -- For UI theming
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO service_categories (name, description, icon_name, color_code, display_order) VALUES
('haircut', 'Hair cutting and styling services', 'scissors', '#3B82F6', 1),
('beard_trim', 'Beard trimming and grooming', 'beard', '#10B981', 2),
('shave', 'Traditional and modern shaving services', 'razor', '#F59E0B', 3),
('styling', 'Hair styling and finishing', 'styling', '#8B5CF6', 4),
('coloring', 'Hair coloring and highlights', 'palette', '#EF4444', 5),
('treatment', 'Hair and scalp treatments', 'treatment', '#06B6D4', 6),
('consultation', 'Style consultation and advice', 'chat', '#84CC16', 7),
('package', 'Service packages and combos', 'package', '#F97316', 8),
('other', 'Other specialized services', 'more', '#6B7280', 9)
ON CONFLICT (name) DO NOTHING;

-- Create service add-ons table for optional extras
CREATE TABLE IF NOT EXISTS service_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER DEFAULT 0, -- Additional minutes
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service reviews table (separate from barber reviews)
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    would_recommend BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, service_id, appointment_id)
);

-- Create service availability table for specific service scheduling
CREATE TABLE IF NOT EXISTS service_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, day_of_week, start_time)
);

-- Add foreign key constraint for category if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'services_category_fkey'
    ) THEN
        ALTER TABLE services 
        ADD CONSTRAINT services_category_fkey 
        FOREIGN KEY (category) REFERENCES service_categories(name);
    END IF;
END $$;

-- Create optimized indexes for service catalog
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_price_range ON services(price) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_duration_range ON services(duration) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_barber_active ON services(barber_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_booking_enabled ON services(booking_enabled) WHERE booking_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_name_search ON services USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_services_description_search ON services USING GIN (to_tsvector('english', description));

-- Service categories indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, display_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);

-- Service add-ons indexes
CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_addons_required ON service_addons(service_id, is_required) WHERE is_required = TRUE;

-- Service reviews indexes
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(service_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_service_reviews_verified ON service_reviews(service_id, is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_reviews_created_at ON service_reviews(service_id, created_at DESC);

-- Service availability indexes
CREATE INDEX IF NOT EXISTS idx_service_availability_service_day ON service_availability(service_id, day_of_week, is_available);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_addons_updated_at 
    BEFORE UPDATE ON service_addons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at 
    BEFORE UPDATE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update service rating from reviews
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calculate new average rating and count
    SELECT 
        ROUND(AVG(rating)::numeric, 2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM service_reviews 
    WHERE service_id = COALESCE(NEW.service_id, OLD.service_id);
    
    -- Update service with calculated rating (add rating column if it doesn't exist)
    BEGIN
        UPDATE services 
        SET rating = COALESCE(avg_rating, 0.00)
        WHERE id = COALESCE(NEW.service_id, OLD.service_id);
    EXCEPTION
        WHEN undefined_column THEN
            -- Add rating column if it doesn't exist
            ALTER TABLE services ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
            UPDATE services 
            SET rating = COALESCE(avg_rating, 0.00)
            WHERE id = COALESCE(NEW.service_id, OLD.service_id);
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for service rating updates
CREATE TRIGGER update_service_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Function to get service availability for a specific date
CREATE OR REPLACE FUNCTION get_service_availability(
    p_service_id UUID,
    p_date DATE
)
RETURNS TABLE(
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
DECLARE
    day_of_week INTEGER;
BEGIN
    -- Get day of week (0 = Sunday)
    day_of_week := EXTRACT(DOW FROM p_date);
    
    RETURN QUERY
    SELECT 
        sa.start_time,
        sa.end_time,
        sa.is_available
    FROM service_availability sa
    WHERE sa.service_id = p_service_id
    AND sa.day_of_week = get_service_availability.day_of_week
    ORDER BY sa.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to search services with filters
CREATE OR REPLACE FUNCTION search_services(
    p_search_text TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_barber_id UUID DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_min_duration INTEGER DEFAULT NULL,
    p_max_duration INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    service_id UUID,
    service_name TEXT,
    description TEXT,
    price DECIMAL,
    duration INTEGER,
    category TEXT,
    image_url TEXT,
    rating DECIMAL,
    barber_name TEXT,
    business_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.category,
        s.image_url,
        COALESCE(s.rating, 0.00) as rating,
        u.name as barber_name,
        bp.business_name
    FROM services s
    JOIN users u ON s.barber_id = u.id
    LEFT JOIN barber_profiles bp ON u.id = bp.user_id
    WHERE s.is_active = TRUE
    AND (p_search_text IS NULL OR (
        to_tsvector('english', s.name || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('english', p_search_text)
    ))
    AND (p_category IS NULL OR s.category = p_category)
    AND (p_barber_id IS NULL OR s.barber_id = p_barber_id)
    AND (p_min_price IS NULL OR s.price >= p_min_price)
    AND (p_max_price IS NULL OR s.price <= p_max_price)
    AND (p_min_duration IS NULL OR s.duration >= p_min_duration)
    AND (p_max_duration IS NULL OR s.duration <= p_max_duration)
    ORDER BY 
        CASE WHEN p_search_text IS NOT NULL THEN 
            ts_rank(to_tsvector('english', s.name || ' ' || COALESCE(s.description, '')), plainto_tsquery('english', p_search_text))
        END DESC,
        COALESCE(s.rating, 0) DESC,
        s.name ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security for new tables
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_categories
CREATE POLICY "Service categories are viewable by everyone" ON service_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only admins can manage service categories" ON service_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- RLS Policies for service_addons
CREATE POLICY "Service add-ons are viewable by everyone" ON service_addons
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Barbers can manage their service add-ons" ON service_addons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM services 
            WHERE services.id = service_addons.service_id 
            AND services.barber_id::text = auth.uid()::text
        )
    );

-- RLS Policies for service_reviews
CREATE POLICY "Service reviews are viewable by everyone" ON service_reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Clients can create their own service reviews" ON service_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can update their own service reviews" ON service_reviews
    FOR UPDATE USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can delete their own service reviews" ON service_reviews
    FOR DELETE USING (auth.uid()::text = client_id::text);

-- RLS Policies for service_availability
CREATE POLICY "Service availability is viewable by everyone" ON service_availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their service availability" ON service_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM services 
            WHERE services.id = service_availability.service_id 
            AND services.barber_id::text = auth.uid()::text
        )
    );

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'service-images',
    'service-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service images
CREATE POLICY "Service images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Barbers can upload service images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'service-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Barbers can update their service images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'service-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Barbers can delete their service images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'service-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Add rating column to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'rating'
    ) THEN
        ALTER TABLE services ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
        CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC) WHERE is_active = TRUE;
    END IF;
END $$;

-- Add review_count column to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'review_count'
    ) THEN
        ALTER TABLE services ADD COLUMN review_count INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_services_review_count ON services(review_count DESC) WHERE is_active = TRUE;
    END IF;
END $$;

-- Update existing services to have default category if null
UPDATE services SET category = 'other' WHERE category IS NULL;

-- Make category NOT NULL after setting defaults
ALTER TABLE services ALTER COLUMN category SET NOT NULL;