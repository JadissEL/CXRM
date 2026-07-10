import { useMemo } from 'react';

export function useBarberPayouts() {
    const payouts = [
        { id: 1, amount: 450, status: "completed", date: "2024-11-25", method: "Bank Transfer" },
        { id: 2, amount: 520, status: "pending", date: "2024-12-01", method: "Bank Transfer" },
        { id: 3, amount: 380, status: "completed", date: "2024-10-25", method: "Bank Transfer" },
        { id: 4, amount: 490, status: "completed", date: "2024-09-25", method: "Bank Transfer" }
    ];

    const totalEarnings = useMemo(() =>
        payouts.reduce((sum, p) => sum + p.amount, 0),
        [payouts]
    );

    const pendingAmount = useMemo(() =>
        payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        [payouts]
    );

    return {
        payouts,
        totalEarnings,
        pendingAmount,
        isLoading: false,
        error: null
    };
}
