import { useMemo } from 'react';

export function useBarberReviewManagement() {
    const reviews = [
        { id: 1, client: "Jean Dupont", rating: 5, comment: "Excellent service, très professionnel!", date: "2024-11-28", helpful: 12, avatar: null },
        { id: 2, client: "Marie Martin", rating: 4, comment: "Bonne coupe, ambiance agréable", date: "2024-11-25", helpful: 8, avatar: null },
        { id: 3, client: "Pierre Dubois", rating: 5, comment: "Toujours satisfait, je recommande", date: "2024-11-20", helpful: 15, avatar: null },
        { id: 4, client: "Sophie Laurent", rating: 5, comment: "Parfait comme toujours!", date: "2024-11-18", helpful: 10, avatar: null }
    ];

    const avgRating = useMemo(() =>
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
        [reviews]
    );

    const totalHelpful = useMemo(() =>
        reviews.reduce((sum, r) => sum + r.helpful, 0),
        [reviews]
    );

    return {
        reviews,
        avgRating,
        totalHelpful,
        isLoading: false,
        error: null
    };
}
