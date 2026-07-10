import { useState } from 'react';

export function useClientWallet() {
    const [balance] = useState(125.50);
    const [transactions] = useState([
        { id: 1, type: "credit", amount: 50, description: "Remboursement réservation", date: new Date(2025, 11, 1) },
        { id: 2, type: "debit", amount: 35, description: "Paiement coupe", date: new Date(2025, 10, 28) },
        { id: 3, type: "credit", amount: 100, description: "Recharge portefeuille", date: new Date(2025, 10, 25) },
        { id: 4, type: "debit", amount: 45, description: "Service barbe", date: new Date(2025, 10, 20) }
    ]);

    const stats = {
        received: 150.00,
        spent: 80.00,
        savings: 70.00
    };

    return {
        balance,
        transactions,
        stats,
        isLoading: false,
        error: null
    };
}
