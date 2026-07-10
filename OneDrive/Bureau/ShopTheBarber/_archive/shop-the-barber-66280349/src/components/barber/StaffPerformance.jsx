import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, Award, Target } from 'lucide-react';
import { subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const COLORS = ['#0B2545', '#D08B3D', '#1E7A4B', '#4B5563', '#D6454A', '#0B2545'];

export default function StaffPerformance({ barberId, staff = [], users = [], bookings = [], services = [] }) {
  const [period, setPeriod] = useState('month');
  const [selectedStaffId, setSelectedStaffId] = useState('all');

  const { data: commissions = [] } = useQuery({
    queryKey: ['staff-commissions', barberId],
    queryFn: () => base44.entities.StaffCommission.filter({ salon_id: barberId }),
    enabled: !!barberId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['barber-reviews', barberId],
    queryFn: () => base44.entities.Review.filter({ target_id: barberId, target_type: 'barber' }),
    enabled: !!barberId
  });

  const getDateRange = () => {
    const now = new Date();
    if (period === 'week') return { start: subDays(now, 7), end: now };
    if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
    return { start: subMonths(now, 3), end: now };
  };

  const { start, end } = getDateRange();

  const filteredBookings = bookings.filter(b => {
    const date = parseISO(b.booking_date);
    return isWithinInterval(date, { start, end }) && b.status === 'completed';
  });

  const getUserForStaff = (staffMember) => users.find(u => u.id === staffMember.user_id);
  const getServiceName = (id) => services.find(s => s.id === id)?.name || 'Service';

  // Calculate performance for each staff member
  const staffPerformance = staff.filter(s => s.is_active).map(member => {
    const user = getUserForStaff(member);
    const memberBookings = filteredBookings.filter(b => b.created_by === user?.email);
    const memberCommissions = commissions.filter(c => c.staff_id === member.id);
    
    const totalRevenue = memberBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const totalCommission = memberCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const avgBookingValue = memberBookings.length > 0 ? totalRevenue / memberBookings.length : 0;
    
    // Service breakdown
    const serviceBreakdown = {};
    memberBookings.forEach(b => {
      const serviceName = getServiceName(b.service_id);
      serviceBreakdown[serviceName] = (serviceBreakdown[serviceName] || 0) + 1;
    });

    return {
      id: member.id,
      user,
      member,
      bookingsCount: memberBookings.length,
      totalRevenue,
      totalCommission,
      avgBookingValue,
      commissionRate: member.commission_rate || 0,
      serviceBreakdown: Object.entries(serviceBreakdown).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = staffPerformance.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalBookings = staffPerformance.reduce((sum, p) => sum + p.bookingsCount, 0);
  const totalCommissions = staffPerformance.reduce((sum, p) => sum + p.totalCommission, 0);

  // Chart data
  const revenueByStaff = staffPerformance.map(p => ({
    name: p.user?.full_name?.split(' ')[0] || 'Staff',
    revenue: p.totalRevenue,
    bookings: p.bookingsCount
  }));

  const selectedPerformance = selectedStaffId !== 'all' ? staffPerformance.find(p => p.id === selectedStaffId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Performance de l'Équipe</h2>
          <p className="text-[#4B5563]">Analysez les performances individuelles</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les membres</SelectItem>
              {staff.filter(s => s.is_active).map(s => {
                const u = getUserForStaff(s);
                return <SelectItem key={s.id} value={s.id}>{u?.full_name || 'Membre'}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-[12px] border-2 border-[#0B2545]/20 bg-[#0B2545]/5">
          <CardContent className="p-4">
            <DollarSign className="w-8 h-8 text-[#0B2545] mb-2" />
            <p className="text-2xl font-bold text-[#0B2545]">{totalRevenue.toFixed(0)}€</p>
            <p className="text-sm text-[#4B5563]">Chiffre d'affaires</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-[#1E7A4B]/20 bg-[#1E7A4B]/5">
          <CardContent className="p-4">
            <Calendar className="w-8 h-8 text-[#1E7A4B] mb-2" />
            <p className="text-2xl font-bold text-[#1E7A4B]">{totalBookings}</p>
            <p className="text-sm text-[#4B5563]">Prestations</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-[#D08B3D]/20 bg-[#D08B3D]/5">
          <CardContent className="p-4">
            <Award className="w-8 h-8 text-[#D08B3D] mb-2" />
            <p className="text-2xl font-bold text-[#D08B3D]">{totalCommissions.toFixed(0)}€</p>
            <p className="text-sm text-[#4B5563]">Commissions</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-[#D08B3D]/20 bg-[#D08B3D]/5">
          <CardContent className="p-4">
            <Target className="w-8 h-8 text-[#D08B3D] mb-2" />
            <p className="text-2xl font-bold text-[#D08B3D]">{totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(0) : 0}€</p>
            <p className="text-sm text-[#4B5563]">Panier moyen</p>
          </CardContent>
        </Card>
      </div>

      {selectedStaffId === 'all' ? (
        <>
          {/* Team Comparison */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="rounded-[12px] border-2 border-slate-200">
              <CardHeader><CardTitle>Chiffre d'Affaires par Membre</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByStaff}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}€`, 'Revenu']} />
                    <Bar dataKey="revenue" fill="#0B2545" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[12px] border-2 border-slate-200">
              <CardHeader><CardTitle>Nombre de Prestations</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByStaff}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#D08B3D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card className="rounded-[12px] border-2 border-slate-200">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" />Classement</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffPerformance.map((perf, index) => (
                  <motion.div key={perf.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`p-4 rounded-[10px] border-2 flex items-center justify-between ${index === 0 ? 'border-[#D08B3D] bg-[#D08B3D]/5' : index === 1 ? 'border-slate-300 bg-slate-50' : index === 2 ? 'border-[#D08B3D]/50 bg-[#D08B3D]/5' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-[#D08B3D] text-white' : index === 1 ? 'bg-[#4B5563] text-white' : index === 2 ? 'bg-[#D08B3D]/70 text-white' : 'bg-slate-200'}`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={perf.user?.profile_image} />
                        <AvatarFallback className="bg-[#0B2545] text-white">{perf.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[#0B2545]">{perf.user?.full_name || 'Membre'}</p>
                        <p className="text-sm text-[#4B5563]">{perf.bookingsCount} prestations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#0B2545]">{perf.totalRevenue.toFixed(0)}€</p>
                      <p className="text-sm text-[#1E7A4B]">+{perf.totalCommission.toFixed(0)}€ commission</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : selectedPerformance && (
        /* Individual Performance */
        <div className="space-y-6">
          <Card className="rounded-[12px] border-2 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedPerformance.user?.profile_image} />
                  <AvatarFallback className="bg-[#0B2545] text-white text-xl">{selectedPerformance.user?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedPerformance.user?.full_name}</h3>
                  <Badge>{selectedPerformance.member.role}</Badge>
                  <p className="text-sm text-slate-500 mt-1">Commission: {selectedPerformance.commissionRate}%</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#F7F8FA] rounded-[10px] p-4 text-center">
                  <p className="text-2xl font-bold text-[#0B2545]">{selectedPerformance.totalRevenue.toFixed(0)}€</p>
                  <p className="text-sm text-[#4B5563]">Chiffre d'affaires</p>
                </div>
                <div className="bg-[#F7F8FA] rounded-[10px] p-4 text-center">
                  <p className="text-2xl font-bold text-[#1E7A4B]">{selectedPerformance.bookingsCount}</p>
                  <p className="text-sm text-[#4B5563]">Prestations</p>
                </div>
                <div className="bg-[#F7F8FA] rounded-[10px] p-4 text-center">
                  <p className="text-2xl font-bold text-[#D08B3D]">{selectedPerformance.totalCommission.toFixed(0)}€</p>
                  <p className="text-sm text-[#4B5563]">Commissions</p>
                </div>
                <div className="bg-[#F7F8FA] rounded-[10px] p-4 text-center">
                  <p className="text-2xl font-bold text-[#D08B3D]">{selectedPerformance.avgBookingValue.toFixed(0)}€</p>
                  <p className="text-sm text-[#4B5563]">Panier moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedPerformance.serviceBreakdown.length > 0 && (
            <Card className="rounded-[12px] border-2 border-slate-200">
              <CardHeader><CardTitle>Services les plus réalisés</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedPerformance.serviceBreakdown.slice(0, 5).map((service, i) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-[10px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <Badge variant="outline">{service.count} fois</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}