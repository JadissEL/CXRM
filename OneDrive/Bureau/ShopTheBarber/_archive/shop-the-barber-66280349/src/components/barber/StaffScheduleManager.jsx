import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Loader2, Copy } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusColors = {
  scheduled: 'bg-[#0B2545]/10 text-[#0B2545]',
  working: 'bg-[#1E7A4B]/10 text-[#1E7A4B]',
  completed: 'bg-[#4B5563]/10 text-[#4B5563]',
  absent: 'bg-[#D6454A]/10 text-[#D6454A]',
  vacation: 'bg-[#D08B3D]/10 text-[#D08B3D]'
};

export default function StaffScheduleManager({ barberId, staff = [], users = [] }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState({ start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', status: 'scheduled', notes: '' });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: schedules = [] } = useQuery({
    queryKey: ['staff-schedules', barberId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.StaffSchedule.filter({ salon_id: barberId }),
    enabled: !!barberId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffSchedule.create({ ...data, salon_id: barberId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff-schedules'] }); setIsDialogOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffSchedule.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-schedules'] })
  });

  const copyWeekMutation = useMutation({
    mutationFn: async () => {
      const currentWeekSchedules = schedules.filter(s => weekDays.some(d => s.date === format(d, 'yyyy-MM-dd')));
      const nextWeekStart = addDays(weekStart, 7);
      for (const schedule of currentWeekSchedules) {
        const dayOffset = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === schedule.date);
        if (dayOffset >= 0) {
          const newDate = format(addDays(nextWeekStart, dayOffset), 'yyyy-MM-dd');
          await base44.entities.StaffSchedule.create({
            ...schedule, id: undefined, date: newDate, status: 'scheduled'
          });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff-schedules'] }); setSelectedDate(addDays(selectedDate, 7)); }
  });

  const getScheduleForStaffAndDay = (staffId, date) => {
    return schedules.find(s => s.staff_id === staffId && s.date === format(date, 'yyyy-MM-dd'));
  };

  const getUserForStaff = (staffMember) => users.find(u => u.id === staffMember.user_id);

  const openScheduleDialog = (staffMember, date) => {
    setSelectedStaff({ member: staffMember, date });
    const existing = getScheduleForStaffAndDay(staffMember.id, date);
    if (existing) {
      setForm({ start_time: existing.start_time || '09:00', end_time: existing.end_time || '19:00', break_start: existing.break_start || '12:00', break_end: existing.break_end || '13:00', status: existing.status, notes: existing.notes || '' });
    } else {
      setForm({ start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', status: 'scheduled', notes: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existing = getScheduleForStaffAndDay(selectedStaff.member.id, selectedStaff.date);
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: form });
    } else {
      createMutation.mutate({ staff_id: selectedStaff.member.id, date: format(selectedStaff.date, 'yyyy-MM-dd'), ...form });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}><ChevronLeft className="w-4 h-4" /></Button>
          <h3 className="text-lg font-semibold">{format(weekStart, 'd MMM', { locale: fr })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}</h3>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>Aujourd'hui</Button>
          <Button onClick={() => copyWeekMutation.mutate()} disabled={copyWeekMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
            {copyWeekMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
            Copier vers semaine suivante
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <Card className="rounded-[12px] border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-left font-medium text-slate-600 w-48">Membre</th>
                {weekDays.map((day, i) => (
                  <th key={i} className={`p-3 text-center font-medium ${isSameDay(day, new Date()) ? 'bg-[#D08B3D]/10 text-[#D08B3D]' : 'text-[#4B5563]'}`}>
                    <div>{format(day, 'EEE', { locale: fr })}</div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.filter(s => s.is_active).map((member) => {
                const user = getUserForStaff(member);
                return (
                  <tr key={member.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profile_image} />
                          <AvatarFallback className="bg-[#0B2545] text-white text-xs">{user?.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user?.full_name || 'Membre'}</p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day, i) => {
                      const schedule = getScheduleForStaffAndDay(member.id, day);
                      return (
                        <td key={i} className={`p-2 text-center ${isSameDay(day, new Date()) ? 'bg-[#D08B3D]/5' : ''}`}>
                          <button onClick={() => openScheduleDialog(member, day)} className="w-full p-2 rounded-[10px] border-2 border-dashed border-slate-200 hover:border-[#D08B3D] hover:bg-[#D08B3D]/5 transition-colors min-h-[60px]">
                            {schedule ? (
                              <div className="space-y-1">
                                <Badge className={`${statusColors[schedule.status]} text-xs`}>{schedule.status === 'scheduled' ? `${schedule.start_time}-${schedule.end_time}` : schedule.status}</Badge>
                              </div>
                            ) : (
                              <Plus className="w-4 h-4 mx-auto text-slate-400" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier - {selectedStaff && format(selectedStaff.date, 'EEEE d MMMM', { locale: fr })}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="vacation">Vacances</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === 'scheduled' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Début</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} /></div>
                  <div><Label>Fin</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({...form, end_time: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Pause début</Label><Input type="time" value={form.break_start} onChange={(e) => setForm({...form, break_start: e.target.value})} /></div>
                  <div><Label>Pause fin</Label><Input type="time" value={form.break_end} onChange={(e) => setForm({...form, break_end: e.target.value})} /></div>
                </div>
              </>
            )}
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}