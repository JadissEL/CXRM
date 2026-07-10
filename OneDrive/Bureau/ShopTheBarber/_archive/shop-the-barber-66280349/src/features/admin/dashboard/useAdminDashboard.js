import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Scissors, DollarSign, Clock } from 'lucide-react';

export function useAdminDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('overview');

    // Data fetching with error handling
    const { data: users = [], isLoading: loadingUsers, error: errorUsers } = useQuery({
        queryKey: ['all-users'],
        queryFn: async () => {
            try {
                return await base44.entities.User.list();
            } catch (err) {
                throw new Error(`Failed to fetch users: ${err.message}`);
            }
        }
    });

    const { data: barbers = [], isLoading: loadingBarbers, error: errorBarbers } = useQuery({
        queryKey: ['all-barbers'],
        queryFn: async () => {
            try {
                return await base44.entities.BarberProfile.list();
            } catch (err) {
                throw new Error(`Failed to fetch barbers: ${err.message}`);
            }
        }
    });

    const { data: bookings = [], isLoading: loadingBookings, error: errorBookings } = useQuery({
        queryKey: ['all-bookings'],
        queryFn: async () => {
            try {
                return await base44.entities.Booking.list('-created_date');
            } catch (err) {
                throw new Error(`Failed to fetch bookings: ${err.message}`);
            }
        }
    });

    const { data: products = [], isLoading: loadingProducts, error: errorProducts } = useQuery({
        queryKey: ['all-products'],
        queryFn: async () => {
            try {
                return await base44.entities.Product.list();
            } catch (err) {
                throw new Error(`Failed to fetch products: ${err.message}`);
            }
        }
    });

    const { data: orders = [], isLoading: loadingOrders, error: errorOrders } = useQuery({
        queryKey: ['all-orders'],
        queryFn: async () => {
            try {
                return await base44.entities.Order.list('-created_date');
            } catch (err) {
                throw new Error(`Failed to fetch orders: ${err.message}`);
            }
        }
    });

    const { data: articles = [], isLoading: loadingArticles, error: errorArticles } = useQuery({
        queryKey: ['all-articles'],
        queryFn: async () => {
            try {
                return await base44.entities.Article.list('-created_date');
            } catch (err) {
                throw new Error(`Failed to fetch articles: ${err.message}`);
            }
        }
    });

    // Aggregate loading and error states
    const isLoading = loadingUsers || loadingBarbers || loadingBookings ||
        loadingProducts || loadingOrders || loadingArticles;

    const error = errorUsers || errorBarbers || errorBookings ||
        errorProducts || errorOrders || errorArticles;

    // Business logic - memoized for performance
    const totalRevenue = useMemo(() => {
        return [...bookings, ...orders].reduce((sum, item) =>
            sum + (item.total_price || item.total_amount || 0), 0
        );
    }, [bookings, orders]);

    const pendingBookings = useMemo(() =>
        bookings.filter(b => b.status === 'pending').length,
        [bookings]
    );

    const pendingOrders = useMemo(() =>
        orders.filter(o => o.status === 'pending').length,
        [orders]
    );

    const stats = useMemo(() => [
        {
            title: "Utilisateurs Totaux",
            value: users.length,
            icon: Users,
            color: "bg-[#0B2545]",
            change: "+12%"
        },
        {
            title: "Barbiers Actifs",
            value: barbers.length,
            icon: Scissors,
            color: "bg-[#D08B3D]",
            change: "+8%"
        },
        {
            title: "Revenus Totaux",
            value: `${totalRevenue.toFixed(2)}€`,
            icon: DollarSign,
            color: "bg-[#1E7A4B]",
            change: "+24%"
        },
        {
            title: "En Attente",
            value: pendingBookings + pendingOrders,
            icon: Clock,
            color: "bg-[#D6454A]",
            change: "-5%"
        }
    ], [users.length, barbers.length, totalRevenue, pendingBookings, pendingOrders]);

    return {
        // Data
        users,
        barbers,
        bookings,
        orders,
        articles,
        products,

        // Computed
        stats,
        totalRevenue,
        pendingBookings,
        pendingOrders,

        // State
        searchQuery,
        setSearchQuery,
        selectedTab,
        setSelectedTab,

        // Status
        isLoading,
        error
    };
}
