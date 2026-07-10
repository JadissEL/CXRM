# Barber Search & Filtering Feature

This document provides comprehensive documentation for the Barber Search & Filtering feature implementation in the LeBarbier application.

## Overview

The Barber Search & Filtering feature allows users to find barbers based on various criteria including location, services, availability, ratings, and more. The feature includes both a REST API backend and a responsive frontend interface with map and list views.

## Architecture

### Database Schema

The feature extends the existing database schema with the following enhancements:

#### Enhanced `barber_profiles` Table
- **Geospatial Support**: Added `location_point` column using PostGIS for efficient location-based queries
- **Search Optimization**: Added `search_vector` column for full-text search
- **Contact Information**: Added `phone`, `website_url`, `instagram_handle` columns
- **Address Details**: Separate columns for street, city, state, zip
- **Business Information**: `working_hours` JSON column, `languages` array, `is_mobile`, `service_radius_km`
- **Quality Metrics**: `rating`, `total_reviews`, `is_verified` columns

#### New Tables
- **`barber_reviews`**: Store customer reviews and ratings
- **`barber_photos`**: Store barber shop and work photos
- **`barber_availability`**: Track barber availability slots

#### Enhanced `services` Table
- Added `category` and `tags` columns for better categorization

### API Endpoints

#### `GET/POST /api/barbers/search`

**Purpose**: Search and filter barbers based on various criteria

**Parameters**:
- `q` (string): Text search query
- `latitude`, `longitude` (number): User location coordinates
- `radius` (number): Search radius in kilometers (1-100)
- `category` (string): Service category filter
- `date`, `time` (string): Availability filter
- `min_rating`, `max_rating` (number): Rating range filter (0-5)
- `price_range` (string): Price range filter ($, $$, $$$, $$$$)
- `specialties` (array): Specialty filters
- `languages` (array): Language filters
- `mobile_service` (boolean): Mobile service filter
- `verified_only` (boolean): Verified barbers only
- `sort_by` (string): Sort field (distance, rating, price, reviews, name)
- `sort_order` (string): Sort order (asc, desc)
- `page`, `limit` (number): Pagination parameters

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "barber_id",
      "name": "John Smith",
      "business_name": "Smith Barbershop",
      "bio": "Professional barber...",
      "avatar_url": "https://...",
      "rating": 4.8,
      "total_reviews": 127,
      "price_range": "$$",
      "specialties": ["Classic Cuts", "Beard Specialist"],
      "years_experience": 10,
      "location": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "contact": {
        "phone": "+1234567890",
        "website_url": "https://...",
        "instagram_handle": "@smithbarbershop"
      },
      "services": [
        {
          "id": "service_id",
          "name": "Classic Haircut",
          "category": "haircut",
          "price": 35,
          "duration": 30
        }
      ],
      "working_hours": {
        "monday": { "open": "09:00", "close": "18:00" },
        "tuesday": { "open": "09:00", "close": "18:00" },
        "wednesday": { "open": "09:00", "close": "18:00" },
        "thursday": { "open": "09:00", "close": "18:00" },
        "friday": { "open": "09:00", "close": "18:00" },
        "saturday": { "open": "08:00", "close": "16:00" },
        "sunday": { "closed": true }
      },
      "languages": ["English", "Spanish"],
      "is_mobile": false,
      "service_radius_km": null,
      "is_verified": true,
      "is_favorited": false,
      "distance_km": 2.5,
      "photos": [
        {
          "id": "photo_id",
          "photo_url": "https://...",
          "is_featured": true
        }
      ],
      "available_slots": ["2024-01-15T10:00:00Z", "2024-01-15T14:00:00Z"],
      "is_currently_open": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### Frontend Components

#### `BarberSearch` Component
**Location**: `components/search/BarberSearch.tsx`

**Purpose**: Main search interface component

**Features**:
- Search input with debounced queries
- Filter toggles and controls
- View mode switching (list/map)
- Results display with pagination
- Loading and error states
- Geolocation integration

**State Management**:
- Search query and filters
- Results and pagination
- Loading and error states
- User location
- View preferences

#### `SearchFilters` Component
**Location**: `components/search/SearchFilters.tsx`

**Purpose**: Comprehensive filter interface

**Filter Categories**:
- **Location**: Address input, radius slider
- **Services**: Category selection, specialty checkboxes
- **Availability**: Date/time pickers
- **Quality**: Rating slider, verified toggle
- **Price**: Price range selection
- **Languages**: Language checkboxes
- **Additional**: Mobile service, distance sorting

#### `BarberCard` Component
**Location**: `components/search/BarberCard.tsx`

**Purpose**: Individual barber display card

**Features**:
- Barber information display
- Rating and review count
- Service list with prices
- Contact actions (call, website, Instagram)
- Favorite toggle
- Distance display
- Availability indicator
- Photo gallery

#### `MapView` Component
**Location**: `components/search/MapView.tsx`

**Purpose**: Map-based barber display

**Features**:
- Interactive map with barber markers
- User location marker
- Barber selection and details
- Map controls (zoom, center)
- Responsive design

**Note**: Currently implements a simplified static map. For production, integrate with a map provider like Google Maps, Mapbox, or OpenStreetMap.

### Utility Functions

#### `search-utils.ts`
**Location**: `lib/search-utils.ts`

**Key Functions**:
- `calculateDistance()`: Haversine formula for distance calculation
- `getCurrentLocation()`: Geolocation API wrapper
- `isCurrentlyOpen()`: Business hours validation
- `validateSearchFilters()`: Input validation
- `buildSearchQuery()` / `parseSearchQuery()`: URL parameter handling
- `formatDistance()`, `formatPriceRange()`: Display formatting
- `debounce()`: Search input debouncing

### UI Components

The feature includes several reusable UI components:
- `Checkbox`: Multi-select filters
- `Separator`: Visual separation
- `Slider`: Range inputs (rating, distance)
- `Switch`: Toggle controls

## Database Functions

### PostGIS Functions

#### `search_barbers_nearby()`
```sql
CREATE OR REPLACE FUNCTION search_barbers_nearby(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  search_radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  barber_id UUID,
  distance_km DOUBLE PRECISION
)
```

**Purpose**: Efficient geospatial search using PostGIS

#### `get_available_barbers()`
```sql
CREATE OR REPLACE FUNCTION get_available_barbers(
  search_date DATE,
  search_time TIME
)
RETURNS TABLE (barber_id UUID)
```

**Purpose**: Find barbers available at specific date/time

#### `get_available_time_slots()`
```sql
CREATE OR REPLACE FUNCTION get_available_time_slots(
  barber_id UUID,
  search_date DATE
)
RETURNS TABLE (time_slot TIMESTAMP WITH TIME ZONE)
```

**Purpose**: Get available appointment slots for a barber

### Triggers and Automation

#### Search Vector Updates
```sql
CREATE OR REPLACE FUNCTION update_barber_search_vector()
RETURNS TRIGGER
```

**Purpose**: Automatically update search vector when barber data changes

#### Rating Calculations
```sql
CREATE OR REPLACE FUNCTION update_barber_rating()
RETURNS TRIGGER
```

**Purpose**: Automatically recalculate rating when reviews are added/updated

## Performance Optimizations

### Database Indexes

1. **Geospatial Index**: `CREATE INDEX idx_barber_profiles_location ON barber_profiles USING GIST (location_point);`
2. **Search Vector Index**: `CREATE INDEX idx_barber_profiles_search ON barber_profiles USING GIN (search_vector);`
3. **Rating Index**: `CREATE INDEX idx_barber_profiles_rating ON barber_profiles (rating DESC);`
4. **Category Index**: `CREATE INDEX idx_services_category ON services (category);`
5. **Availability Index**: `CREATE INDEX idx_barber_availability_datetime ON barber_availability (barber_id, start_time, end_time);`

### Query Optimizations

1. **Geospatial Queries**: Use PostGIS functions for efficient distance calculations
2. **Text Search**: Use PostgreSQL's full-text search with GIN indexes
3. **Pagination**: Use `LIMIT` and `OFFSET` for efficient result pagination
4. **Selective Loading**: Only load necessary data fields in search results

### Frontend Optimizations

1. **Debounced Search**: Prevent excessive API calls during typing
2. **Lazy Loading**: Load additional results as user scrolls
3. **Caching**: Cache search results for repeated queries
4. **Geolocation Caching**: Cache user location for session

## Security Considerations

### Row Level Security (RLS)

All new tables implement RLS policies:

```sql
-- Barber reviews: Users can read all, only create/update their own
CREATE POLICY "Users can view all barber reviews" ON barber_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON barber_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON barber_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Barber photos: Public read, barber-only write
CREATE POLICY "Anyone can view barber photos" ON barber_photos FOR SELECT USING (true);
CREATE POLICY "Barbers can manage their photos" ON barber_photos FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM barber_profiles WHERE id = barber_photos.barber_id
  )
);

-- Barber availability: Public read, barber-only write
CREATE POLICY "Anyone can view barber availability" ON barber_availability FOR SELECT USING (true);
CREATE POLICY "Barbers can manage their availability" ON barber_availability FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM barber_profiles WHERE id = barber_availability.barber_id
  )
);
```

### API Security

1. **Authentication**: Uses Clerk JWT tokens for authenticated requests
2. **Input Validation**: Comprehensive validation using Zod schemas
3. **Rate Limiting**: Should be implemented at the API gateway level
4. **SQL Injection Prevention**: Uses parameterized queries

### Data Privacy

1. **Location Privacy**: User location is not stored, only used for search
2. **Contact Information**: Phone numbers and personal details are protected by RLS
3. **Review Privacy**: Users can only modify their own reviews

## Testing

### Unit Tests

**Location**: `__tests__/components/search/barber-search.test.tsx`

**Coverage**:
- Component rendering
- Search functionality
- Filter application
- View mode switching
- Pagination
- Error handling
- Accessibility

### Integration Tests

**Location**: `__tests__/api/barbers/search.test.ts`

**Coverage**:
- API endpoint functionality
- Parameter validation
- Database queries
- Response formatting
- Error scenarios
- Performance testing

### Test Data

Mock data includes:
- Sample barber profiles
- Service offerings
- Reviews and ratings
- Photos and availability
- Geolocation data

## Deployment Considerations

### Environment Variables

Required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Map Provider (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Database Migration

1. Run the migration: `supabase db push`
2. Verify PostGIS extension is enabled
3. Check all indexes are created
4. Test RLS policies
5. Populate initial data if needed

### Performance Monitoring

1. **Database Performance**: Monitor query execution times
2. **API Response Times**: Track search endpoint performance
3. **Frontend Metrics**: Monitor component render times
4. **User Experience**: Track search success rates

## Future Enhancements

### Planned Features

1. **Advanced Filtering**:
   - Price range sliders
   - Service duration filters
   - Barber experience level
   - Customer review sentiment

2. **Map Integration**:
   - Real-time map provider integration
   - Clustering for dense areas
   - Route planning to barber
   - Street view integration

3. **Search Intelligence**:
   - Machine learning recommendations
   - Search history and preferences
   - Trending barbers and services
   - Personalized results

4. **Performance Optimizations**:
   - Redis caching layer
   - CDN for images
   - Search result preloading
   - Infinite scroll pagination

### Technical Debt

1. **Map Component**: Replace static map with real map provider
2. **Caching**: Implement Redis for search result caching
3. **Image Optimization**: Add image compression and CDN
4. **Mobile Optimization**: Enhance mobile user experience

## Troubleshooting

### Common Issues

1. **PostGIS Not Enabled**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Search Vector Not Updating**:
   - Check trigger function exists
   - Verify trigger is attached to table
   - Manually update search vectors if needed

3. **Geolocation Not Working**:
   - Ensure HTTPS in production
   - Check browser permissions
   - Provide fallback location input

4. **Slow Search Performance**:
   - Verify indexes are created
   - Check query execution plans
   - Consider result caching

### Debug Tools

1. **Database Queries**: Use Supabase dashboard query analyzer
2. **API Testing**: Use tools like Postman or curl
3. **Frontend Debugging**: Browser developer tools
4. **Performance**: Use React DevTools Profiler

## Support and Maintenance

### Regular Maintenance

1. **Database Cleanup**: Remove old availability records
2. **Index Maintenance**: Reindex search vectors periodically
3. **Cache Invalidation**: Clear stale search caches
4. **Performance Review**: Monitor and optimize slow queries

### Monitoring

1. **Error Tracking**: Monitor API error rates
2. **Performance Metrics**: Track search response times
3. **User Analytics**: Monitor search patterns and success rates
4. **Database Health**: Monitor connection pools and query performance

For additional support or questions about this feature, please refer to the project documentation or contact the development team.