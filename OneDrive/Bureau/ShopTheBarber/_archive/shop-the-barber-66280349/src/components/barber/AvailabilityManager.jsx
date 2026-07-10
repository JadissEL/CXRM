import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarOff,
  Trash2,
  Save,
  Loader2,
  CalendarRange,
  Repeat,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const daysOfWeek = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

export default function AvailabilityManager({ barberId }) {
  const queryClient = useQueryClient();
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isRangeBlockDialogOpen, setIsRangeBlockDialogOpen] = useState(false);
  const [selectedBlockDate, setSelectedBlockDate] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [blockForm, setBlockForm] = useState({
    is_full_day: true,
    start_time: '09:00',
    end_time: '18:00',
    reason: ''
  });
  const [rangeBlockForm, setRangeBlockForm] = useState({
    start_date: null,
    end_date: null,
    reason: ''
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['barber-availability', barberId],
    queryFn: () => base44.entities.BarberAvailability.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['barber-blocked-times', barberId],
    queryFn: () => base44.entities.BarberBlockedTime.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const [schedule, setSchedule] = useState({});

  // Initialize schedule from availability data
  useEffect(() => {
    const newSchedule = {};
    daysOfWeek.forEach(day => {
      const existing = availability.find(a => a.day_of_week === day.value);
      newSchedule[day.value] = existing || {
        is_working: day.value !== 0,
        start_time: '09:00',
        end_time: '19:00',
        break_start: '12:00',
        break_end: '13:00'
      };
    });
    setSchedule(newSchedule);
  }, [availability]);

  const saveMutation = useMutation({
    mutationFn: async (scheduleData) => {
      // Delete existing availability
      for (const avail of availability) {
        await base44.entities.BarberAvailability.delete(avail.id);
      }
      // Create new availability
      for (const [dayOfWeek, data] of Object.entries(scheduleData)) {
        await base44.entities.BarberAvailability.create({
          barber_id: barberId,
          day_of_week: parseInt(dayOfWeek),
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-availability'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  });

  const rangeBlockMutation = useMutation({
    mutationFn: async ({ startDate, endDate, reason }) => {
      const dates = eachDayOfInterval({ start: startDate, end: endDate });
      for (const date of dates) {
        await base44.entities.BarberBlockedTime.create({
          barber_id: barberId,
          date: format(date, 'yyyy-MM-dd'),
          is_full_day: true,
          reason: reason
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-blocked-times'] });
      setIsRangeBlockDialogOpen(false);
      setRangeBlockForm({ start_date: null, end_date: null, reason: '' });
    }
  });

  const blockMutation = useMutation({
    mutationFn: (data) => base44.entities.BarberBlockedTime.create({
      barber_id: barberId,
      date: format(selectedBlockDate, 'yyyy-MM-dd'),
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-blocked-times'] });
      setIsBlockDialogOpen(false);
      setSelectedBlockDate(null);
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.BarberBlockedTime.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-blocked-times'] });
    }
  });

  const handleScheduleChange = (dayValue, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = () => {
    saveMutation.mutate(schedule);
  };

  const handleBlockSubmit = (e) => {
    e.preventDefault();
    blockMutation.mutate(blockForm);
  };

  const blockedDates = blockedTimes.map(bt => parseISO(bt.date));

  // Group blocked times by reason for display
  const groupedBlockedTimes = blockedTimes.reduce((acc, bt) => {
    const key = bt.reason || 'Sans raison';
    if (!acc[key]) acc[key] = [];
    acc[key].push(bt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#1E7A4B]/10 border border-[#1E7A4B] rounded-[10px] p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-[#1E7A4B]" />
            <span className="text-[#1E7A4B] font-medium">Horaires enregistrés avec succès !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Schedule */}
      <Card className="rounded-[12px] border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[#D08B3D]" />
              <div>
                <span className="text-[#0B2545]">Horaires Récurrents</span>
                <p className="text-sm font-normal text-[#4B5563] mt-1">
                  Ces horaires se répètent automatiquement chaque semaine
                </p>
              </div>
            </div>
            <Button
              onClick={handleSaveSchedule}
              disabled={saveMutation.isPending}
              className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysOfWeek.map((day) => (
              <motion.div
                key={day.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  schedule[day.value]?.is_working 
                    ? 'border-slate-200 bg-white' 
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <Switch
                      checked={schedule[day.value]?.is_working || false}
                      onCheckedChange={(checked) => handleScheduleChange(day.value, 'is_working', checked)}
                    />
                    <span className={`font-medium ${schedule[day.value]?.is_working ? 'text-slate-900' : 'text-slate-400'}`}>
                      {day.label}
                    </span>
                  </div>

                  {schedule[day.value]?.is_working && (
                    <>
                      {/* Work Hours */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule[day.value]?.start_time || '09:00'}
                          onChange={(e) => handleScheduleChange(day.value, 'start_time', e.target.value)}
                          className="w-28"
                        />
                        <span className="text-slate-500">à</span>
                        <Input
                          type="time"
                          value={schedule[day.value]?.end_time || '19:00'}
                          onChange={(e) => handleScheduleChange(day.value, 'end_time', e.target.value)}
                          className="w-28"
                        />
                      </div>

                      {/* Break */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Pause:</span>
                        <Input
                          type="time"
                          value={schedule[day.value]?.break_start || '12:00'}
                          onChange={(e) => handleScheduleChange(day.value, 'break_start', e.target.value)}
                          className="w-24 h-8"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={schedule[day.value]?.break_end || '13:00'}
                          onChange={(e) => handleScheduleChange(day.value, 'break_end', e.target.value)}
                          className="w-24 h-8"
                        />
                      </div>
                    </>
                  )}

                  {!schedule[day.value]?.is_working && (
                    <Badge variant="outline" className="text-slate-500">Fermé</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Times Section */}
      <Card className="rounded-[12px] border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-[#D6454A]" />
              <div>
                <span className="text-[#0B2545]">Congés & Indisponibilités</span>
                <p className="text-sm font-normal text-[#4B5563] mt-1">
                  Bloquez des dates spécifiques ou des périodes entières
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsRangeBlockDialogOpen(true)}
              variant="outline"
              className="border-[#D6454A] text-[#D6454A] hover:bg-[#D6454A]/10 rounded-[10px] min-h-[44px]"
            >
              <CalendarRange className="w-4 h-4 mr-2" />
              Bloquer une Période
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar for single date blocking */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Sélectionnez une date</h4>
              <Calendar
                mode="single"
                selected={selectedBlockDate}
                onSelect={(date) => {
                  setSelectedBlockDate(date);
                  if (date) setIsBlockDialogOpen(true);
                }}
                locale={fr}
                disabled={(date) => isBefore(date, new Date())}
                modifiers={{
                  blocked: blockedDates
                }}
                modifiersClassNames={{
                  blocked: 'bg-red-100 text-red-700 line-through'
                }}
                className="rounded-md border"
              />
            </div>

            {/* Blocked dates list */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">
                Dates Bloquées ({blockedTimes.length})
              </h4>
              {blockedTimes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Aucune date bloquée</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Cliquez sur une date ou utilisez "Bloquer une Période"
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                  {Object.entries(groupedBlockedTimes).map(([reason, blocks]) => (
                    <div key={reason} className="space-y-2">
                      <div className="flex items-center gap-2 sticky top-0 bg-white py-1">
                        <Badge variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          ({blocks.length} jour{blocks.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      {blocks.sort((a, b) => new Date(a.date) - new Date(b.date)).map((block) => (
                        <motion.div
                          key={block.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {format(parseISO(block.date), 'EEEE d MMMM', { locale: fr })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {block.is_full_day ? 'Journée entière' : `${block.start_time} - ${block.end_time}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => deleteBlockMutation.mutate(block.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Single Date Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bloquer le {selectedBlockDate && format(selectedBlockDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <Label>Journée entière</Label>
              <Switch
                checked={blockForm.is_full_day}
                onCheckedChange={(checked) => setBlockForm({ ...blockForm, is_full_day: checked })}
              />
            </div>

            {!blockForm.is_full_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Début</Label>
                  <Input
                    type="time"
                    value={blockForm.start_time}
                    onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input
                    type="time"
                    value={blockForm.end_time}
                    onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Raison</Label>
              <Select
                value={blockForm.reason}
                onValueChange={(value) => setBlockForm({ ...blockForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Congés">🏖️ Congés</SelectItem>
                  <SelectItem value="Formation">📚 Formation</SelectItem>
                  <SelectItem value="RDV Personnel">👤 RDV Personnel</SelectItem>
                  <SelectItem value="Maladie">🏥 Maladie</SelectItem>
                  <SelectItem value="Jour Férié">🎉 Jour Férié</SelectItem>
                  <SelectItem value="Autre">📝 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={blockMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {blockMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Bloquer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block Date Range Dialog */}
      <Dialog open={isRangeBlockDialogOpen} onOpenChange={setIsRangeBlockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5" />
              Bloquer une Période
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (rangeBlockForm.start_date && rangeBlockForm.end_date) {
              rangeBlockMutation.mutate({
                startDate: rangeBlockForm.start_date,
                endDate: rangeBlockForm.end_date,
                reason: rangeBlockForm.reason
              });
            }
          }} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Toutes les dates de la période sélectionnée seront bloquées pour les réservations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de Début *</Label>
                <Input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={rangeBlockForm.start_date ? format(rangeBlockForm.start_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setRangeBlockForm({ 
                    ...rangeBlockForm, 
                    start_date: e.target.value ? new Date(e.target.value) : null 
                  })}
                  required
                />
              </div>
              <div>
                <Label>Date de Fin *</Label>
                <Input
                  type="date"
                  min={rangeBlockForm.start_date ? format(rangeBlockForm.start_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                  value={rangeBlockForm.end_date ? format(rangeBlockForm.end_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setRangeBlockForm({ 
                    ...rangeBlockForm, 
                    end_date: e.target.value ? new Date(e.target.value) : null 
                  })}
                  required
                />
              </div>
            </div>

            {rangeBlockForm.start_date && rangeBlockForm.end_date && (
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-900">
                    {Math.ceil((rangeBlockForm.end_date - rangeBlockForm.start_date) / (1000 * 60 * 60 * 24)) + 1}
                  </strong> jour(s) seront bloqués
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Du {format(rangeBlockForm.start_date, 'd MMMM', { locale: fr })} au {format(rangeBlockForm.end_date, 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            <div>
              <Label>Raison *</Label>
              <Select
                value={rangeBlockForm.reason}
                onValueChange={(value) => setRangeBlockForm({ ...rangeBlockForm, reason: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacances">🏖️ Vacances</SelectItem>
                  <SelectItem value="Congés">📅 Congés</SelectItem>
                  <SelectItem value="Formation">📚 Formation</SelectItem>
                  <SelectItem value="Fermeture Exceptionnelle">🚫 Fermeture Exceptionnelle</SelectItem>
                  <SelectItem value="Rénovation">🔧 Rénovation</SelectItem>
                  <SelectItem value="Autre">📝 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRangeBlockDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={rangeBlockMutation.isPending || !rangeBlockForm.start_date || !rangeBlockForm.end_date || !rangeBlockForm.reason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rangeBlockMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Bloquer la Période
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}