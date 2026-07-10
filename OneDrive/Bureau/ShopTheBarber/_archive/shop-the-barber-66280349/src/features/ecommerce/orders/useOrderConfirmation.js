import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOrderConfirmation(orderId) {
    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => base44.entities.Order.get(orderId),
        enabled: !!orderId
    });

    return {
        order,
        isLoading,
        error: null
    };
}
