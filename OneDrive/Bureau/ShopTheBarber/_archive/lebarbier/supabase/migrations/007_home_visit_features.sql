-- Migration: Home vs. Shop Visits Feature
-- This migration adds support for home visits and location-based services

-- Add home visit fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'shop' NOT NULL CHECK (location_type IN ('shop', 'home'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_address TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_latitude DECIMAL(10, 8);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_longitude DECIMAL(11, 8);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS travel_fee NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS travel_distance NUMERIC(10, 2); -- in kilometers
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS travel_time INTEGER; -- in minutes
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS estimated_arrival_time TIMESTAMP WITH TIME ZONE;

-- Add home visit fields to barber_profiles table
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS offers_home_visits BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS service_area GEOGRAPHY(POLYGON, 4326); -- Geographic service area
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS home_visit_fee_base NUMERIC(10, 2) DEFAULT 0.00; -- Base fee for home visits
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS home_visit_fee_per_km NUMERIC(10, 2) DEFAULT 0.00; -- Per kilometer fee
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS max_travel_distance NUMERIC(10, 2) DEFAULT 25.00; -- Maximum travel distance in km
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS min_home_visit_price NUMERIC(10, 2) DEFAULT 0.00; -- Minimum total price for home visits
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS travel_buffer_minutes INTEGER DEFAULT 30; -- Buffer time for travel between appointments

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_location_type ON appointments(location_type);
CREATE INDEX IF NOT EXISTS idx_appointments_service_location ON appointments(service_latitude, service_longitude) WHERE location_type = 'home';
CREATE INDEX IF NOT EXISTS idx_barber_profiles_home_visits ON barber_profiles(offers_home_visits) WHERE offers_home_visits = TRUE;
CREATE INDEX IF NOT EXISTS idx_barber_profiles_service_area ON barber_profiles USING GIST (service_area) WHERE service_area IS NOT NULL;

-- Function to calculate travel distance and time
CREATE OR REPLACE FUNCTION calculate_travel_info(
    p_barber_lat DECIMAL,
    p_barber_lng DECIMAL,
    p_service_lat DECIMAL,
    p_service_lng DECIMAL
)
RETURNS TABLE(
    distance_km DECIMAL,
    estimated_time_minutes INTEGER
) AS $$
DECLARE
    distance DECIMAL;
BEGIN
    -- Calculate straight-line distance using PostGIS
    SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(p_barber_lng, p_barber_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_service_lng, p_service_lat), 4326)::geography
    ) / 1000 INTO distance; -- Convert meters to kilometers
    
    -- Estimate travel time (assuming average speed of 40 km/h in urban areas)
    -- Add 10 minutes base time for preparation and parking
    RETURN QUERY SELECT 
        ROUND(distance, 2) as distance_km,
        (10 + ROUND(distance * 1.5))::INTEGER as estimated_time_minutes; -- 1.5 minutes per km
END;
$$ LANGUAGE plpgsql;

-- Function to calculate home visit fee
CREATE OR REPLACE FUNCTION calculate_home_visit_fee(
    p_barber_id UUID,
    p_distance_km DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    base_fee DECIMAL;
    per_km_fee DECIMAL;
    total_fee DECIMAL;
BEGIN
    -- Get barber's fee structure
    SELECT 
        home_visit_fee_base,
        home_visit_fee_per_km
    INTO base_fee, per_km_fee
    FROM barber_profiles
    WHERE user_id = p_barber_id;
    
    -- Calculate total fee
    total_fee := COALESCE(base_fee, 0) + (COALESCE(per_km_fee, 0) * p_distance_km);
    
    RETURN ROUND(total_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if address is within service area
CREATE OR REPLACE FUNCTION is_address_in_service_area(
    p_barber_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    service_area_geog GEOGRAPHY;
    max_distance DECIMAL;
    barber_location GEOMETRY;
    service_point GEOMETRY;
    distance_km DECIMAL;
BEGIN
    -- Get barber's service area and location
    SELECT 
        bp.service_area,
        bp.max_travel_distance,
        bp.location_point
    INTO service_area_geog, max_distance, barber_location
    FROM barber_profiles bp
    WHERE bp.user_id = p_barber_id
    AND bp.offers_home_visits = TRUE;
    
    -- If no barber found or doesn't offer home visits
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    service_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
    
    -- Check if within defined service area polygon (if exists)
    IF service_area_geog IS NOT NULL THEN
        RETURN ST_Within(service_point::geography, service_area_geog);
    END IF;
    
    -- Fallback to distance-based check
    IF barber_location IS NOT NULL AND max_distance IS NOT NULL THEN
        distance_km := ST_Distance(barber_location::geography, service_point::geography) / 1000;
        RETURN distance_km <= max_distance;
    END IF;
    
    -- Default fallback (25km radius)
    IF barber_location IS NOT NULL THEN
        distance_km := ST_Distance(barber_location::geography, service_point::geography) / 1000;
        RETURN distance_km <= 25;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to get barber availability with travel time consideration
CREATE OR REPLACE FUNCTION get_barber_availability_with_travel(
    p_barber_id UUID,
    p_date DATE,
    p_location_type TEXT DEFAULT 'shop',
    p_service_latitude DECIMAL DEFAULT NULL,
    p_service_longitude DECIMAL DEFAULT NULL,
    p_service_duration INTEGER DEFAULT 30
)
RETURNS TABLE(
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN,
    travel_time_before INTEGER,
    travel_time_after INTEGER
) AS $$
DECLARE
    working_hours JSONB;
    day_name TEXT;
    day_start TIME;
    day_end TIME;
    slot_duration INTEGER := 30;
    current_slot TIME;
    slot_end TIME;
    travel_buffer INTEGER := 0;
    prev_appointment RECORD;
    next_appointment RECORD;
    barber_location GEOMETRY;
BEGIN
    -- Get day name
    day_name := LOWER(TO_CHAR(p_date, 'Day'));
    day_name := TRIM(day_name);
    
    -- Get barber working hours and location
    SELECT 
        bp.working_hours,
        bp.location_point,
        bp.travel_buffer_minutes
    INTO working_hours, barber_location, travel_buffer
    FROM barber_profiles bp
    WHERE bp.user_id = p_barber_id;
    
    -- Extract working hours for the day
    IF working_hours ? day_name THEN
        day_start := (working_hours->day_name->>'start')::TIME;
        day_end := (working_hours->day_name->>'end')::TIME;
    ELSE
        RETURN; -- No working hours for this day
    END IF;
    
    -- If home visit, get travel buffer
    IF p_location_type = 'home' AND travel_buffer IS NOT NULL THEN
        travel_buffer := travel_buffer;
    ELSE
        travel_buffer := 0;
    END IF;
    
    -- Generate time slots
    current_slot := day_start;
    
    WHILE current_slot + (p_service_duration || ' minutes')::INTERVAL <= day_end LOOP
        slot_end := current_slot + (p_service_duration || ' minutes')::INTERVAL;
        
        -- Check for conflicts with existing appointments
        is_available := NOT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.barber_id = p_barber_id
            AND a.appointment_date = p_date
            AND a.status NOT IN ('cancelled', 'no_show')
            AND (
                -- Overlap check
                (a.start_time < slot_end AND a.end_time > current_slot)
                OR
                -- Travel buffer check for home visits
                (p_location_type = 'home' AND (
                    (a.start_time < slot_end + (travel_buffer || ' minutes')::INTERVAL AND a.start_time >= current_slot)
                    OR
                    (a.end_time > current_slot - (travel_buffer || ' minutes')::INTERVAL AND a.end_time <= slot_end)
                ))
            )
        );
        
        -- Calculate travel times for home visits
        travel_time_before := 0;
        travel_time_after := 0;
        
        IF p_location_type = 'home' AND p_service_latitude IS NOT NULL AND p_service_longitude IS NOT NULL AND barber_location IS NOT NULL THEN
            -- Get previous appointment
            SELECT a.* INTO prev_appointment
            FROM appointments a
            WHERE a.barber_id = p_barber_id
            AND a.appointment_date = p_date
            AND a.end_time <= current_slot
            AND a.status NOT IN ('cancelled', 'no_show')
            ORDER BY a.end_time DESC
            LIMIT 1;
            
            -- Get next appointment
            SELECT a.* INTO next_appointment
            FROM appointments a
            WHERE a.barber_id = p_barber_id
            AND a.appointment_date = p_date
            AND a.start_time >= slot_end
            AND a.status NOT IN ('cancelled', 'no_show')
            ORDER BY a.start_time ASC
            LIMIT 1;
            
            -- Calculate travel time from previous location
            IF prev_appointment.id IS NOT NULL THEN
                IF prev_appointment.location_type = 'home' AND prev_appointment.service_latitude IS NOT NULL THEN
                    SELECT estimated_time_minutes INTO travel_time_before
                    FROM calculate_travel_info(
                        prev_appointment.service_latitude,
                        prev_appointment.service_longitude,
                        p_service_latitude,
                        p_service_longitude
                    );
                ELSE
                    -- Travel from shop to home
                    SELECT estimated_time_minutes INTO travel_time_before
                    FROM calculate_travel_info(
                        ST_Y(barber_location),
                        ST_X(barber_location),
                        p_service_latitude,
                        p_service_longitude
                    );
                END IF;
            ELSE
                -- First appointment of the day, travel from shop
                SELECT estimated_time_minutes INTO travel_time_before
                FROM calculate_travel_info(
                    ST_Y(barber_location),
                    ST_X(barber_location),
                    p_service_latitude,
                    p_service_longitude
                );
            END IF;
            
            -- Calculate travel time to next location
            IF next_appointment.id IS NOT NULL THEN
                IF next_appointment.location_type = 'home' AND next_appointment.service_latitude IS NOT NULL THEN
                    SELECT estimated_time_minutes INTO travel_time_after
                    FROM calculate_travel_info(
                        p_service_latitude,
                        p_service_longitude,
                        next_appointment.service_latitude,
                        next_appointment.service_longitude
                    );
                ELSE
                    -- Travel from home to shop
                    SELECT estimated_time_minutes INTO travel_time_after
                    FROM calculate_travel_info(
                        p_service_latitude,
                        p_service_longitude,
                        ST_Y(barber_location),
                        ST_X(barber_location)
                    );
                END IF;
            ELSE
                -- Last appointment of the day, travel back to shop
                SELECT estimated_time_minutes INTO travel_time_after
                FROM calculate_travel_info(
                    p_service_latitude,
                    p_service_longitude,
                    ST_Y(barber_location),
                    ST_X(barber_location)
                );
            END IF;
        END IF;
        
        start_time := current_slot;
        end_time := slot_end;
        
        RETURN NEXT;
        
        -- Move to next slot
        current_slot := current_slot + (slot_duration || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate home visit booking
CREATE OR REPLACE FUNCTION validate_home_visit_booking(
    p_barber_id UUID,
    p_service_latitude DECIMAL,
    p_service_longitude DECIMAL,
    p_total_service_price DECIMAL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    travel_distance DECIMAL,
    travel_fee DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    barber_profile RECORD;
    distance DECIMAL;
    fee DECIMAL;
    in_service_area BOOLEAN;
BEGIN
    -- Get barber profile
    SELECT 
        bp.offers_home_visits,
        bp.location_point,
        bp.max_travel_distance,
        bp.min_home_visit_price,
        bp.home_visit_fee_base,
        bp.home_visit_fee_per_km
    INTO barber_profile
    FROM barber_profiles bp
    WHERE bp.user_id = p_barber_id;
    
    -- Check if barber exists
    IF NOT FOUND THEN
        is_valid := FALSE;
        error_message := 'Barber not found';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check if barber offers home visits
    IF NOT barber_profile.offers_home_visits THEN
        is_valid := FALSE;
        error_message := 'This barber does not offer home visits';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check if address is in service area
    SELECT is_address_in_service_area(p_barber_id, p_service_latitude, p_service_longitude)
    INTO in_service_area;
    
    IF NOT in_service_area THEN
        is_valid := FALSE;
        error_message := 'Service address is outside the barber''s service area';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Calculate travel distance and fee
    SELECT distance_km INTO distance
    FROM calculate_travel_info(
        ST_Y(barber_profile.location_point),
        ST_X(barber_profile.location_point),
        p_service_latitude,
        p_service_longitude
    );
    
    SELECT calculate_home_visit_fee(p_barber_id, distance) INTO fee;
    
    -- Check minimum price requirement
    IF barber_profile.min_home_visit_price > 0 AND (p_total_service_price + fee) < barber_profile.min_home_visit_price THEN
        is_valid := FALSE;
        error_message := 'Total booking amount does not meet minimum requirement for home visits ($' || barber_profile.min_home_visit_price || ')';
        travel_distance := distance;
        travel_fee := fee;
        total_price := p_total_service_price + fee;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- All validations passed
    is_valid := TRUE;
    error_message := NULL;
    travel_distance := distance;
    travel_fee := fee;
    total_price := p_total_service_price + fee;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update the existing create_appointment_with_validation function to handle home visits
CREATE OR REPLACE FUNCTION create_appointment_with_validation(
    p_client_id UUID,
    p_barber_id UUID,
    p_service_ids UUID[],
    p_appointment_date DATE,
    p_start_time TIME,
    p_location_type TEXT DEFAULT 'shop',
    p_service_address TEXT DEFAULT NULL,
    p_service_latitude DECIMAL DEFAULT NULL,
    p_service_longitude DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    appointment_id UUID,
    success BOOLEAN,
    error_message TEXT,
    total_price DECIMAL,
    travel_fee DECIMAL
) AS $$
DECLARE
    v_appointment_id UUID;
    v_total_duration INTEGER := 0;
    v_total_price DECIMAL := 0;
    v_travel_fee DECIMAL := 0;
    v_end_time TIME;
    service_record RECORD;
    validation_result RECORD;
BEGIN
    -- Generate appointment ID
    v_appointment_id := uuid_generate_v4();
    
    -- Calculate total duration and price
    FOR service_record IN 
        SELECT s.duration_minutes, s.price
        FROM services s
        WHERE s.id = ANY(p_service_ids)
        AND s.barber_id = p_barber_id
        AND s.is_active = TRUE
    LOOP
        v_total_duration := v_total_duration + service_record.duration_minutes;
        v_total_price := v_total_price + service_record.price;
    END LOOP;
    
    -- Calculate end time
    v_end_time := p_start_time + (v_total_duration || ' minutes')::INTERVAL;
    
    -- Validate home visit if applicable
    IF p_location_type = 'home' THEN
        IF p_service_latitude IS NULL OR p_service_longitude IS NULL OR p_service_address IS NULL THEN
            success := FALSE;
            error_message := 'Service address and coordinates are required for home visits';
            RETURN NEXT;
            RETURN;
        END IF;
        
        SELECT * INTO validation_result
        FROM validate_home_visit_booking(
            p_barber_id,
            p_service_latitude,
            p_service_longitude,
            v_total_price
        );
        
        IF NOT validation_result.is_valid THEN
            success := FALSE;
            error_message := validation_result.error_message;
            total_price := validation_result.total_price;
            travel_fee := validation_result.travel_fee;
            RETURN NEXT;
            RETURN;
        END IF;
        
        v_travel_fee := validation_result.travel_fee;
        v_total_price := validation_result.total_price;
    END IF;
    
    -- Check for time slot conflicts
    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE barber_id = p_barber_id
        AND appointment_date = p_appointment_date
        AND status NOT IN ('cancelled', 'no_show')
        AND (
            (start_time < v_end_time AND end_time > p_start_time)
        )
    ) THEN
        success := FALSE;
        error_message := 'Time slot is not available';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Create the appointment
    INSERT INTO appointments (
        id,
        client_id,
        barber_id,
        appointment_date,
        start_time,
        end_time,
        total_duration,
        total_price,
        location_type,
        service_address,
        service_latitude,
        service_longitude,
        travel_fee,
        notes,
        status
    ) VALUES (
        v_appointment_id,
        p_client_id,
        p_barber_id,
        p_appointment_date,
        p_start_time,
        v_end_time,
        v_total_duration,
        v_total_price,
        p_location_type,
        p_service_address,
        p_service_latitude,
        p_service_longitude,
        v_travel_fee,
        p_notes,
        'pending'
    );
    
    -- Link services to appointment
    INSERT INTO appointment_services (appointment_id, service_id)
    SELECT v_appointment_id, unnest(p_service_ids);
    
    appointment_id := v_appointment_id;
    success := TRUE;
    error_message := NULL;
    total_price := v_total_price;
    travel_fee := v_travel_fee;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for appointments table
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies for appointments to include location fields
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR 
        auth.uid()::text = barber_id::text
    );

DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid()::text = client_id::text AND
        -- Validate location type
        location_type IN ('shop', 'home') AND
        -- If home visit, require address details
        (location_type = 'shop' OR (
            location_type = 'home' AND 
            service_address IS NOT NULL AND 
            service_latitude IS NOT NULL AND 
            service_longitude IS NOT NULL
        ))
    );

-- Enable real-time subscriptions for appointments with location updates
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;