'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { format, addMinutes, isSameDay, isToday, isPast } from 'date-fns';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: number;
  duration: number;
  is_reserved?: boolean;
  reserved_by?: string;
}

interface SelectedSlot {
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  duration: number;
}

interface SlotPickerProps {
  barberId: string;
  serviceIds: string[];
  selectedDate: Date;
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

export default function SlotPicker({
  barberId,
  serviceIds,
  selectedDate,
  onSlotSelect,
  selectedSlot,
  className = '',
}: SlotPickerProps) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservedSlot, setReservedSlot] = useState<ReservationData | null>(null);
  const [reservationTimer, setReservationTimer] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);


  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isPastDate = isPast(selectedDate) && !isToday(selectedDate);

  // Fetch available slots for the selected date
  const fetchSlots = useCallback(async (showRefreshing = false) => {
    if (!barberId || serviceIds.length === 0 || isPastDate) return;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/barbers/${barberId}/availability?` +
        new URLSearchParams({
          date: dateStr,
          service_ids: serviceIds.join(','),
        })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      setSlots(data.availability.slots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [barberId, serviceIds, dateStr, isPastDate]);

  // Reserve a time slot
  const reserveSlot = async (startTime: string, endTime: string, price: number, duration: number) => {
    if (!user?.id) {
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
          date: dateStr,
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
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        price,
        duration,
      });

      // Refresh slots to show updated availability
      fetchSlots(true);
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
        fetchSlots(true);
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    }
  };



  // Countdown timer for reservation
  useEffect(() => {
    if (reservationTimer === null) return;

    if (reservationTimer <= 0) {
      setReservedSlot(null);
      setReservationTimer(null);
      onSlotSelect(null);
      fetchSlots(true);
      return;
    }

    const interval = setInterval(() => {
      setReservationTimer(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationTimer, onSlotSelect, fetchSlots]);

  // Fetch slots when dependencies change
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  };

  const formatReservationTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isSlotSelected = (startTime: string) => {
    return selectedSlot?.date === dateStr && selectedSlot?.start_time === startTime;
  };

  const isSlotReserved = (startTime: string) => {
    return reservedSlot?.slot_date === dateStr && reservedSlot?.start_time === startTime;
  };

  // Group slots by time periods
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  if (isPastDate) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cannot book appointments for past dates.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-sm text-gray-600">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSlots(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Reservation Timer */}
      {reservedSlot && reservationTimer !== null && (
        <Alert>
                          <CheckCircle className="h-4 w-4" />
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slots Display */}
      {!loading && (
        <div className="space-y-6">
          {/* Morning Slots */}
          {morning.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Morning (6:00 AM - 12:00 PM)
                  <Badge variant="secondary">{morning.length} slots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {morning.map((slot, index) => {
                    const isSelected = isSlotSelected(slot.start_time);
                    const isReserved = isSlotReserved(slot.start_time);
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected || isReserved ? 'default' : 'outline'}
                        className={`h-auto p-3 ${
                          !slot.is_available ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isReserved ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                        disabled={!slot.is_available || loading}
                        onClick={() => {
                          if (slot.is_available) {
                            reserveSlot(
                              slot.start_time,
                              slot.end_time,
                              slot.price,
                              slot.duration
                            );
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="font-medium">
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
              </CardContent>
            </Card>
          )}

          {/* Afternoon Slots */}
          {afternoon.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Afternoon (12:00 PM - 5:00 PM)
                  <Badge variant="secondary">{afternoon.length} slots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {afternoon.map((slot, index) => {
                    const isSelected = isSlotSelected(slot.start_time);
                    const isReserved = isSlotReserved(slot.start_time);
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected || isReserved ? 'default' : 'outline'}
                        className={`h-auto p-3 ${
                          !slot.is_available ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isReserved ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                        disabled={!slot.is_available || loading}
                        onClick={() => {
                          if (slot.is_available) {
                            reserveSlot(
                              slot.start_time,
                              slot.end_time,
                              slot.price,
                              slot.duration
                            );
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="font-medium">
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
              </CardContent>
            </Card>
          )}

          {/* Evening Slots */}
          {evening.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Evening (5:00 PM - 10:00 PM)
                  <Badge variant="secondary">{evening.length} slots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {evening.map((slot, index) => {
                    const isSelected = isSlotSelected(slot.start_time);
                    const isReserved = isSlotReserved(slot.start_time);
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected || isReserved ? 'default' : 'outline'}
                        className={`h-auto p-3 ${
                          !slot.is_available ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isReserved ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                        disabled={!slot.is_available || loading}
                        onClick={() => {
                          if (slot.is_available) {
                            reserveSlot(
                              slot.start_time,
                              slot.end_time,
                              slot.price,
                              slot.duration
                            );
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="font-medium">
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
              </CardContent>
            </Card>
          )}

          {/* No Slots Available */}
          {slots.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No slots available</p>
                  <p className="text-sm">
                    There are no available time slots for this date. Please try a different date.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}