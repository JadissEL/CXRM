import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Star,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

export default function BarberAnalytics({ bookings, services, reviews }) {
  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));
    const lastMonthEnd = endOfMonth(subDays(monthStart, 1));

    // This month bookings
    const thisMonthBookings = bookings.filter(b => {
      const date = parseISO(b.booking_date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    // Last month bookings
    const lastMonthBookings = bookings.filter(b => {
      const date = parseISO(b.booking_date);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });

    // Revenue calculations
    const thisMonthRevenue = thisMonthBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const lastMonthRevenue = lastMonthBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 100;

    // Booking counts
    const thisMonthCount = thisMonthBookings.filter(b => b.status === 'completed').length;
    const lastMonthCount = lastMonthBookings.filter(b => b.status === 'completed').length;
    const bookingChange = lastMonthCount > 0 
      ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
      : 100;

    // Daily revenue for chart (last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now
    });

    const dailyRevenue = last30Days.map(day => {
      const dayBookings = bookings.filter(b => 
        b.booking_date === format(day, 'yyyy-MM-dd') && b.status === 'completed'
      );
      return {
        date: format(day, 'dd/MM'),
        revenue: dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        bookings: dayBookings.length
      };
    });

    // Service popularity
    const servicePopularity = services.map(service => {
      const count = bookings.filter(b => b.service_id === service.id).length;
      const revenue = bookings
        .filter(b => b.service_id === service.id && b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0);
      return {
        name: service.name,
        count,
        revenue
      };
    }).sort((a, b) => b.count - a.count);

    // Booking status distribution
    const statusDistribution = [
      { name: 'Terminés', value: bookings.filter(b => b.status === 'completed').length, color: '#10B981' },
      { name: 'Confirmés', value: bookings.filter(b => b.status === 'confirmed').length, color: '#3B82F6' },
      { name: 'En attente', value: bookings.filter(b => b.status === 'pending').length, color: '#F59E0B' },
      { name: 'Annulés', value: bookings.filter(b => b.status === 'cancelled').length, color: '#EF4444' },
      { name: 'Absents', value: bookings.filter(b => b.status === 'no_show').length, color: '#6B7280' }
    ].filter(s => s.value > 0);

    // Time slot popularity
    const timeSlotPopularity = {};
    bookings.forEach(b => {
      const hour = b.booking_time.split(':')[0];
      timeSlotPopularity[hour] = (timeSlotPopularity[hour] || 0) + 1;
    });
    const timeSlots = Object.entries(timeSlotPopularity)
      .map(([hour, count]) => ({ hour: `${hour}h`, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Average rating
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 5.0;

    // Completion rate
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalBookings = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status)).length;
    const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(0) : 100;

    return {
      thisMonthRevenue,
      lastMonthRevenue,
      revenueChange,
      thisMonthCount,
      lastMonthCount,
      bookingChange,
      dailyRevenue,
      servicePopularity,
      statusDistribution,
      timeSlots,
      avgRating,
      completionRate,
      totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0),
      totalClients: new Set(bookings.map(b => b.client_id)).size
    };
  }, [bookings, services, reviews]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#1E7A4B] rounded-[10px] flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className={analytics.revenueChange >= 0 ? 'bg-[#1E7A4B]/20 text-[#1E7A4B]' : 'bg-[#D6454A]/20 text-[#D6454A]'}>
                {analytics.revenueChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(analytics.revenueChange)}%
              </Badge>
            </div>
            <p className="text-sm text-[#4B5563]">Revenus ce mois</p>
            <p className="text-3xl font-bold text-[#0B2545]">{analytics.thisMonthRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#0B2545] rounded-[10px] flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <Badge className={analytics.bookingChange >= 0 ? 'bg-[#1E7A4B]/20 text-[#1E7A4B]' : 'bg-[#D6454A]/20 text-[#D6454A]'}>
                {analytics.bookingChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(analytics.bookingChange)}%
              </Badge>
            </div>
            <p className="text-sm text-[#4B5563]">Réservations ce mois</p>
            <p className="text-3xl font-bold text-[#0B2545]">{analytics.thisMonthCount}</p>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#D08B3D] rounded-[10px] flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-[#4B5563]">Clients uniques</p>
            <p className="text-3xl font-bold text-[#0B2545]">{analytics.totalClients}</p>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#D08B3D] rounded-[10px] flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-[#D08B3D]/20 text-[#D08B3D]">
                {reviews.length} avis
              </Badge>
            </div>
            <p className="text-sm text-[#4B5563]">Note moyenne</p>
            <p className="text-3xl font-bold text-[#0B2545]">{analytics.avgRating}/5</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenus des 30 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value}€`, 'Revenus']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Répartition des Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Réservations']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Services les plus populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.servicePopularity.slice(0, 5).map((service, index) => (
                <div key={service.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{service.count} réservations</span>
                      <span>{service.revenue}€ générés</span>
                    </div>
                  </div>
                  <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                      style={{ 
                        width: `${analytics.servicePopularity[0]?.count ? (service.count / analytics.servicePopularity[0].count) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
              {analytics.servicePopularity.length === 0 && (
                <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots Popularity */}
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Créneaux horaires populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timeSlots} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [value, 'Réservations']} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[12px] border-2 border-slate-200 bg-[#1E7A4B]/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[#4B5563] mb-1">Revenus Totaux</p>
            <p className="text-2xl font-bold text-[#0B2545]">{analytics.totalRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-slate-200 bg-[#0B2545]/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[#4B5563] mb-1">Taux de Complétion</p>
            <p className="text-2xl font-bold text-[#0B2545]">{analytics.completionRate}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-slate-200 bg-[#D08B3D]/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[#4B5563] mb-1">Total Avis</p>
            <p className="text-2xl font-bold text-[#0B2545]">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-slate-200 bg-[#D08B3D]/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[#4B5563] mb-1">Total Services</p>
            <p className="text-2xl font-bold text-[#0B2545]">{services.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}