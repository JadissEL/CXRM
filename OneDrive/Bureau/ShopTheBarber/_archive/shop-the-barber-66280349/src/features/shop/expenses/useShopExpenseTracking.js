import { useState, useMemo } from 'react';

export function useShopExpenseTracking() {
    const [expenses] = useState([
        { id: 1, category: "Loyer", amount: 1500, date: "2024-12-01", recurring: true },
        { id: 2, category: "Produits", amount: 450, date: "2024-11-28", recurring: false },
        { id: 3, category: "Électricité", amount: 180, date: "2024-11-25", recurring: true },
        { id: 4, category: "Marketing", amount: 300, date: "2024-11-20", recurring: false }
    ]);

    const [categories] = useState(["Loyer", "Produits", "Électricité", "Marketing", "Salaires", "Autres"]);

    const stats = useMemo(() => ({
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        recurringExpenses: expenses.filter(e => e.recurring).reduce((sum, e) => sum + e.amount, 0),
        categoriesCount: categories.length
    }), [expenses, categories]);

    return {
        expenses,
        categories,
        stats,
        isLoading: false,
        error: null
    };
}
