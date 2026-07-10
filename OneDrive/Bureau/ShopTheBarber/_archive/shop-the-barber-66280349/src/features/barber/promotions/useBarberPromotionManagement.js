import { useMemo } from 'react';

export function useBarberPromotionManagement() {
    const promotions = [
        { id: 1, title: "Réduction Première Visite", discount: 20, type: "percentage", active: true, used: 45, expiry: "2024-12-31" },
        { id: 2, title: "Forfait Coupe + Barbe", discount: 10, type: "fixed", active: true, used: 23, expiry: "2024-12-15" },
        { id: 3, title: "Offre Étudiants", discount: 15, type: "percentage", active: false, used: 67, expiry: "2024-11-30" },
        { id: 4, title: "Black Friday", discount: 25, type: "percentage", active: true, used: 102, expiry: "2024-12-05" }
    ];

    const stats = useMemo(() => ({
        activeCount: promotions.filter(p => p.active).length,
        totalUsed: promotions.reduce((sum, p) => sum + p.used, 0),
        conversionRate: 68
    }), [promotions]);

    return {
        promotions,
        stats,
        isLoading: false,
        error: null
    };
}
