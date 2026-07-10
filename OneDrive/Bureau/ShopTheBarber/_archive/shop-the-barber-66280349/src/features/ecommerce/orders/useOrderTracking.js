import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOrderTracking(orderId) {
    const { data: order, isLoading } = useQuery({
        queryKey: ['order-tracking', orderId],
        queryFn: () => base44.entities.Order.get(orderId),
        enabled: !!orderId
    });

    const trackingSteps = [
        { id: 1, label: 'Commande passée', status: 'completed', date: order?.created_date },
        { id: 2, label: 'En préparation', status: order?.status === 'processing' ? 'current' : order?.status === 'shipped' || order?.status === 'delivered' ? 'completed' : 'pending' },
        { id: 3, label: 'Expédiée', status: order?.status === 'shipped' ? 'current' : order?.status === 'delivered' ? 'completed' : 'pending' },
        { id: 4, label: 'Livrée', status: order?.status === 'delivered' ? 'completed' : 'pending' }
    ];

    return {
        order,
        trackingSteps,
        isLoading,
        error: null
    };
}
