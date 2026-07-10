import { useState } from 'react';

export function useShopAnalytics() {
    const [revenueData] = useState([
        { month: "Jan", revenue: 12500, bookings: 245 },
        { month: "Fév", revenue: 15200, bookings: 298 },
        { month: "Mar", revenue: 14800, bookings: 276 },
        { month: "Avr", revenue: 16900, bookings: 312 },
        { month: "Mai", revenue: 18500, bookings: 345 }
    ]);

    const [serviceData] = useState([
        { name: "Coupes", value: 45, color: "#D08B3D" },
        { name: "Barbes", value: 25, color: "#0B2545" },
        { name: "Forfaits", value: 20, color: "#4B5563" },
        { name: "Autres", value: 10, color: "#9CA3AF" }
    ]);

    const [stats] = useState([
        { label: "Revenus ce mois", value: "18,500€", change: "+12%", icon: "DollarSign", trend: "up" },
        { label: "Réservations", value: "345", change: "+8%", icon: "TrendingUp", trend: "up" },
        { label: "Taux d'occupation", value: "87%", change: "+5%", icon: "Calendar", trend: "up" },
        { label: "Ticket moyen", value: "53€", change: "-2%", icon: "TrendingDown", trend: "down" }
    ]);

    return {
        revenueData,
        serviceData,
        stats,
        isLoading: false,
        error: null
    };
}
