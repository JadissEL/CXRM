-- Migration: Real-Time Availability System
-- This migration enhances the appointment and availability system with real-time capabilities

-- Create enhanced appointment status enum
DROP TYPE IF EXISTS appointment_status CASCADE;
CREATE TYPE appointment_status AS ENUM (
    'pending',
    'confirmed', 
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

-- Create break type enum
CREATE TYPE break_type AS ENUM ('lunch', 'personal', 'maintenance', 'emergency');

-- Create holiday type enum
CREATE TYPE holiday_type AS ENUM ('national', 'personal', 'business');

-- Enhanced appointments table with multiple services support
DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_ids UUID[] NOT NULL, -- Support multiple services
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    client_notes TEXT, -- Notes from client
    barber_notes TEXT, -- Notes from barber
    total_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    booking_source TEXT DEFAULT 'web' CHECK (booking_source IN ('web', 'mobile', 'phone', 'walk_in')),
    -- Real-time booking protection
    booking_token UUID DEFAULT uuid_generate_v4(), -- Temporary token for slot reservation
    token_expires_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID, -- User who has temporarily locked this slot
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_deposit CHECK (deposit_amount >= 0 AND deposit_amount <= total_price),
    CONSTRAINT future_appointment CHECK (appointment_date >= CURRENT_DATE)
);

-- Enhanced barber working hours table
CREATE TABLE barber_working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT TRUE,
    slot_duration INTEGER DEFAULT 30, -- Default slot duration in minutes
    buffer_time INTEGER DEFAULT 15, -- Buffer between appointments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(barber_id, day_of_week),
    CONSTRAINT valid_working_hours CHECK (end_time > start_time)
);

-- Barber breaks table
CREATE TABLE barber_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    break_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_type break_type DEFAULT 'personal',
    title TEXT NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- For recurring breaks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_break_time CHECK (end_time > start_time)
);

-- Barber holidays table
CREATE TABLE barber_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    end_date DATE, -- For multi-day holidays
    holiday_type holiday_type DEFAULT 'personal',
    title TEXT NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- For annual holidays
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(barber_id, holiday_date)
);

-- Slot reservations table for real-time booking protection
CREATE TABLE slot_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    service_ids UUID[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_reservation_time CHECK (end_time > start_time),
    CONSTRAINT future_expiry CHECK (expires_at > NOW())
);

-- Create comprehensive indexes
CREATE INDEX idx_appointments_barber_date_time ON appointments(barber_id, appointment_date, start_time);
CREATE INDEX idx_appointments_client_date ON appointments(client_id, appointment_date DESC);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(appointment_date, start_time, end_time);
CREATE INDEX idx_appointments_booking_token ON appointments(booking_token) WHERE booking_token IS NOT NULL;
CREATE INDEX idx_appointments_locked_until ON appointments(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX idx_working_hours_barber_day ON barber_working_hours(barber_id, day_of_week);
CREATE INDEX idx_breaks_barber_date ON barber_breaks(barber_id, break_date);
CREATE INDEX idx_holidays_barber_date ON barber_holidays(barber_id, holiday_date);
CREATE INDEX idx_holidays_date_range ON barber_holidays(holiday_date, end_date);

CREATE INDEX idx_slot_reservations_barber_date ON slot_reservations(barber_id, reservation_date);
CREATE INDEX idx_slot_reservations_expires ON slot_reservations(expires_at);
CREATE INDEX idx_slot_reservations_client ON slot_reservations(client_id);

-- Function to clean up expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM slot_reservations WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive availability
CREATE OR REPLACE FUNCTION get_barber_availability(
    p_barber_id UUID,
    p_date DATE,
    p_service_ids UUID[],
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL
)
RETURNS TABLE(
    slot_start TIME,
    slot_end TIME,
    is_available BOOLEAN,
    total_duration INTEGER,
    total_price DECIMAL
) AS $$
DECLARE
    working_hours RECORD;
    service_record RECORD;
    total_service_duration INTEGER := 0;
    total_service_price DECIMAL := 0;
    current_slot_start TIME;
    current_slot_end TIME;
    slot_duration INTEGER;
    buffer_time INTEGER;
    day_of_week INTEGER;
BEGIN
    -- Get day of week (0 = Sunday)
    day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Calculate total duration and price for all services
    FOR service_record IN 
        SELECT duration, price 
        FROM services 
        WHERE id = ANY(p_service_ids) AND is_active = TRUE
    LOOP
        total_service_duration := total_service_duration + service_record.duration;
        total_service_price := total_service_price + service_record.price;
    END LOOP;
    
    -- If no services found, return empty
    IF total_service_duration = 0 THEN
        RETURN;
    END IF;
    
    -- Get barber working hours for the day
    SELECT wh.start_time, wh.end_time, wh.slot_duration, wh.buffer_time, wh.is_working
    INTO working_hours
    FROM barber_working_hours wh
    WHERE wh.barber_id = p_barber_id AND wh.day_of_week = day_of_week;
    
    -- If barber doesn't work on this day, return empty
    IF NOT FOUND OR NOT working_hours.is_working THEN
        RETURN;
    END IF;
    
    -- Check if it's a holiday
    IF EXISTS (
        SELECT 1 FROM barber_holidays 
        WHERE barber_id = p_barber_id 
        AND holiday_date <= p_date 
        AND (end_date IS NULL OR end_date >= p_date)
    ) THEN
        RETURN;
    END IF;
    
    slot_duration := working_hours.slot_duration;
    buffer_time := working_hours.buffer_time;
    
    -- Use provided time range or working hours
    current_slot_start := COALESCE(p_start_time, working_hours.start_time);
    
    -- Generate time slots
    WHILE current_slot_start + (total_service_duration || ' minutes')::INTERVAL <= 
          COALESCE(p_end_time, working_hours.end_time) LOOP
        
        current_slot_end := current_slot_start + (total_service_duration || ' minutes')::INTERVAL;
        
        -- Check availability
        slot_start := current_slot_start;
        slot_end := current_slot_end;
        total_duration := total_service_duration;
        total_price := total_service_price;
        
        is_available := NOT EXISTS (
            -- Check appointments
            SELECT 1 FROM appointments 
            WHERE barber_id = p_barber_id 
            AND appointment_date = p_date
            AND status NOT IN ('cancelled', 'no_show')
            AND (
                (start_time < current_slot_end AND end_time > current_slot_start)
            )
        ) AND NOT EXISTS (
            -- Check breaks
            SELECT 1 FROM barber_breaks 
            WHERE barber_id = p_barber_id 
            AND break_date = p_date
            AND (
                (start_time < current_slot_end AND end_time > current_slot_start)
            )
        ) AND NOT EXISTS (
            -- Check active reservations
            SELECT 1 FROM slot_reservations 
            WHERE barber_id = p_barber_id 
            AND reservation_date = p_date
            AND expires_at > NOW()
            AND (
                (start_time < current_slot_end AND end_time > current_slot_start)
            )
        );
        
        RETURN NEXT;
        
        -- Move to next slot
        current_slot_start := current_slot_start + ((slot_duration + buffer_time) || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve a time slot temporarily
CREATE OR REPLACE FUNCTION reserve_time_slot(
    p_barber_id UUID,
    p_client_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_service_ids UUID[],
    p_duration_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
    reservation_id UUID;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check if slot is still available
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE barber_id = p_barber_id 
        AND appointment_date = p_date
        AND status NOT IN ('cancelled', 'no_show')
        AND (start_time < p_end_time AND end_time > p_start_time)
    ) OR EXISTS (
        SELECT 1 FROM slot_reservations 
        WHERE barber_id = p_barber_id 
        AND reservation_date = p_date
        AND expires_at > NOW()
        AND (start_time < p_end_time AND end_time > p_start_time)
    ) THEN
        RAISE EXCEPTION 'Time slot is no longer available';
    END IF;
    
    -- Create reservation
    INSERT INTO slot_reservations (
        barber_id, client_id, reservation_date, start_time, end_time, 
        service_ids, expires_at
    ) VALUES (
        p_barber_id, p_client_id, p_date, p_start_time, p_end_time, 
        p_service_ids, expires_at
    ) RETURNING id INTO reservation_id;
    
    RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create appointment with reservation validation
CREATE OR REPLACE FUNCTION create_appointment_with_validation(
    p_client_id UUID,
    p_barber_id UUID,
    p_service_ids UUID[],
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_total_price DECIMAL,
    p_notes TEXT DEFAULT NULL,
    p_reservation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    appointment_id UUID;
    service_duration INTEGER;
BEGIN
    -- Validate reservation if provided
    IF p_reservation_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM slot_reservations 
            WHERE id = p_reservation_id 
            AND client_id = p_client_id
            AND barber_id = p_barber_id
            AND reservation_date = p_date
            AND start_time = p_start_time
            AND end_time = p_end_time
            AND expires_at > NOW()
        ) THEN
            RAISE EXCEPTION 'Invalid or expired reservation';
        END IF;
    END IF;
    
    -- Final availability check
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE barber_id = p_barber_id 
        AND appointment_date = p_date
        AND status NOT IN ('cancelled', 'no_show')
        AND (start_time < p_end_time AND end_time > p_start_time)
    ) THEN
        RAISE EXCEPTION 'Time slot is no longer available';
    END IF;
    
    -- Create appointment
    INSERT INTO appointments (
        client_id, barber_id, service_ids, appointment_date, 
        start_time, end_time, total_price, notes
    ) VALUES (
        p_client_id, p_barber_id, p_service_ids, p_date, 
        p_start_time, p_end_time, p_total_price, p_notes
    ) RETURNING id INTO appointment_id;
    
    -- Clean up reservation
    IF p_reservation_id IS NOT NULL THEN
        DELETE FROM slot_reservations WHERE id = p_reservation_id;
    END IF;
    
    RETURN appointment_id;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at 
    BEFORE UPDATE ON barber_working_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breaks_updated_at 
    BEFORE UPDATE ON barber_breaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at 
    BEFORE UPDATE ON barber_holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
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

-- RLS Policies for barber_working_hours
CREATE POLICY "Working hours are viewable by everyone" ON barber_working_hours
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their working hours" ON barber_working_hours
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- RLS Policies for barber_breaks
CREATE POLICY "Breaks are viewable by everyone" ON barber_breaks
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their breaks" ON barber_breaks
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- RLS Policies for barber_holidays
CREATE POLICY "Holidays are viewable by everyone" ON barber_holidays
    FOR SELECT USING (TRUE);

CREATE POLICY "Barbers can manage their holidays" ON barber_holidays
    FOR ALL USING (auth.uid()::text = barber_id::text);

-- RLS Policies for slot_reservations
CREATE POLICY "Users can view their own reservations" ON slot_reservations
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR 
        auth.uid()::text = barber_id::text
    );

CREATE POLICY "Clients can create reservations" ON slot_reservations
    FOR INSERT WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Users can delete their own reservations" ON slot_reservations
    FOR DELETE USING (auth.uid()::text = client_id::text);

-- Create a scheduled job to clean up expired reservations (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-expired-reservations', '*/5 * * * *', 'SELECT cleanup_expired_reservations();');

-- Enable real-time for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE slot_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE barber_working_hours;
ALTER PUBLICATION supabase_realtime ADD TABLE barber_breaks;
ALTER PUBLICATION supabase_realtime ADD TABLE barber_holidays;