import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useClientBookingDetails() {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('id');

    const { data: booking, isLoading: bookingLoading } = useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => base44.entities.Booking.get(bookingId),
        enabled: !!bookingId
    });

    const { data: barber, isLoading: barberLoading } = useQuery({
        queryKey: ['barber', booking?.barber_id],
        queryFn: () => base44.entities.BarberProfile.get(booking.barber_id),
        enabled: !!booking?.barber_id
    });

    const { data: service, isLoading: serviceLoading } = useQuery({
        queryKey: ['service', booking?.service_id],
        queryFn: () => base44.entities.Service.get(booking.service_id),
        enabled: !!booking?.service_id
    });

    const getStatusBadge = (status) => {
        const variants = {
            pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "En attente" },
            confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmé" },
            completed: { bg: "bg-green-100", text: "text-green-800", label: "Terminé" },
            cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Annulé" }
        };
        return variants[status] || variants.pending;
    };

    return {
        booking,
        barber,
        service,
        getStatusBadge,
        isLoading: bookingLoading || barberLoading || serviceLoading,
        error: null
    };
}
