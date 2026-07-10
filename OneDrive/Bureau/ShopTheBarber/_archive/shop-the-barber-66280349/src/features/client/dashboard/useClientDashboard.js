import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useClientDashboard() {
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
        queryKey: ['my-bookings', user?.id],
        queryFn: () => base44.entities.Booking.filter({ client_id: user.id }, '-created_date'),
        enabled: !!user
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['my-orders', user?.id],
        queryFn: () => base44.entities.Order.filter({ client_id: user.id }, '-created_date'),
        enabled: !!user
    });

    const upcomingBookings = useMemo(() =>
        bookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
        [bookings]
    );

    const pastBookings = useMemo(() =>
        bookings.filter(b => b.status === 'completed' || b.status === 'cancelled'),
        [bookings]
    );

    const stats = useMemo(() => ({
        upcomingCount: upcomingBookings.length,
        ordersCount: orders.length,
        completedVisits: bookings.filter(b => b.status === 'completed').length,
        totalSpent: bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
    }), [upcomingBookings, orders, bookings]);

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500",
        confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    };

    const statusLabels = {
        pending: "En attente",
        confirmed: "Confirmé",
        completed: "Terminé",
        cancelled: "Annulé",
        processing: "En cours",
        shipped: "Expédié",
        delivered: "Livré"
    };

    return {
        user,
        bookings,
        orders,
        upcomingBookings,
        pastBookings,
        stats,
        statusColors,
        statusLabels,
        isLoading: bookingsLoading || ordersLoading,
        error: null
    };
}
