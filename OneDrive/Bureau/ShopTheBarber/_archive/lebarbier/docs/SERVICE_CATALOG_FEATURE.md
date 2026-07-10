# Service Catalog Feature Documentation

## Overview

The Service Catalog feature provides a comprehensive system for browsing, filtering, and booking barber services. It includes advanced search capabilities, detailed service information, and seamless integration with the booking system.

## Architecture

### Database Schema

The feature extends the existing database with enhanced service management:

#### Enhanced Services Table
```sql
services (
  id UUID PRIMARY KEY,
  barber_id UUID REFERENCES barber_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  category UUID REFERENCES service_categories(id),
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN DEFAULT true,
  booking_enabled BOOLEAN DEFAULT true,
  cancellation_policy TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Tables

**Service Categories**
```sql
service_categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Service Add-ons**
```sql
service_addons (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Service Reviews**
```sql
service_reviews (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  user_id UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Service Availability**
```sql
service_availability (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### GET /api/services/list
Retrieve services with filtering and pagination.

**Query Parameters:**
- `search` - Text search in service name and description
- `category` - Filter by category IDs (comma-separated)
- `barberId` - Filter by specific barber
- `minPrice`, `maxPrice` - Price range filter
- `minDuration`, `maxDuration` - Duration range filter
- `rating` - Minimum rating filter
- `sortBy` - Sort field (name, price, duration, rating, created_at)
- `sortOrder` - Sort direction (asc, desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12, max: 50)

**Response:**
```json
{
  "services": [...],
  "categories": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "priceRange": [0, 200],
  "durationRange": [15, 180]
}
```

#### POST /api/services/list
Create a new service (barbers only).

**Request Body:**
```json
{
  "name": "Classic Haircut",
  "description": "Traditional haircut with styling",
  "price": 25,
  "duration": 30,
  "category": "haircut",
  "image_url": "https://example.com/image.jpg",
  "video_url": "https://example.com/video.mp4",
  "booking_enabled": true,
  "cancellation_policy": "24 hours notice required"
}
```

#### GET /api/services/[id]
Retrieve detailed service information.

**Response:**
```json
{
  "service": {...},
  "addons": [...],
  "reviews": [...],
  "availability": [...],
  "relatedServices": [...]
}
```

#### PUT /api/services/[id]
Update service details (service owner only).

#### DELETE /api/services/[id]
Soft delete a service (service owner only).

## Frontend Components

### Main Components

#### ServiceCatalog
**Location:** `components/services/ServiceCatalog.tsx`

Main catalog page with:
- Search functionality with debounced input
- Advanced filtering sidebar
- Grid/list view toggle
- Sorting options
- Pagination
- Service detail modal
- Responsive design

**Key Features:**
- URL state management
- Real-time search
- Filter persistence
- Mobile-optimized filters
- Loading states
- Error handling

#### ServiceCard
**Location:** `components/services/ServiceCard.tsx`

Individual service display with:
- Service image with fallback
- Service details (name, price, duration)
- Barber information
- Rating display
- Favorite toggle
- Category badge
- Verified barber indicator

**Props:**
```typescript
interface ServiceCardProps {
  service: Service;
  viewMode: 'grid' | 'list';
  onClick: (service: Service) => void;
  onFavoriteToggle: (serviceId: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
  className?: string;
}
```

#### ServiceDetailModal
**Location:** `components/services/ServiceDetailModal.tsx`

Detailed service view with:
- Image/video carousel
- Complete service information
- Add-ons selection
- Reviews section
- Barber profile
- Booking integration
- Share functionality

#### ServiceFilters
**Location:** `components/services/ServiceFilters.tsx`

Advanced filtering with:
- Category checkboxes
- Price range slider
- Duration range slider
- Rating filter
- Active filter display
- Clear filters option

### UI Components

#### LoadingSkeleton
**Location:** `components/services/LoadingSkeleton.tsx`

Loading states for:
- Service cards (grid/list)
- Filter sidebar
- Service detail modal

## Utility Functions

### Service Utilities
**Location:** `lib/service-utils.ts`

```typescript
// Format price with currency
formatPrice(price: number): string

// Format duration in human-readable format
formatDuration(minutes: number): string

// Calculate average rating
calculateAverageRating(reviews: Review[]): number

// Generate service URL slug
generateServiceSlug(name: string, id: string): string

// Validate service data
validateServiceData(data: Partial<Service>): ValidationResult

// Build search query parameters
buildSearchQuery(filters: ServiceFilters): URLSearchParams

// Parse search parameters
parseSearchParams(searchParams: URLSearchParams): ServiceFilters
```

## Database Functions

### Service Search Function
```sql
CREATE OR REPLACE FUNCTION search_services(
  search_query TEXT DEFAULT NULL,
  category_ids UUID[] DEFAULT NULL,
  barber_id_param UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  min_duration INTEGER DEFAULT NULL,
  max_duration INTEGER DEFAULT NULL,
  min_rating DECIMAL DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc',
  page_limit INTEGER DEFAULT 12,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  service_data JSONB,
  total_count BIGINT
);
```

### Update Service Rating Function
```sql
CREATE OR REPLACE FUNCTION update_service_rating(service_id_param UUID)
RETURNS VOID;
```

## Performance Optimizations

### Database Indexes
```sql
-- Service search optimization
CREATE INDEX idx_services_search ON services USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_services_active_category ON services(is_active, category) WHERE is_active = true;
CREATE INDEX idx_services_price_duration ON services(price, duration) WHERE is_active = true;
CREATE INDEX idx_services_rating ON services(rating DESC) WHERE is_active = true;

-- Category optimization
CREATE INDEX idx_service_categories_active ON service_categories(is_active, sort_order) WHERE is_active = true;

-- Review optimization
CREATE INDEX idx_service_reviews_service_rating ON service_reviews(service_id, rating);
CREATE INDEX idx_service_reviews_verified ON service_reviews(service_id, is_verified) WHERE is_verified = true;
```

### Frontend Optimizations
- Debounced search input (300ms)
- Virtual scrolling for large lists
- Image lazy loading
- Component memoization
- Efficient state management
- URL-based state persistence

## Security Considerations

### Row Level Security (RLS)
```sql
-- Services: Only active services visible to clients
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (is_active = true);

-- Service creation: Only barbers can create
CREATE POLICY "Barbers can create services" ON services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE id = barber_id AND user_id = auth.uid()
    )
  );

-- Service updates: Only service owner
CREATE POLICY "Barbers can update own services" ON services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE id = barber_id AND user_id = auth.uid()
    )
  );
```

### Input Validation
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection
- File upload validation
- Rate limiting on API endpoints

## Testing

### API Tests
**Location:** `__tests__/api/services/`

- Service listing with filters
- Service creation validation
- Service updates and permissions
- Error handling
- Pagination
- Search functionality

### Component Tests
**Location:** `__tests__/components/services/`

- ServiceCatalog functionality
- ServiceCard rendering and interactions
- ServiceFilters behavior
- Modal operations
- Responsive design
- Accessibility compliance

### Test Coverage
- API endpoints: 95%+
- Components: 90%+
- Utility functions: 100%
- Integration tests for booking flow

## Storage Configuration

### Supabase Storage
```sql
-- Service images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true);

-- Storage policies
CREATE POLICY "Service images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Barbers can upload service images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-images' AND
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE user_id = auth.uid()
    )
  );
```

### Environment Variables
```env
# Required in .env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional configurations
SERVICE_IMAGES_MAX_SIZE=5242880  # 5MB
SERVICE_IMAGES_ALLOWED_TYPES=image/jpeg,image/png,image/webp
SERVICE_SEARCH_DEBOUNCE_MS=300
SERVICE_CATALOG_PAGE_SIZE=12
```

## Deployment Considerations

### Database Migration
1. Run migration: `005_service_catalog_enhancements.sql`
2. Verify indexes are created
3. Test RLS policies
4. Populate default categories

### Storage Setup
1. Create service-images bucket
2. Configure CORS for image uploads
3. Set up CDN for image delivery
4. Configure image optimization

### Performance Monitoring
- Database query performance
- API response times
- Image loading metrics
- Search performance
- User engagement analytics

## Future Enhancements

### Planned Features
1. **Advanced Search**
   - Geolocation-based filtering
   - Availability-based search
   - AI-powered recommendations

2. **Enhanced Media**
   - Video previews
   - 360° service views
   - Before/after galleries

3. **Social Features**
   - Service sharing
   - Social media integration
   - User-generated content

4. **Business Intelligence**
   - Service analytics
   - Performance metrics
   - Revenue tracking

5. **Mobile App**
   - Native mobile components
   - Offline capabilities
   - Push notifications

### Technical Improvements
- GraphQL API implementation
- Real-time updates with WebSockets
- Advanced caching strategies
- Microservices architecture
- Machine learning recommendations

## Troubleshooting

### Common Issues

**Services not loading:**
- Check database connection
- Verify RLS policies
- Check API endpoint status
- Validate authentication

**Search not working:**
- Verify search indexes
- Check text search configuration
- Validate search parameters
- Test database function

**Images not displaying:**
- Check storage bucket configuration
- Verify CORS settings
- Test image URLs
- Check file permissions

**Filters not applying:**
- Verify URL parameter parsing
- Check filter state management
- Test API query building
- Validate filter logic

### Debug Commands
```sql
-- Check service search performance
EXPLAIN ANALYZE SELECT * FROM search_services('haircut');

-- Verify service counts by category
SELECT c.name, COUNT(s.id) 
FROM service_categories c 
LEFT JOIN services s ON c.id = s.category 
WHERE s.is_active = true 
GROUP BY c.id, c.name;

-- Check rating calculations
SELECT s.id, s.name, s.rating, s.review_count,
       AVG(sr.rating) as calculated_rating,
       COUNT(sr.id) as actual_review_count
FROM services s
LEFT JOIN service_reviews sr ON s.id = sr.service_id
GROUP BY s.id, s.name, s.rating, s.review_count;
```

## Conclusion

The Service Catalog feature provides a comprehensive, scalable solution for service discovery and booking. It combines advanced search capabilities, intuitive filtering, and seamless user experience while maintaining high performance and security standards.

The modular architecture ensures easy maintenance and future enhancements, while comprehensive testing guarantees reliability and user satisfaction.