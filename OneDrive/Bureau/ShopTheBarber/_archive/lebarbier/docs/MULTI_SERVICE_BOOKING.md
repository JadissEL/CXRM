# Multi-Service Booking Feature

A comprehensive multi-service booking system for the barbershop application, allowing clients to book multiple services in a single appointment with real-time availability checking and atomic transaction handling.

## Overview

The multi-service booking feature enables:
- Selection of multiple services for a single appointment
- Real-time availability checking for combined service duration
- Automatic price and duration calculation
- Atomic appointment creation with conflict prevention
- Comprehensive booking confirmations with service details
- Robust error handling and validation

## Architecture

### Database Schema

The `appointments` table has been enhanced to support multi-service bookings:

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  service_ids UUID[] NOT NULL, -- Array of service IDs
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Database Functions

#### `get_barber_availability(p_barber_id, p_date, p_service_ids)`
- Calculates total duration and price for selected services
- Checks barber working hours, holidays, and breaks
- Identifies available time slots for the combined duration
- Returns structured availability data

#### `reserve_time_slot(p_barber_id, p_date, p_start_time, p_duration)`
- Temporarily reserves a time slot (15-minute expiration)
- Prevents double-booking during the reservation process
- Returns reservation ID for validation

#### `create_appointment_with_validation(params)`
- Atomically creates appointments with final availability check
- Validates optional reservation tokens
- Handles all edge cases and conflicts
- Returns appointment ID or detailed error messages

## API Endpoints

### POST `/api/appointments`

Creates a new multi-service appointment.

**Request Body:**
```json
{
  "barber_id": "uuid",
  "service_ids": ["uuid1", "uuid2", "uuid3"],
  "appointment_date": "2024-01-15",
  "start_time": "09:00",
  "notes": "Optional notes",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "reservation_id": "optional-reservation-uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "appointment-uuid",
  "barber_id": "barber-uuid",
  "client_id": "client-uuid",
  "service_ids": ["service1-uuid", "service2-uuid"],
  "appointment_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "09:45:00",
  "status": "confirmed",
  "total_price": 65.00,
  "deposit_amount": 13.00,
  "notes": "Optional notes",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-10T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, invalid service IDs
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Barber or services not found
- `409 Conflict`: Time slot unavailable, scheduling conflicts
- `422 Unprocessable Entity`: Business logic violations

### GET `/api/appointments`

Retrieves appointments with service details and filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by appointment status
- `barber_id`: Filter by barber
- `client_id`: Filter by client
- `date_from`: Start date filter (YYYY-MM-DD)
- `date_to`: End date filter (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "appointments": [
    {
      "id": "appointment-uuid",
      "barber": {
        "id": "barber-uuid",
        "name": "Mike Johnson",
        "email": "mike@barbershop.com"
      },
      "services": [
        {
          "id": "service1-uuid",
          "name": "Classic Haircut",
          "duration": 30,
          "price": 25.00,
          "category": "Haircut"
        },
        {
          "id": "service2-uuid",
          "name": "Beard Trim",
          "duration": 15,
          "price": 15.00,
          "category": "Beard"
        }
      ],
      "appointment_date": "2024-01-15",
      "start_time": "09:00:00",
      "end_time": "09:45:00",
      "status": "confirmed",
      "total_price": 40.00,
      "totalDuration": 45,
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "notes": "Optional notes"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST `/api/notifications/booking-confirmation`

Sends booking confirmation emails with detailed service information.

**Request Body:**
```json
{
  "appointmentId": "appointment-uuid",
  "clientEmail": "john@example.com",
  "clientName": "John Doe",
  "barberName": "Mike Johnson",
  "appointmentDate": "2024-01-15",
  "startTime": "09:00",
  "services": [
    {
      "id": "service1-uuid",
      "name": "Classic Haircut",
      "description": "Traditional haircut with styling",
      "duration": 30,
      "price": 25.00,
      "category": "Haircut"
    }
  ],
  "totalPrice": 40.00,
  "depositAmount": 8.00
}
```

## Frontend Components

### MultiServiceSelector

Location: `/components/booking/MultiServiceSelector.tsx`

**Features:**
- Service browsing with category filtering
- Search functionality
- Multiple service selection with quantities
- Real-time price and duration calculation
- Service compatibility validation
- Responsive design with modern UI

**Props:**
```typescript
interface MultiServiceSelectorProps {
  barberId: string;
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  maxServices?: number;
  className?: string;
}
```

### MultiServiceBookingForm

Location: `/components/booking/MultiServiceBookingForm.tsx`

**Features:**
- Integration with MultiServiceSelector
- Real-time availability checking
- Time slot reservation system
- Form validation and error handling
- Booking confirmation flow
- Responsive calendar interface

**Props:**
```typescript
interface MultiServiceBookingFormProps {
  barberId: string;
  initialServices?: SelectedService[];
  onBookingComplete?: (appointment: Appointment) => void;
  className?: string;
}
```

### MultiServiceBookingConfirmation

Location: `/components/booking/MultiServiceBookingConfirmation.tsx`

**Features:**
- Detailed booking summary display
- Service breakdown with pricing
- Booking actions (copy, download, share)
- Responsive confirmation layout
- Integration with notification system

**Props:**
```typescript
interface MultiServiceBookingConfirmationProps {
  appointmentId: string;
  onClose?: () => void;
  className?: string;
}
```

## Usage Examples

### Basic Multi-Service Booking

```typescript
import { MultiServiceBookingForm } from '@/components/booking/MultiServiceBookingForm';

function BookingPage({ barberId }: { barberId: string }) {
  const handleBookingComplete = (appointment: Appointment) => {
    console.log('Booking completed:', appointment);
    // Redirect to confirmation page
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Book Your Appointment</h1>
      <MultiServiceBookingForm
        barberId={barberId}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  );
}
```

### Service Selection with Preselected Services

```typescript
import { MultiServiceSelector } from '@/components/booking/MultiServiceSelector';

function ServiceSelection() {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([
    {
      id: 'service-1',
      name: 'Classic Haircut',
      duration: 30,
      price: 25.00,
      quantity: 1
    }
  ]);

  return (
    <MultiServiceSelector
      barberId="barber-123"
      selectedServices={selectedServices}
      onServicesChange={setSelectedServices}
      maxServices={5}
    />
  );
}
```

### API Integration

```typescript
// Create multi-service appointment
const createAppointment = async (bookingData: BookingData) => {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barber_id: bookingData.barberId,
        service_ids: bookingData.serviceIds,
        appointment_date: bookingData.date,
        start_time: bookingData.startTime,
        client_name: bookingData.clientName,
        client_email: bookingData.clientEmail,
        client_phone: bookingData.clientPhone,
        notes: bookingData.notes,
        reservation_id: bookingData.reservationId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create appointment');
    }

    return await response.json();
  } catch (error) {
    console.error('Booking error:', error);
    throw error;
  }
};

// Send booking confirmation
const sendConfirmation = async (confirmationData: ConfirmationData) => {
  const response = await fetch('/api/notifications/booking-confirmation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(confirmationData)
  });

  return await response.json();
};
```

## Testing

### Unit Tests

Location: `/__tests__/booking/multi-service-booking.test.ts`

**Coverage:**
- Service selection logic
- Price and duration calculations
- Form validation
- Error handling
- UI state management
- Time formatting utilities

### Integration Tests

Location: `/__tests__/api/appointments/multi-service-integration.test.ts`

**Coverage:**
- Complete booking flow
- API endpoint testing
- Database integration
- Error scenarios
- Concurrent booking handling
- Notification system integration

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test multi-service-booking
npm test multi-service-integration

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Error Handling

### Common Error Scenarios

1. **Service Validation Errors**
   - Invalid service IDs
   - Inactive services
   - Service incompatibilities
   - Barber service mismatches

2. **Scheduling Conflicts**
   - Time slot unavailable
   - Barber not working
   - Holiday conflicts
   - Break time overlaps

3. **Business Logic Violations**
   - Past date bookings
   - Invalid time ranges
   - Exceeded service limits
   - Insufficient permissions

4. **System Errors**
   - Database connection issues
   - Authentication failures
   - Network timeouts
   - Validation schema errors

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field with error",
    "value": "invalid value",
    "constraint": "validation constraint violated"
  },
  "timestamp": "2024-01-10T10:00:00Z"
}
```

## Performance Considerations

### Database Optimization

- Indexed queries on frequently accessed columns
- Efficient array operations for service_ids
- Connection pooling for concurrent requests
- Query result caching for static data

### Frontend Optimization

- Debounced search and filtering
- Lazy loading for large service lists
- Memoized calculations for price/duration
- Optimistic UI updates with rollback

### Caching Strategy

- Service data caching (5-minute TTL)
- Barber availability caching (1-minute TTL)
- User session caching
- Static asset optimization

## Security

### Authentication & Authorization

- Clerk-based user authentication
- Role-based access control (RBAC)
- JWT token validation
- Session management

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting on API endpoints

### Privacy

- PII data encryption
- Secure data transmission (HTTPS)
- Data retention policies
- GDPR compliance measures

## Deployment

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Email Service
EMAIL_SERVICE_API_KEY=...
EMAIL_FROM_ADDRESS=...

# Application
NEXT_PUBLIC_APP_URL=https://...
NODE_ENV=production
```

### Database Migration

```bash
# Apply migrations
npx supabase db push

# Reset database (development only)
npx supabase db reset

# Generate types
npx supabase gen types typescript --local > types/supabase.ts
```

### Production Deployment

1. **Build Application**
   ```bash
   npm run build
   npm run start
   ```

2. **Database Setup**
   - Apply all migrations
   - Configure connection pooling
   - Set up monitoring

3. **Environment Configuration**
   - Set production environment variables
   - Configure email service
   - Set up error tracking

4. **Performance Monitoring**
   - Application performance monitoring
   - Database query analysis
   - Error rate tracking
   - User experience metrics

## Troubleshooting

### Common Issues

1. **Booking Conflicts**
   - Check barber working hours
   - Verify service availability
   - Review existing appointments
   - Validate time slot calculations

2. **Price Calculation Errors**
   - Verify service pricing data
   - Check calculation logic
   - Review tax and discount rules
   - Validate currency formatting

3. **Notification Failures**
   - Check email service configuration
   - Verify recipient email addresses
   - Review template formatting
   - Check rate limiting

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_BOOKING = process.env.NODE_ENV === 'development';

if (DEBUG_BOOKING) {
  console.log('Booking debug info:', {
    selectedServices,
    totalPrice,
    totalDuration,
    availableSlots
  });
}
```

## Future Enhancements

### Planned Features

1. **Advanced Scheduling**
   - Recurring appointments
   - Waitlist management
   - Automatic rescheduling
   - Smart time suggestions

2. **Enhanced Notifications**
   - SMS notifications
   - Push notifications
   - Reminder systems
   - Custom notification templates

3. **Analytics & Reporting**
   - Booking analytics
   - Revenue reporting
   - Service popularity metrics
   - Customer behavior analysis

4. **Integration Capabilities**
   - Calendar synchronization
   - Payment processing
   - CRM integration
   - Third-party booking platforms

### Technical Improvements

- Real-time updates with WebSockets
- Advanced caching strategies
- Microservices architecture
- GraphQL API implementation
- Mobile app development

## Support

For technical support or feature requests:

- **Documentation**: `/docs/`
- **API Reference**: `/docs/api/`
- **Issue Tracking**: GitHub Issues
- **Development Team**: Contact via internal channels

---

*Last updated: January 2024*
*Version: 1.0.0*