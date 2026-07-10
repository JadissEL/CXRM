import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Timer, CreditCard, ChevronLeft } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const barberId = searchParams.get('barberId');
  const preSelectedServiceId = searchParams.get('serviceId');

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState(preSelectedServiceId ? [preSelectedServiceId] : []);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [holdCountdown, setHoldCountdown] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: barber } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => base44.entities.BarberProfile.list().then(list =>
      list.find(b => b.id === barberId)
    ),
    enabled: !!barberId
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', barberId],
    queryFn: () => base44.entities.Service.filter({ barber_id: barberId, is_active: true }),
    enabled: !!barberId
  });

  const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id));
  const totalPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration, 0);

  // Start 5-minute hold countdown when time is selected
  useEffect(() => {
    if (selectedTime && selectedDate) {
      setHoldCountdown(300); // 5 minutes in seconds
      const interval = setInterval(() => {
        setHoldCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setSelectedTime("");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedTime, selectedDate]);

  const availableTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30"
  ];

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      return await base44.entities.Booking.create(bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("ClientDashboard"));
      }, 2000);
    },
    onError: (error) => {
      setError("Erreur lors de la réservation. Veuillez réessayer.");
    }
  });

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      setError("Veuillez remplir tous les champs requis");
      return;
    }

    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    const bookingData = {
      client_id: user.id,
      barber_id: barberId,
      service_id: selectedServices[0], // Primary service
      booking_date: format(selectedDate, 'yyyy-MM-dd'),
      booking_time: selectedTime,
      total_price: totalPrice,
      status: "pending",
      payment_status: "pending",
      notes: notes
    };

    createBookingMutation.mutate(bookingData);
  };

  if (!barberId) {
    return (
      <div className="min-h-screen py-20 text-center bg-background-light dark:bg-background-dark">
        <h2 className="text-2xl font-bold text-charcoal dark:text-white">Barbier non spécifié</h2>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="max-w-md w-full rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Réservation Confirmée !</h2>
              <p className="text-slate dark:text-matte-silver mb-4">
                Votre rendez-vous a été enregistré avec succès.
              </p>
              <p className="text-sm text-slate/70 dark:text-matte-silver/70">
                Redirection vers votre tableau de bord...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const categoryIcons = {
    haircut: "✂️", beard: "🧔", shave: "🪒", styling: "💇", treatment: "💆", package: "📦"
  };

  return (
    <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-slate hover:text-charcoal dark:text-matte-silver dark:hover:text-white pl-0"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white mb-2">
            Réserver un Rendez-vous
          </h1>
          <p className="text-slate dark:text-matte-silver text-lg">
            chez <span className="font-semibold text-primary">{barber?.shop_name}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Service Selection (Multi-select) */}
            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-charcoal dark:text-white">
                  <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Choisissez vos services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {services.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <motion.button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceToggle(service.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-soft-gray dark:border-slate/20 hover:border-primary/50'
                          }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl p-2 bg-background-light dark:bg-background-dark rounded-lg">
                              {categoryIcons[service.category] || "✨"}
                            </span>
                            <div>
                              <p className="font-bold text-charcoal dark:text-white text-lg">{service.name}</p>
                              <p className="text-sm text-slate dark:text-matte-silver font-medium">{service.duration} min</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-primary">{service.price}€</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                              }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Date Selection */}
            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-charcoal dark:text-white">
                  <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Choisissez une date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    locale={fr}
                    className="rounded-xl border border-soft-gray dark:border-slate/20 p-4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Time Selection */}
            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-charcoal dark:text-white">
                  <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Choisissez une heure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${selectedTime === time
                          ? 'bg-primary text-white shadow-md transform scale-105'
                          : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {holdCountdown && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-3 border border-amber-100 dark:border-amber-800/30">
                    <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Créneau maintenu pendant {Math.floor(holdCountdown / 60)}:{(holdCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
              <CardHeader>
                <CardTitle className="text-charcoal dark:text-white">Notes (optionnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Demandes spéciales, préférences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-xl border-soft-gray dark:border-slate/20 bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div>
            <Card className="sticky top-24 rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark overflow-hidden">
              <div className="bg-charcoal p-6 text-white">
                <h3 className="text-xl font-display font-bold">Récapitulatif</h3>
                <p className="text-white/70 text-sm mt-1">Vérifiez les détails de votre réservation</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-slate dark:text-matte-silver font-medium mb-1">Barbier</p>
                  <p className="font-bold text-charcoal dark:text-white text-lg">{barber?.shop_name}</p>
                </div>

                {selectedServiceObjects.length > 0 && (
                  <div>
                    <p className="text-sm text-slate dark:text-matte-silver font-medium mb-3">Services ({selectedServiceObjects.length})</p>
                    <div className="space-y-3">
                      {selectedServiceObjects.map(s => (
                        <div key={s.id} className="flex justify-between items-center text-sm p-3 rounded-lg bg-background-light dark:bg-background-dark">
                          <span className="text-charcoal dark:text-white font-medium">{s.name}</span>
                          <span className="font-bold text-primary">{s.price}€</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate dark:text-matte-silver font-medium">
                      <Clock className="w-4 h-4" />
                      <span>Durée totale: {totalDuration} min</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedDate && (
                    <div className="p-3 rounded-lg bg-background-light dark:bg-background-dark">
                      <p className="text-xs text-slate dark:text-matte-silver mb-1">Date</p>
                      <p className="font-bold text-charcoal dark:text-white text-sm">
                        {format(selectedDate, 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}

                  {selectedTime && (
                    <div className="p-3 rounded-lg bg-background-light dark:bg-background-dark">
                      <p className="text-xs text-slate dark:text-matte-silver mb-1">Heure</p>
                      <p className="font-bold text-charcoal dark:text-white text-sm">{selectedTime}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-soft-gray dark:border-slate/10 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-charcoal dark:text-white text-lg">Total à payer</span>
                    <span className="text-3xl font-display font-bold text-primary">
                      {totalPrice}€
                    </span>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-14 text-lg shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                    disabled={createBookingMutation.isPending || selectedServices.length === 0 || !selectedDate || !selectedTime}
                  >
                    {createBookingMutation.isPending ? (
                      "Réservation..."
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Confirmer
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate dark:text-matte-silver mt-4">
                    Paiement sur place accepté
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
