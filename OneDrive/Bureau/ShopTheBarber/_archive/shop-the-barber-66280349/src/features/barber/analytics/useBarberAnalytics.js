export function useBarberAnalytics() {
    const stats = [
        { label: "Revenus ce mois", value: "2,450€", change: "+12%", icon: "DollarSign", color: "text-emerald-600" },
        { label: "Rendez-vous", value: "87", change: "+8%", icon: "Calendar", color: "text-blue-600" },
        { label: "Nouveaux clients", value: "23", change: "+15%", icon: "Users", color: "text-purple-600" },
        { label: "Taux de satisfaction", value: "4.8/5", change: "+0.2", icon: "TrendingUp", color: "text-amber-600" }
    ];

    const revenueData = [
        { month: "Jan", revenue: 1800 },
        { month: "Fév", revenue: 2100 },
        { month: "Mar", revenue: 1950 },
        { month: "Avr", revenue: 2300 },
        { month: "Mai", revenue: 2450 }
    ];

    return {
        stats,
        revenueData,
        isLoading: false,
        error: null
    };
}
