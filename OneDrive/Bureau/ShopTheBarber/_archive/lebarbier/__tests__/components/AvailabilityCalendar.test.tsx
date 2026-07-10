import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import AvailabilityCalendar from '@/components/booking/AvailabilityCalendar';
import { createClient } from '@/lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user-1', isSignedIn: true }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSupabase = {
  channel: jest.fn(),
  removeChannel: jest.fn(),
};

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AvailabilityCalendar', () => {
  const defaultProps = {
    barberId: 'barber-1',
    serviceIds: ['service-1'],
    onSlotSelect: jest.fn(),
    selectedSlot: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
    mockSupabase.channel.mockReturnValue(mockChannel as any);
    mockChannel.on.mockReturnValue(mockChannel as any);
    mockChannel.subscribe.mockReturnValue(Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders calendar with week navigation', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    
    expect(screen.getByText('Previous Week')).toBeInTheDocument();
    expect(screen.getByText('Next Week')).toBeInTheDocument();
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('fetches availability data on mount', async () => {
    const mockAvailability = {
      success: true,
      data: {
        slots: [
          {
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '09:30:00',
            is_available: true,
          },
          {
            date: '2024-01-15',
            start_time: '09:30:00',
            end_time: '10:00:00',
            is_available: true,
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAvailability),
    } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/barbers/barber-1/availability'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  it('displays available time slots', async () => {
    const mockAvailability = {
      success: true,
      data: {
        slots: [
          {
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '09:30:00',
            is_available: true,
          },
          {
            date: '2024-01-15',
            start_time: '10:00:00',
            end_time: '10:30:00',
            is_available: false,
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAvailability),
    } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    // Available slot should be clickable
    const availableSlot = screen.getByText('9:00 AM').closest('button');
    expect(availableSlot).not.toBeDisabled();

    // Unavailable slot should be disabled
    const unavailableSlot = screen.getByText('10:00 AM').closest('button');
    expect(unavailableSlot).toBeDisabled();
  });

  it('handles slot selection', async () => {
    const mockAvailability = {
      success: true,
      data: {
        slots: [
          {
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '09:30:00',
            is_available: true,
          },
        ],
      },
    };

    const mockReservation = {
      success: true,
      data: {
        reservation_id: 'reservation-1',
        expires_at: '2024-01-15T09:15:00Z',
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailability),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReservation),
      } as Response);

    const onSlotSelect = jest.fn();
    render(<AvailabilityCalendar {...defaultProps} onSlotSelect={onSlotSelect} />);

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const slotButton = screen.getByText('9:00 AM').closest('button');
    fireEvent.click(slotButton!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/barbers/barber-1/availability'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('09:00:00'),
        })
      );
    });

    expect(onSlotSelect).toHaveBeenCalledWith({
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '09:30:00',
      reservation_id: 'reservation-1',
      expires_at: '2024-01-15T09:15:00Z',
    });
  });

  it('displays reservation countdown timer', async () => {
    jest.useFakeTimers();
    
    const selectedSlot = {
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '09:30:00',
      reservation_id: 'reservation-1',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    };

    render(<AvailabilityCalendar {...defaultProps} selectedSlot={selectedSlot} />);

    expect(screen.getByText(/Reserved for/)).toBeInTheDocument();
    expect(screen.getByText(/9:59/)).toBeInTheDocument(); // Should show countdown

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    expect(screen.getByText(/8:59/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('handles reservation expiration', async () => {
    jest.useFakeTimers();
    
    const onSlotSelect = jest.fn();
    const selectedSlot = {
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '09:30:00',
      reservation_id: 'reservation-1',
      expires_at: new Date(Date.now() + 5000).toISOString(), // 5 seconds from now
    };

    render(<AvailabilityCalendar {...defaultProps} selectedSlot={selectedSlot} onSlotSelect={onSlotSelect} />);

    // Fast forward past expiration
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(onSlotSelect).toHaveBeenCalledWith(null);
    expect(screen.getByText(/Reservation expired/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('navigates between weeks', async () => {
    const mockAvailability = {
      success: true,
      data: { slots: [] },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAvailability),
    } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    const nextWeekButton = screen.getByText('Next Week');
    fireEvent.click(nextWeekButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + next week
    });

    const prevWeekButton = screen.getByText('Previous Week');
    fireEvent.click(prevWeekButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3); // + previous week
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load availability/)).toBeInTheDocument();
    });
  });

  it('handles slot reservation errors', async () => {
    const mockAvailability = {
      success: true,
      data: {
        slots: [
          {
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '09:30:00',
            is_available: true,
          },
        ],
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailability),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Slot already taken' }),
      } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const slotButton = screen.getByText('9:00 AM').closest('button');
    fireEvent.click(slotButton!);

    await waitFor(() => {
      expect(screen.getByText(/Slot already taken/)).toBeInTheDocument();
    });
  });

  it('subscribes to real-time updates', () => {
    render(<AvailabilityCalendar {...defaultProps} />);

    expect(mockSupabase.channel).toHaveBeenCalledWith('availability-updates');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'appointments',
      }),
      expect.any(Function)
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'slot_reservations',
      }),
      expect.any(Function)
    );
  });

  it('cancels reservation when component unmounts', () => {
    const selectedSlot = {
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '09:30:00',
      reservation_id: 'reservation-1',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    const { unmount } = render(
      <AvailabilityCalendar {...defaultProps} selectedSlot={selectedSlot} />
    );

    unmount();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/barbers/barber-1/availability'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('groups slots by time periods correctly', async () => {
    const mockAvailability = {
      success: true,
      data: {
        slots: [
          {
            date: '2024-01-15',
            start_time: '08:00:00',
            end_time: '08:30:00',
            is_available: true,
          },
          {
            date: '2024-01-15',
            start_time: '13:00:00',
            end_time: '13:30:00',
            is_available: true,
          },
          {
            date: '2024-01-15',
            start_time: '18:00:00',
            end_time: '18:30:00',
            is_available: true,
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAvailability),
    } as Response);

    render(<AvailabilityCalendar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText('Evening')).toBeInTheDocument();
    });

    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
    expect(screen.getByText('1:00 PM')).toBeInTheDocument();
    expect(screen.getByText('6:00 PM')).toBeInTheDocument();
  });
});