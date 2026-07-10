import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import BookingForm from '@/components/booking/BookingForm';
import { createClient } from '@/lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user-1', isSignedIn: true }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSupabase = {
  from: jest.fn(),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('BookingForm', () => {
  const defaultProps = {
    barber: {
      id: 'barber-1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      address_street: '123 Main St',
      address_city: 'New York',
      address_state: 'NY',
      address_zip: '10001',
    },
    services: [
      {
        id: 'service-1',
        name: 'Haircut',
        price: 25,
        duration: 30,
        description: 'Professional haircut',
      },
      {
        id: 'service-2',
        name: 'Beard Trim',
        price: 15,
        duration: 15,
        description: 'Beard trimming service',
      },
    ],
    selectedSlot: {
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '09:30:00',
      reservation_id: 'reservation-1',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    onCancel: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
    
    // Mock user profile fetch
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1987654321',
            },
            error: null,
          }),
        }),
      }),
    });
  });

  it('renders booking summary correctly', async () => {
    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 9:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
      expect(screen.getByText('$40.00')).toBeInTheDocument(); // Total price
    });
  });

  it('loads and displays user profile information', async () => {
    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1987654321')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<BookingForm {...defaultProps} />);

    // Clear required fields
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '' } });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(<BookingForm {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
    });
  });

  it('validates deposit amount', async () => {
    render(<BookingForm {...defaultProps} />);

    const depositInput = screen.getByLabelText(/deposit/i);
    fireEvent.change(depositInput, { target: { value: '50' } }); // More than total

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/deposit cannot exceed total amount/i)).toBeInTheDocument();
    });
  });

  it('submits booking successfully', async () => {
    const mockAppointment = {
      success: true,
      data: {
        appointment: {
          id: 'appointment-1',
          appointment_date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '09:30:00',
          status: 'confirmed',
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAppointment),
    } as Response);

    const onSuccess = jest.fn();
    render(<BookingForm {...defaultProps} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Fill in notes
    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: 'Please be on time' } });

    // Set deposit
    const depositInput = screen.getByLabelText(/deposit/i);
    fireEvent.change(depositInput, { target: { value: '10' } });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/appointments',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Please be on time'),
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledWith('appointment-1');
  });

  it('handles booking submission errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Time slot is no longer available' }),
    } as Response);

    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Time slot is no longer available/)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockFetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { appointment: { id: 'test' } } }),
      } as Response), 100))
    );

    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    expect(screen.getByText('Creating Appointment...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<BookingForm {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('displays barber contact information', () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
  });

  it('calculates total price correctly', () => {
    render(<BookingForm {...defaultProps} />);

    // Service 1: $25, Service 2: $15, Total: $40
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
  });

  it('handles missing user profile gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      // Should still render form with empty fields
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('');
    });
  });

  it('formats time display correctly', () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText('9:00 AM - 9:30 AM')).toBeInTheDocument();
  });

  it('formats date display correctly', () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('shows service duration information', () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('allows optional notes input', async () => {
    render(<BookingForm {...defaultProps} />);

    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: 'Special instructions here' } });

    expect(notesInput).toHaveValue('Special instructions here');
  });

  it('validates notes length', async () => {
    render(<BookingForm {...defaultProps} />);

    const longNotes = 'a'.repeat(501); // Exceeds 500 character limit
    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: longNotes } });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/notes must be 500 characters or less/i)).toBeInTheDocument();
    });
  });

  it('shows payment summary with deposit', () => {
    render(<BookingForm {...defaultProps} />);

    const depositInput = screen.getByLabelText(/deposit/i);
    fireEvent.change(depositInput, { target: { value: '10' } });

    expect(screen.getByText('Deposit: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Remaining: $30.00')).toBeInTheDocument();
  });

  it('handles network errors during submission', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<BookingForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Confirm Booking');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create appointment/)).toBeInTheDocument();
    });
  });
});