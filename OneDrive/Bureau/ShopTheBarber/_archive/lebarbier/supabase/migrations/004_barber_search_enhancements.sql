-- Migration: Enhanced Barber Search & Filtering with PostGIS
-- This migration adds geospatial capabilities, search optimization, and filtering fields

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search optimization

-- Create service categories enum
CREATE TYPE service_category AS ENUM (
    'haircut',
    'beard_trim',
    'shave',
    'styling',
    'coloring',
    'treatment',
    'consultation',
    'package'
);

-- Add enhanced fields to barber_profiles table
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS location_point GEOMETRY(POINT, 4326);
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'US';
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['en'];
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS working_hours JSONB; -- Enhanced availability with specific hours
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS booking_advance_days INTEGER DEFAULT 30;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT FALSE; -- Mobile barber service
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS service_radius_km DECIMAL(5,2); -- For mobile barbers
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector; -- Full-text search

-- Add category field to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS category service_category DEFAULT 'haircut';
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create barber_reviews table for detailed reviews
CREATE TABLE IF NOT EXISTS barber_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    would_recommend BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified if from actual appointment
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, appointment_id) -- One review per appointment
);

-- Create barber_photos table for portfolio images
CREATE TABLE IF NOT EXISTS barber_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barber_availability table for detailed scheduling
CREATE TABLE IF NOT EXISTS barber_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    slot_duration INTEGER DEFAULT 30, -- Duration in minutes
    break_duration INTEGER DEFAULT 0, -- Break between appointments
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barber_id, date, start_time)
);

-- Create search-optimized indexes
CREATE INDEX IF NOT EXISTS idx_barber_profiles_location_point ON barber_profiles USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_rating ON barber_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_price_range ON barber_profiles(price_range);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_specialties ON barber_profiles USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_languages ON barber_profiles USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_search_vector ON barber_profiles USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_city ON barber_profiles(address_city);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_verified ON barber_profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_barber_profiles_mobile ON barber_profiles(is_mobile) WHERE is_mobile = TRUE;

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_tags ON services USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_services_active_barber ON services(barber_id, is_active) WHERE is_active = TRUE;

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_barber_reviews_barber_id ON barber_reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_reviews_rating ON barber_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_barber_reviews_verified ON barber_reviews(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_barber_reviews_created_at ON barber_reviews(created_at DESC);

-- Photo indexes
CREATE INDEX IF NOT EXISTS idx_barber_photos_barber_id ON barber_photos(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_photos_featured ON barber_photos(barber_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_barber_photos_order ON barber_photos(barber_id, display_order);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_barber_availability_barber_date ON barber_availability(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_barber_availability_available ON barber_availability(barber_id, date, is_available) WHERE is_available = TRUE;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_barber_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.business_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.specialties, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.address_city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.address_state, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.certifications, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector updates
CREATE TRIGGER update_barber_search_vector_trigger
    BEFORE INSERT OR UPDATE ON barber_profiles
    FOR EACH ROW EXECUTE FUNCTION update_barber_search_vector();

-- Function to update barber rating from reviews
CREATE OR REPLACE FUNCTION update_barber_rating()
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
    FROM barber_reviews 
    WHERE barber_id = COALESCE(NEW.barber_id, OLD.barber_id);
    
    -- Update barber profile
    UPDATE barber_profiles 
    SET 
        rating = COALESCE(avg_rating, 0.00),
        total_reviews = review_count
    WHERE user_id = COALESCE(NEW.barber_id, OLD.barber_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
CREATE TRIGGER update_barber_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON barber_reviews
    FOR EACH ROW EXECUTE FUNCTION update_barber_rating();

-- Function to generate available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
    p_barber_id UUID,
    p_date DATE,
    p_service_duration INTEGER DEFAULT 30
)
RETURNS TABLE(
    slot_time TIME,
    is_available BOOLEAN
) AS $$
DECLARE
    availability_record RECORD;
    current_time TIME;
    end_time TIME;
BEGIN
    -- Get barber availability for the date
    FOR availability_record IN 
        SELECT start_time, end_time, slot_duration, break_duration
        FROM barber_availability 
        WHERE barber_id = p_barber_id 
        AND date = p_date 
        AND is_available = TRUE
        ORDER BY start_time
    LOOP
        current_time := availability_record.start_time;
        end_time := availability_record.end_time;
        
        -- Generate slots within the availability window
        WHILE current_time + (p_service_duration || ' minutes')::INTERVAL <= end_time LOOP
            -- Check if slot is not booked
            slot_time := current_time;
            is_available := NOT EXISTS (
                SELECT 1 FROM appointments 
                WHERE barber_id = p_barber_id 
                AND appointment_date = p_date
                AND status NOT IN ('cancelled')
                AND start_time < current_time + (p_service_duration || ' minutes')::INTERVAL
                AND end_time > current_time
            );
            
            RETURN NEXT;
            
            -- Move to next slot
            current_time := current_time + 
                ((availability_record.slot_duration + availability_record.break_duration) || ' minutes')::INTERVAL;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function for geospatial search
CREATE OR REPLACE FUNCTION search_barbers_nearby(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km DECIMAL DEFAULT 25,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    barber_id UUID,
    distance_km DECIMAL,
    business_name TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    price_range TEXT,
    specialties TEXT[],
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.user_id,
        ROUND(
            ST_Distance(
                bp.location_point,
                ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
            )::numeric / 1000, 2
        ) as distance_km,
        bp.business_name,
        bp.rating,
        bp.total_reviews,
        bp.price_range,
        bp.specialties,
        u.avatar_url
    FROM barber_profiles bp
    JOIN users u ON u.id = bp.user_id
    WHERE 
        u.status = 'active'
        AND bp.is_verified = TRUE
        AND bp.location_point IS NOT NULL
        AND ST_DWithin(
            bp.location_point,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
            p_radius_km * 1000 -- Convert km to meters
        )
    ORDER BY distance_km ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_barber_reviews_updated_at 
    BEFORE UPDATE ON barber_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE barber_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for barber_reviews
CREATE POLICY "Reviews are viewable by everyone" ON barber_reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can create reviews for their appointments" ON barber_reviews
    FOR INSERT WITH CHECK (
        auth.uid()::text = client_id::text AND
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id 
            AND client_id = auth.uid()::text 
            AND status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews" ON barber_reviews
    FOR UPDATE USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can delete their own reviews" ON barber_reviews
    FOR DELETE USING (auth.uid()::text = client_id::text);

-- RLS Policies for barber_photos
CREATE POLICY "Photos are viewable by everyone" ON barber_photos
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their own photos" ON barber_photos
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- RLS Policies for barber_availability
CREATE POLICY "Availability is viewable by everyone" ON barber_availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their own availability" ON barber_availability
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- Create storage bucket for barber photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-photos', 'barber-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for barber photos
CREATE POLICY "Barber photos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'barber-photos');

CREATE POLICY "Barbers can upload their own photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'barber-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Barbers can update their own photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'barber-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Barbers can delete their own photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'barber-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );