import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useVendorDashboard() {
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ['vendor-products', user?.id],
        queryFn: () => base44.entities.Product.filter({ vendor_id: user.id }),
        enabled: !!user
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['vendor-orders', user?.id],
        queryFn: async () => {
            const productIds = products.map(p => p.id);
            if (!productIds.length) return [];
            return base44.entities.Order.filter({ product_id: productIds }, '-created_date');
        },
        enabled: products.length > 0
    });

    const stats = {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        averageRating: 4.5
    };

    return {
        user,
        products,
        orders,
        stats,
        isLoading: productsLoading || ordersLoading,
        error: null
    };
}
