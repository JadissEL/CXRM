import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function BookingCalendar({ barberId, bookings, services }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setSelectedBooking(null);
    }
  });

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Service';
  };

  const getBookingsForDate = (date) => {
    return bookings.filter(b => 
      b.booking_date === format(date, 'yyyy-MM-dd')
    ).sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-[#0B2545]';
      case 'pending': return 'bg-[#D08B3D]';
      case 'completed': return 'bg-[#1E7A4B]';
      case 'cancelled': return 'bg-[#D6454A]';
      case 'no_show': return 'bg-[#4B5563]';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'no_show': return 'Absent';
      default: return status;
    }
  };

  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const weekDays = [];
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const handleStatusChange = (bookingId, newStatus) => {
    updateBookingMutation.mutate({
      id: bookingId,
      data: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold text-slate-900">
            {format(weekStart, 'dd MMM', { locale: fr })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: fr })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Aujourd'hui
          </Button>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {[
          { status: 'pending', label: 'En attente' },
          { status: 'confirmed', label: 'Confirmé' },
          { status: 'completed', label: 'Terminé' },
          { status: 'cancelled', label: 'Annulé' }
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
            <span className="text-sm text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card className="rounded-[12px] border-2 border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days Header */}
              <div className="grid grid-cols-8 border-b border-slate-200">
                <div className="p-4 bg-slate-50 border-r border-slate-200">
                  <span className="text-sm font-medium text-slate-500">Heure</span>
                </div>
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={`p-4 text-center border-r border-slate-200 ${
                      isSameDay(day, new Date()) ? 'bg-blue-50' : 'bg-slate-50'
                    }`}
                  >
                    <p className="text-sm text-slate-500">
                      {format(day, 'EEE', { locale: fr })}
                    </p>
                    <p className={`text-lg font-bold ${
                      isSameDay(day, new Date()) ? 'text-blue-600' : 'text-slate-900'
                    }`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="max-h-[600px] overflow-y-auto">
                {timeSlots.map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 border-b border-slate-100">
                    <div className="p-2 text-sm text-slate-500 border-r border-slate-200 bg-slate-50">
                      {time}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const dayBookings = getBookingsForDate(day).filter(
                        b => b.booking_time === time
                      );
                      return (
                        <div
                          key={dayIndex}
                          className={`p-1 border-r border-slate-100 min-h-[50px] ${
                            isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {dayBookings.map((booking) => (
                            <motion.button
                              key={booking.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => setSelectedBooking(booking)}
                              className={`w-full p-2 rounded-lg text-left text-xs text-white ${getStatusColor(booking.status)} hover:opacity-90 transition-opacity`}
                            >
                              <p className="font-semibold truncate">
                                {getServiceName(booking.service_id)}
                              </p>
                              <p className="opacity-80">{booking.total_price}€</p>
                            </motion.button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={fr}
              className="rounded-md"
              modifiers={{
                hasBookings: bookings.map(b => parseISO(b.booking_date))
              }}
              modifiersClassNames={{
                hasBookings: 'bg-blue-100 font-bold'
              }}
            />
            
            {/* Bookings for selected date */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </h3>
              <div className="space-y-2">
                {getBookingsForDate(selectedDate).length === 0 ? (
                  <p className="text-slate-500 text-sm">Aucun rendez-vous</p>
                ) : (
                  getBookingsForDate(selectedDate).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${getStatusColor(booking.status)}`} />
                        <div className="text-left">
                          <p className="font-medium text-slate-900">
                            {booking.booking_time} - {getServiceName(booking.service_id)}
                          </p>
                          <p className="text-sm text-slate-600">{booking.total_price}€</p>
                        </div>
                      </div>
                      <Badge variant="outline">{getStatusLabel(booking.status)}</Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeSlots.map((time) => {
                const slotBookings = getBookingsForDate(selectedDate).filter(
                  b => b.booking_time === time
                );
                return (
                  <div key={time} className="flex gap-4 py-2 border-b border-slate-100">
                    <div className="w-16 text-sm text-slate-500 font-medium">
                      {time}
                    </div>
                    <div className="flex-1">
                      {slotBookings.length === 0 ? (
                        <div className="h-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200" />
                      ) : (
                        slotBookings.map((booking) => (
                          <button
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`w-full p-3 rounded-lg text-white text-left ${getStatusColor(booking.status)}`}
                          >
                            <p className="font-semibold">{getServiceName(booking.service_id)}</p>
                            <p className="text-sm opacity-80">{booking.total_price}€</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du Rendez-vous</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${getStatusColor(selectedBooking.status)} text-white`}>
                    {getStatusLabel(selectedBooking.status)}
                  </Badge>
                  <span className="text-2xl font-bold text-slate-900">
                    {selectedBooking.total_price}€
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(parseISO(selectedBooking.booking_date), 'EEEE d MMMM yyyy', { locale: fr })} à {selectedBooking.booking_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <span>Client ID: {selectedBooking.client_id}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Service</p>
                <p className="text-slate-900 font-semibold">
                  {getServiceName(selectedBooking.service_id)}
                </p>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Notes du client</p>
                  <p className="text-slate-600">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={updateBookingMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={updateBookingMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refuser
                    </Button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={updateBookingMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedBooking.id, 'no_show')}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      disabled={updateBookingMutation.isPending}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Client Absent
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}