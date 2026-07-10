-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'banned', 'suspended');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Users table (synced with Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- This will be the Clerk user ID
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'client',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barber profiles table (extended info for barbers)
CREATE TABLE barber_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT,
    license_number TEXT,
    years_experience INTEGER,
    specialties TEXT[],
    hourly_rate DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    availability JSONB, -- Store weekly availability schedule
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- Duration in minutes
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_barber_profiles_user_id ON barber_profiles(user_id);
CREATE INDEX idx_services_barber_id ON services(barber_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barber_profiles_updated_at BEFORE UPDATE ON barber_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT USING (role = 'barber' AND status = 'active');

-- RLS Policies for barber_profiles table
CREATE POLICY "Barber profiles are viewable by everyone" ON barber_profiles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = barber_profiles.user_id AND users.status = 'active'
    ));

CREATE POLICY "Barbers can update their own profile" ON barber_profiles
    FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for services table
CREATE POLICY "Services are viewable by everyone" ON services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Barbers can manage their own services" ON services
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- RLS Policies for appointments table
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR 
        auth.uid()::text = barber_id::text
    );

CREATE POLICY "Clients can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Users can update their own appointments" ON appointments
    FOR UPDATE USING (
        auth.uid()::text = client_id::text OR 
        auth.uid()::text = barber_id::text
    );

-- Function to automatically create barber profile when user role is set to barber
CREATE OR REPLACE FUNCTION create_barber_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'barber' AND OLD.role != 'barber' THEN
        INSERT INTO barber_profiles (user_id) VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_barber_profile_trigger
    AFTER UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_barber_profile();

-- Function to validate appointment times
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the appointment time slot is available
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE barber_id = NEW.barber_id 
        AND appointment_date = NEW.appointment_date
        AND status NOT IN ('cancelled')
        AND (
            (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
            (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
        RAISE EXCEPTION 'Time slot is already booked';
    END IF;
    
    -- Ensure end time is after start time
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_time_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION validate_appointment_time();