export function useAdminGlobalFinancials() {
    // Mock financial data - in production this would fetch from financial API
    const financialData = {
        totalRevenue: 125000,
        totalCommissions: 12500,
        pendingPayouts: 8500,
        platformFees: 3200
    };

    const transactions = [
        { id: 1, shop: "Premium Barber Shop", amount: 2500, commission: 250, date: "2024-12-01", status: "completed" },
        { id: 2, shop: "Urban Cuts", amount: 1800, commission: 180, date: "2024-11-30", status: "pending" },
        { id: 3, shop: "Style Masters", amount: 3200, commission: 320, date: "2024-11-29", status: "completed" },
        { id: 4, shop: "Classic Cuts", amount: 1500, commission: 150, date: "2024-11-28", status: "completed" }
    ];

    return {
        financialData,
        transactions,
        isLoading: false,
        error: null
    };
}
