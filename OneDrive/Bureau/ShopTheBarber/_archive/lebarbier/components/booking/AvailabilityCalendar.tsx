'use client';

import React from 'react';
const { useState, useEffect, useCallback } = React;
import { Calendar, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@clerk/nextjs';
import { format, addDays, startOfWeek, isSameDay, isToday, isPast } from 'date-fns';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: number;
  duration: number;
}

interface AvailabilityData {
  date: string;
  slots: TimeSlot[];
  total_slots: number;
  available_slots: number;
}

interface SelectedSlot {
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  duration: number;
}

interface AvailabilityCalendarProps {
  barberId: string;
  serviceIds: string[];
  onSlotSelect: (slot: SelectedSlot | null) => void;
  selectedSlot: SelectedSlot | null;
  className?: string;
}

interface ReservationData {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  expires_at: string;
}

export default function AvailabilityCalendar({
  barberId,
  serviceIds,
  onSlotSelect,
  selectedSlot,
  className = '',
}: AvailabilityCalendarProps) {
  const { userId } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, AvailabilityData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservedSlot, setReservedSlot] = useState<ReservationData | null>(null);
  const [reservationTimer, setReservationTimer] = useState<number | null>(null);



  // Generate week dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch availability for the current week
  const fetchAvailability = useCallback(async () => {
    if (!barberId || serviceIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const promises = weekDates.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const response = await fetch(
          `/api/barbers/${barberId}/availability?` +
          new URLSearchParams({
            date: dateStr,
            service_ids: serviceIds.join(','),
          })
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch availability for ${dateStr}`);
        }

        const data = await response.json();
        return { date: dateStr, data: data.availability };
      });

      const results = await Promise.all(promises);
      const availabilityMap: Record<string, AvailabilityData> = {};
      
      results.forEach(({ date, data }) => {
        availabilityMap[date] = data;
      });

      setAvailability(availabilityMap);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [barberId, serviceIds, weekDates]);

  // Reserve a time slot
  const reserveSlot = async (date: string, startTime: string, endTime: string, price: number, duration: number) => {
    if (!userId) {
      setError('Please sign in to book an appointment');
      return;
    }

    try {
      const response = await fetch(`/api/barbers/${barberId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          start_time: startTime,
          end_time: endTime,
          service_ids: serviceIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reserve slot');
      }

      const data = await response.json();
      setReservedSlot(data.reservation);
      
      // Set timer for reservation expiry (15 minutes)
      const expiryTime = new Date(data.reservation.expires_at).getTime();
      const now = Date.now();
      const timeLeft = Math.max(0, expiryTime - now);
      
      if (timeLeft > 0) {
        setReservationTimer(Math.floor(timeLeft / 1000));
      }

      // Select the slot
      onSlotSelect({
        date,
        start_time: startTime,
        end_time: endTime,
        price,
        duration,
      });

      // Refresh availability to show updated slots
      fetchAvailability();
    } catch (err) {
      console.error('Error reserving slot:', err);
      setError(err instanceof Error ? err.message : 'Failed to reserve slot');
    }
  };

  // Cancel reservation
  const cancelReservation = async () => {
    if (!reservedSlot) return;

    try {
      const response = await fetch(`/api/barbers/${barberId}/availability`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservedSlot.id,
        }),
      });

      if (response.ok) {
        setReservedSlot(null);
        setReservationTimer(null);
        onSlotSelect(null);
        fetchAvailability();
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!barberId) return;

    // Subscribe to appointment changes
    const appointmentSubscription = supabase
      .channel('appointment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barber_id=eq.${barberId}`,
        },
        () => {
          // Refresh availability when appointments change
          fetchAvailability();
        }
      )
      .subscribe();

    // Subscribe to slot reservation changes
    const reservationSubscription = supabase
      .channel('reservation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slot_reservations',
          filter: `barber_id=eq.${barberId}`,
        },
        () => {
          // Refresh availability when reservations change
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      appointmentSubscription.unsubscribe();
      reservationSubscription.unsubscribe();
    };
  }, [barberId, fetchAvailability, supabase]);

  // Countdown timer for reservation
  useEffect(() => {
    if (reservationTimer === null) return;

    if (reservationTimer <= 0) {
      setReservedSlot(null);
      setReservationTimer(null);
      onSlotSelect(null);
      fetchAvailability();
      return;
    }

    const interval = setInterval(() => {
      setReservationTimer(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationTimer, onSlotSelect, fetchAvailability]);

  // Fetch availability when dependencies change
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  };

  const formatReservationTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const isSlotSelected = (date: string, startTime: string) => {
    return selectedSlot?.date === date && selectedSlot?.start_time === startTime;
  };

  const isSlotReserved = (date: string, startTime: string) => {
    return reservedSlot?.slot_date === date && reservedSlot?.start_time === startTime;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigateWeek('prev')}
          disabled={loading}
        >
          Previous Week
        </Button>
        
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h3>
        
        <Button
          variant="outline"
          onClick={() => navigateWeek('next')}
          disabled={loading}
        >
          Next Week
        </Button>
      </div>

      {/* Reservation Timer */}
      {reservedSlot && reservationTimer !== null && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Slot reserved! Complete booking within {formatReservationTime(reservationTimer)}
            <Button
              variant="link"
              size="sm"
              onClick={cancelReservation}
              className="ml-2 p-0 h-auto"
            >
              Cancel
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayAvailability = availability[dateStr];
          const isPastDate = isPast(date) && !isToday(date);

          return (
            <Card key={dateStr} className={`${isPastDate ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  <div className={`${isToday(date) ? 'text-blue-600 font-bold' : ''}`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className="text-lg">{format(date, 'd')}</div>
                  {dayAvailability && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {dayAvailability.available_slots}/{dayAvailability.total_slots} available
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : dayAvailability?.slots.length ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dayAvailability.slots.map((slot, index) => {
                      const isSelected = isSlotSelected(dateStr, slot.start_time);
                      const isReserved = isSlotReserved(dateStr, slot.start_time);
                      
                      return (
                        <Button
                          key={index}
                          variant={isSelected || isReserved ? 'default' : 'outline'}
                          size="sm"
                          className={`w-full text-xs h-8 ${
                            !slot.is_available ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            isReserved ? 'bg-green-600 hover:bg-green-700' : ''
                          }`}
                          disabled={!slot.is_available || isPastDate || loading}
                          onClick={() => {
                            if (slot.is_available && !isPastDate) {
                              reserveSlot(
                                dateStr,
                                slot.start_time,
                                slot.end_time,
                                slot.price,
                                slot.duration
                              );
                            }
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(slot.start_time)}
                            </div>
                            <div className="text-xs opacity-75">
                              ${slot.price} • {slot.duration}min
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    {isPastDate ? 'Past date' : 'No slots available'}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {format(new Date(selectedSlot.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                    {' • '}{selectedSlot.duration} minutes • ${selectedSlot.price}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelReservation();
                }}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}