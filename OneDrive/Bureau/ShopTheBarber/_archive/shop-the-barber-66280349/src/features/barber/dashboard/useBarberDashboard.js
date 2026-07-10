import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export function useBarberDashboard() {
    const queryClient = useQueryClient();
    const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        shop_name: '',
        specialties: '',
        experience_years: ''
    });

    // Fetch current user
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    // Fetch barber profile
    const { data: barberProfile, isLoading: profileLoading } = useQuery({
        queryKey: ['my-barber-profile', user?.id],
        queryFn: () => base44.entities.BarberProfile.filter({ user_id: user.id }).then(profiles => profiles[0]),
        enabled: !!user
    });

    // Fetch services
    const { data: services = [] } = useQuery({
        queryKey: ['my-services', barberProfile?.id],
        queryFn: () => base44.entities.Service.filter({ barber_id: barberProfile.id }),
        enabled: !!barberProfile
    });

    // Fetch bookings
    const { data: bookings = [] } = useQuery({
        queryKey: ['my-bookings', barberProfile?.id],
        queryFn: () => base44.entities.Booking.filter({ barber_id: barberProfile.id }, '-booking_date'),
        enabled: !!barberProfile
    });

    // Fetch reviews
    const { data: reviews = [] } = useQuery({
        queryKey: ['my-reviews', barberProfile?.id],
        queryFn: () => base44.entities.Review.filter({ target_type: 'barber', target_id: barberProfile.id }),
        enabled: !!barberProfile
    });

    // Create profile mutation
    const createProfileMutation = useMutation({
        mutationFn: (data) => base44.entities.BarberProfile.create({
            ...data,
            user_id: user.id,
            specialties: data.specialties.split(',').map(s => s.trim()).filter(s => s),
            experience_years: parseInt(data.experience_years) || 0
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            setIsCreateProfileOpen(false);
        }
    });

    // Calculate statistics
    const stats = useMemo(() => {
        const todayBookings = bookings.filter(b =>
            b.booking_date === format(new Date(), 'yyyy-MM-dd')
        ).length;

        const pendingBookings = bookings.filter(b => b.status === 'pending').length;

        const totalRevenue = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.total_price || 0), 0);

        return [
            {
                title: "Aujourd'hui",
                value: todayBookings,
                icon: "Calendar",
                color: "bg-[#0B2545]",
                subtitle: "rendez-vous"
            },
            {
                title: "En Attente",
                value: pendingBookings,
                icon: "Clock",
                color: "bg-[#D08B3D]",
                subtitle: "à confirmer"
            },
            {
                title: "Revenus Totaux",
                value: `${totalRevenue.toFixed(0)}€`,
                icon: "DollarSign",
                color: "bg-[#1E7A4B]",
                subtitle: "générés"
            },
            {
                title: "Note Moyenne",
                value: barberProfile?.rating?.toFixed(1) || "5.0",
                icon: "Star",
                color: "bg-[#D08B3D]",
                subtitle: `${reviews.length} avis`
            }
        ];
    }, [bookings, barberProfile, reviews]);

    return {
        user,
        barberProfile,
        profileLoading,
        services,
        bookings,
        reviews,
        stats,
        isCreateProfileOpen,
        setIsCreateProfileOpen,
        profileForm,
        setProfileForm,
        createProfileMutation,
        isLoading: profileLoading,
        error: null
    };
}
