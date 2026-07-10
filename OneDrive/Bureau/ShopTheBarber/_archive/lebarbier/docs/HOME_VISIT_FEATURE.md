# Home vs. Shop Visits Feature

This document describes the comprehensive Home vs. Shop Visits feature implementation for the LeBarbier booking system.

## Overview

The Home vs. Shop Visits feature allows customers to choose between getting their services at the barber's salon or having the barber come to their location. This feature includes address validation, travel fee calculation, service area verification, and intelligent scheduling that accounts for travel time.

## Features

### Core Functionality
- **Location Selection**: Customers can choose between "In Salon" and "At Home" service locations
- **Address Validation**: Real-time address geocoding and validation
- **Service Area Verification**: Automatic checking if the address is within the barber's service area
- **Travel Fee Calculation**: Dynamic calculation based on distance and barber's pricing structure
- **Smart Scheduling**: Time slots account for travel time to prevent conflicts
- **Real-time Price Updates**: Total price updates automatically as location and services change

### Technical Features
- **Dual API Support**: Google Maps and Mapbox integration with automatic fallback
- **Database Integration**: PostgreSQL with PostGIS for geospatial operations
- **Real-time Validation**: Debounced address validation with user feedback
- **Comprehensive Testing**: Jest tests for all components and API endpoints
- **Type Safety**: Full TypeScript implementation

## Database Schema

### Appointments Table Updates
```sql
-- Location and travel information
location_type appointment_location_type DEFAULT 'shop',
service_address TEXT,
service_latitude DECIMAL(10, 8),
service_longitude DECIMAL(11, 8),
travel_fee DECIMAL(10, 2) DEFAULT 0,
travel_distance DECIMAL(8, 2),
travel_time INTEGER
```

### Barber Profiles Table Updates
```sql
-- Home visit capabilities
offers_home_visits BOOLEAN DEFAULT false,
service_area GEOGRAPHY(POLYGON, 4326),
home_visit_fee_base DECIMAL(8, 2) DEFAULT 0,
home_visit_fee_per_km DECIMAL(6, 2) DEFAULT 0,
max_travel_distance DECIMAL(6, 2) DEFAULT 25
```

## API Endpoints

### 1. Address Validation API
**Endpoint**: `POST /api/appointments/validate-address`

**Purpose**: Validates home visit addresses and calculates travel information

**Request Body**:
```json
{
  "barberId": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number"
}
```

**Response**:
```json
{
  "isValid": "boolean",
  "travelInfo": {
    "distance_km": "number",
    "travel_time_minutes": "number",
    "travel_fee": "number"
  },
  "message": "string"
}
```

### 2. Barber Home Visit Info API
**Endpoint**: `GET /api/appointments/validate-address?barberId={id}`

**Purpose**: Retrieves barber's home visit capabilities and pricing

**Response**:
```json
{
  "offersHomeVisits": "boolean",
  "homeVisitInfo": {
    "baseFee": "number",
    "feePerKm": "number",
    "maxDistance": "number"
  },
  "shopLocation": {
    "address": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  }
}
```

### 3. Enhanced Appointments API
**Endpoint**: `POST /api/appointments`

**Enhanced Request Body**:
```json
{
  "barberId": "string",
  "serviceIds": ["string"],
  "date": "string",
  "startTime": "string",
  "endTime": "string",
  "locationType": "shop" | "home",
  "serviceAddress": "string", // Required for home visits
  "serviceLatitude": "number", // Required for home visits
  "serviceLongitude": "number", // Required for home visits
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "notes": "string"
}
```

## Frontend Components

### 1. LocationSelector Component
**File**: `/components/booking/LocationSelector.tsx`

**Features**:
- Toggle between shop and home visit options
- Address input with real-time validation
- Travel fee calculation and display
- Service area verification
- Error handling and user feedback

**Props**:
```typescript
interface LocationSelectorProps {
  barberId: string;
  selectedLocation: 'shop' | 'home';
  onLocationChange: (location: 'shop' | 'home') => void;
  serviceAddress: string;
  onAddressChange: (address: string) => void;
  coordinates: { lat: number; lng: number } | null;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  totalServicePrice: number;
  onTravelFeeChange: (fee: number) => void;
  onValidationChange: (isValid: boolean, error?: string) => void;
  disabled?: boolean;
}
```

### 2. EnhancedBookingForm Component
**File**: `/components/booking/EnhancedBookingForm.tsx`

**Features**:
- Integrated service selection and location choice
- Real-time price calculation with travel fees
- Smart time slot availability based on location
- Comprehensive form validation
- Booking submission with location data

## Database Functions

### 1. Address Validation
```sql
CREATE OR REPLACE FUNCTION is_address_in_service_area(
  p_barber_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL
) RETURNS TABLE(is_valid BOOLEAN, message TEXT)
```

### 2. Travel Information Calculation
```sql
CREATE OR REPLACE FUNCTION calculate_travel_info(
  p_barber_id UUID,
  p_service_latitude DECIMAL,
  p_service_longitude DECIMAL
) RETURNS TABLE(
  distance_km DECIMAL,
  travel_time_minutes INTEGER,
  travel_fee DECIMAL
)
```

### 3. Home Visit Fee Calculation
```sql
CREATE OR REPLACE FUNCTION calculate_home_visit_fee(
  p_barber_id UUID,
  p_distance_km DECIMAL
) RETURNS DECIMAL
```

### 4. Enhanced Availability with Travel
```sql
CREATE OR REPLACE FUNCTION get_barber_availability_with_travel(
  p_barber_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER,
  p_location_type appointment_location_type DEFAULT 'shop',
  p_service_latitude DECIMAL DEFAULT NULL,
  p_service_longitude DECIMAL DEFAULT NULL
) RETURNS TABLE(...)
```

## Configuration

### Environment Variables

**Required for Google Maps**:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Required for Mapbox**:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

**Provider Selection**:
```env
NEXT_PUBLIC_GEOCODING_PROVIDER=google  # or 'mapbox'
```

**Optional Configuration**:
```env
DEFAULT_TRAVEL_TIME_PER_KM=2
MAX_HOME_VISIT_DISTANCE=50
ENABLE_ADDRESS_AUTOCOMPLETE=true
ADDRESS_VALIDATION_STRICT=true
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Geocoding API
   - Distance Matrix API
   - Maps JavaScript API (optional, for map display)
4. Create an API key
5. Restrict the API key to your domain for security

### Mapbox Setup

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create a new access token
3. Configure token scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
   - `geocoding:read`
   - `directions:read`

## Usage Examples

### Basic Home Visit Booking
```typescript
// 1. Customer selects home visit
setLocationType('home');

// 2. Customer enters address
setServiceAddress('123 Main St, City, State 12345');

// 3. System validates address and calculates fees
const validation = await fetch('/api/appointments/validate-address', {
  method: 'POST',
  body: JSON.stringify({
    barberId: 'barber_123',
    address: '123 Main St, City, State 12345',
    latitude: 40.7128,
    longitude: -74.0060
  })
});

// 4. Customer books appointment
const booking = await fetch('/api/appointments', {
  method: 'POST',
  body: JSON.stringify({
    barberId: 'barber_123',
    serviceIds: ['service_1'],
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    locationType: 'home',
    serviceAddress: '123 Main St, City, State 12345',
    serviceLatitude: 40.7128,
    serviceLongitude: -74.0060,
    contactInfo: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
});
```

### Barber Configuration
```sql
-- Enable home visits for a barber
UPDATE barber_profiles 
SET 
  offers_home_visits = true,
  home_visit_fee_base = 15.00,
  home_visit_fee_per_km = 2.50,
  max_travel_distance = 30.0
WHERE user_id = 'barber_user_id';
```

## Testing

### Running Tests
```bash
# Run all home visit tests
npm test home-visits

# Run component tests
npm test LocationSelector
npm test EnhancedBookingForm

# Run API tests
npm test api/appointments
```

### Test Coverage
- ✅ Address validation API
- ✅ Travel fee calculation
- ✅ Service area verification
- ✅ Booking creation with home visits
- ✅ Location selector component
- ✅ Enhanced booking form
- ✅ Error handling scenarios
- ✅ Authentication and authorization

## Error Handling

### Common Error Scenarios

1. **Barber doesn't offer home visits**
   - Error: "This barber does not offer home visits"
   - Solution: Customer must select shop visit

2. **Address outside service area**
   - Error: "Address is outside service area"
   - Solution: Customer enters different address or selects shop visit

3. **Invalid address**
   - Error: "Please enter a valid address"
   - Solution: Customer corrects address format

4. **Geocoding API failure**
   - Fallback: Try alternative provider
   - Ultimate fallback: Manual coordinate entry

5. **Travel time conflicts**
   - Error: "Selected time conflicts with travel requirements"
   - Solution: System suggests alternative time slots

## Performance Considerations

### Optimization Strategies

1. **Address Validation Debouncing**
   - 500ms delay to prevent excessive API calls
   - Cancel previous requests when new input received

2. **Caching**
   - Cache geocoding results for common addresses
   - Cache barber service area calculations

3. **Database Indexing**
   - Spatial indexes on location columns
   - Composite indexes on frequently queried combinations

4. **API Rate Limiting**
   - Implement rate limiting for geocoding APIs
   - Use exponential backoff for failed requests

## Security Considerations

### Data Protection

1. **API Key Security**
   - Restrict API keys to specific domains
   - Use environment variables, never commit keys
   - Rotate keys regularly

2. **Address Privacy**
   - Encrypt stored addresses
   - Implement data retention policies
   - Allow customers to delete address history

3. **Input Validation**
   - Sanitize all address inputs
   - Validate coordinate ranges
   - Prevent injection attacks

## Troubleshooting

### Common Issues

1. **Geocoding not working**
   - Check API keys are correctly set
   - Verify API quotas and billing
   - Check network connectivity

2. **Travel fees incorrect**
   - Verify barber pricing configuration
   - Check distance calculation accuracy
   - Review fee calculation logic

3. **Time slots not showing**
   - Verify barber offers home visits
   - Check address validation status
   - Review availability calculation logic

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=geocoding,travel-calculation,booking
```

## Future Enhancements

### Planned Features

1. **Route Optimization**
   - Optimize barber routes for multiple home visits
   - Suggest optimal scheduling for efficiency

2. **Real-time Tracking**
   - GPS tracking for barbers en route
   - Customer notifications with ETA updates

3. **Advanced Pricing**
   - Time-based pricing (rush hour surcharges)
   - Distance-based discounts for regular customers
   - Group booking discounts for same location

4. **Enhanced Maps**
   - Interactive map for address selection
   - Service area visualization
   - Traffic-aware travel time calculation

5. **Mobile Optimization**
   - GPS-based current location detection
   - Offline address validation
   - Push notifications for booking updates

## Support

For technical support or questions about the Home Visit feature:

1. Check this documentation first
2. Review the test files for usage examples
3. Check the API endpoint responses for error details
4. Enable debug logging for detailed troubleshooting

## Contributing

When contributing to the Home Visit feature:

1. Follow the existing code patterns
2. Add comprehensive tests for new functionality
3. Update this documentation for any changes
4. Consider performance and security implications
5. Test with both Google Maps and Mapbox providers