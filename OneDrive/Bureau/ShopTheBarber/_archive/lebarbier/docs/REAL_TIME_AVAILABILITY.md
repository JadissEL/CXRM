# Real-Time Availability Feature

This document describes the implementation of the Real-Time Availability feature for the Le Barbier booking system.

## Overview

The Real-Time Availability feature provides users with live, up-to-date information about barber availability and prevents double-booking through a sophisticated reservation and locking system.

## Architecture

### Database Schema

The feature uses several database tables to manage availability and bookings:

#### Core Tables

1. **`appointments`** - Enhanced with real-time booking protection
   - `booking_token` - Unique token for booking protection
   - `token_expires_at` - Token expiration timestamp
   - `locked_by` - User ID who has locked the slot
   - `locked_until` - Lock expiration timestamp

2. **`barber_working_hours`** - Daily working schedules
   - `barber_id` - Reference to barber
   - `day_of_week` - 0-6 (Sunday-Saturday)
   - `start_time` - Work start time
   - `end_time` - Work end time
   - `slot_duration` - Duration of each booking slot
   - `buffer_time` - Buffer between appointments

3. **`barber_breaks`** - Scheduled breaks
   - `barber_id` - Reference to barber
   - `break_date` - Specific date (if not recurring)
   - `start_time` - Break start time
   - `end_time` - Break end time
   - `is_recurring` - Whether break repeats
   - `recurrence_pattern` - How often it repeats

4. **`barber_holidays`** - Days off and holidays
   - `barber_id` - Reference to barber
   - `holiday_date` - Specific date (if not recurring)
   - `start_date` - Start of holiday period
   - `end_date` - End of holiday period
   - `is_recurring` - Whether holiday repeats annually

5. **`slot_reservations`** - Temporary slot reservations
   - `barber_id` - Reference to barber
   - `user_id` - User who reserved the slot
   - `reservation_date` - Date of reservation
   - `start_time` - Slot start time
   - `end_time` - Slot end time
   - `expires_at` - When reservation expires
   - `service_ids` - Array of service IDs

### API Endpoints

#### Availability Endpoint

**GET `/api/barbers/[id]/availability`**

Retrieves available time slots for a barber.

**Query Parameters:**
- `date` (required) - Date in YYYY-MM-DD format
- `service_ids` (required) - Comma-separated service IDs
- `start_time` (optional) - Filter slots after this time
- `end_time` (optional) - Filter slots before this time

**Response:**
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "start_time": "09:00:00",
        "end_time": "09:30:00",
        "is_available": true
      }
    ]
  }
}
```

**POST `/api/barbers/[id]/availability`**

Reserves a time slot temporarily.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "09:30:00",
  "service_ids": ["service-1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reservation_id": "reservation-123",
    "expires_at": "2024-01-15T09:15:00Z"
  }
}
```

**DELETE `/api/barbers/[id]/availability`**

Cancels a slot reservation.

**Query Parameters:**
- `reservation_id` (required) - ID of reservation to cancel

#### Appointments Endpoint

**GET `/api/appointments`**

Lists appointments with filtering and pagination.

**Query Parameters:**
- `status` (optional) - Filter by appointment status
- `barber_id` (optional) - Filter by barber
- `date_from` (optional) - Filter appointments from date
- `date_to` (optional) - Filter appointments to date
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**POST `/api/appointments`**

Creates a new appointment.

**Request Body:**
```json
{
  "barber_id": "barber-1",
  "service_ids": ["service-1"],
  "appointment_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "09:30:00",
  "client_notes": "Please be on time",
  "deposit_amount": 10,
  "reservation_id": "reservation-123"
}
```

### Database Functions

#### `get_barber_availability`

Calculates available time slots for a barber considering:
- Working hours
- Existing appointments
- Scheduled breaks
- Holidays
- Current reservations

**Parameters:**
- `p_barber_id` - Barber UUID
- `p_date` - Target date
- `p_service_ids` - Array of service UUIDs
- `p_start_time` - Optional start time filter
- `p_end_time` - Optional end time filter

#### `reserve_time_slot`

Temporarily reserves a time slot with conflict checking.

**Parameters:**
- `p_barber_id` - Barber UUID
- `p_user_id` - User UUID
- `p_date` - Reservation date
- `p_start_time` - Slot start time
- `p_end_time` - Slot end time
- `p_service_ids` - Array of service UUIDs

#### `create_appointment_with_validation`

Creates an appointment with real-time validation.

**Parameters:**
- `p_client_id` - Client UUID
- `p_barber_id` - Barber UUID
- `p_service_ids` - Array of service UUIDs
- `p_appointment_date` - Appointment date
- `p_start_time` - Start time
- `p_end_time` - End time
- `p_client_notes` - Optional notes
- `p_deposit_amount` - Optional deposit
- `p_reservation_id` - Optional reservation ID

#### `cleanup_expired_reservations`

Removes expired slot reservations.

## Frontend Components

### AvailabilityCalendar

Displays available time slots in a calendar format with real-time updates.

**Features:**
- Week navigation
- Time slot grouping (Morning, Afternoon, Evening)
- Real-time availability updates via Supabase subscriptions
- Slot reservation with countdown timer
- Automatic cleanup of expired reservations

**Props:**
```typescript
interface AvailabilityCalendarProps {
  barberId: string;
  serviceIds: string[];
  onSlotSelect: (slot: SelectedSlot | null) => void;
  selectedSlot: SelectedSlot | null;
}
```

### BookingForm

Handles the appointment booking process with form validation.

**Features:**
- User profile pre-filling
- Form validation with Zod schemas
- Booking summary display
- Payment/deposit handling
- Error handling and loading states

**Props:**
```typescript
interface BookingFormProps {
  barber: Barber;
  services: Service[];
  selectedSlot: SelectedSlot;
  onCancel: () => void;
  onSuccess: (appointmentId: string) => void;
}
```

### BookingPage

Main booking page that orchestrates the entire booking flow.

**Features:**
- Step-by-step booking process
- State management for booking flow
- Authentication checks
- Error boundary handling

## Real-Time Features

### Supabase Realtime Integration

The system uses Supabase Realtime to provide live updates:

1. **Availability Updates** - Listens to changes in `appointments` and `slot_reservations` tables
2. **Booking Notifications** - Real-time updates when bookings are created/modified
3. **Reservation Expiry** - Automatic cleanup when reservations expire

### Subscription Setup

```typescript
const supabase = createClient();
const channel = supabase
  .channel('availability-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
    },
    handleAvailabilityChange
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'slot_reservations',
    },
    handleReservationChange
  )
  .subscribe();
```

### Conflict Resolution

The system handles booking conflicts through:

1. **Optimistic Locking** - Using reservation tokens
2. **Real-time Validation** - Checking availability at booking time
3. **Automatic Cleanup** - Removing expired reservations
4. **User Feedback** - Clear error messages for conflicts

## Testing

### Unit Tests

- **API Endpoints** - Test all availability and appointment endpoints
- **Database Functions** - Test SQL functions with various scenarios
- **React Components** - Test UI behavior and user interactions

### Integration Tests

- **Complete Booking Flow** - End-to-end booking process
- **Conflict Scenarios** - Double-booking prevention
- **Real-time Behavior** - Subscription and update handling

### Test Files

- `__tests__/api/availability.test.ts` - Availability endpoint tests
- `__tests__/api/appointments.test.ts` - Appointments endpoint tests
- `__tests__/components/AvailabilityCalendar.test.tsx` - Calendar component tests
- `__tests__/components/BookingForm.test.tsx` - Booking form tests
- `__tests__/integration/booking-flow.test.ts` - Integration tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test availability.test.ts

# Run tests in watch mode
npm run test:watch
```

## Configuration

### Environment Variables

See `.env.example` for all configuration options. Key variables:

- `SLOT_RESERVATION_TIMEOUT_MINUTES` - How long slots are reserved (default: 10)
- `ENABLE_REALTIME_AVAILABILITY` - Enable real-time updates (default: true)
- `MAX_CONCURRENT_RESERVATIONS` - Max reservations per user (default: 3)
- `BOOKING_CONFLICT_STRATEGY` - How to handle conflicts (default: reject)

### Database Setup

Run the migration to set up the database schema:

```bash
supabase migration up
```

The migration file `006_real_time_availability.sql` includes:
- Table creation
- Indexes for performance
- RLS policies for security
- Database functions
- Realtime configuration

## Security Considerations

### Row Level Security (RLS)

All tables have RLS policies to ensure:
- Users can only see their own appointments and reservations
- Barbers can manage their own availability
- Admins have full access

### Input Validation

- All API endpoints use Zod schemas for validation
- SQL injection prevention through parameterized queries
- Rate limiting on booking endpoints

### Authentication

- All booking operations require authentication
- Clerk integration for user management
- JWT token validation

## Performance Optimization

### Database Indexes

- Composite indexes on frequently queried columns
- Partial indexes for active appointments
- GIN indexes for array columns

### Caching Strategy

- Client-side caching of availability data
- Automatic cache invalidation on updates
- Optimistic UI updates

### Connection Pooling

- Configured connection pool for high concurrency
- Proper connection cleanup
- Timeout handling

## Monitoring and Debugging

### Logging

- Structured logging for all booking operations
- Error tracking with context
- Performance metrics

### Health Checks

- Database connectivity checks
- Realtime subscription status
- Reservation cleanup job monitoring

## Deployment

### Production Checklist

1. ✅ Database migrations applied
2. ✅ Environment variables configured
3. ✅ RLS policies enabled
4. ✅ Realtime subscriptions configured
5. ✅ Rate limiting enabled
6. ✅ Monitoring setup
7. ✅ Backup strategy in place

### Scaling Considerations

- Database read replicas for availability queries
- CDN for static assets
- Load balancing for API endpoints
- Horizontal scaling of reservation cleanup jobs

## Troubleshooting

### Common Issues

1. **Reservations not expiring**
   - Check cleanup job configuration
   - Verify database triggers

2. **Real-time updates not working**
   - Check Supabase Realtime configuration
   - Verify RLS policies
   - Check network connectivity

3. **Double-booking occurring**
   - Review database function logic
   - Check for race conditions
   - Verify transaction isolation

### Debug Tools

- Supabase dashboard for real-time monitoring
- Database query logs
- Client-side console logging
- Network request inspection

## Future Enhancements

### Planned Features

1. **Waitlist System** - Queue users for popular time slots
2. **Smart Scheduling** - AI-powered slot recommendations
3. **Multi-location Support** - Handle multiple barber locations
4. **Advanced Notifications** - SMS and push notifications
5. **Analytics Dashboard** - Booking patterns and insights

### Technical Improvements

1. **GraphQL API** - More efficient data fetching
2. **Offline Support** - PWA capabilities
3. **Advanced Caching** - Redis integration
4. **Microservices** - Split booking logic into separate services