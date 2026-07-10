import { useState, useMemo } from 'react';

export function useShopInventoryManagement() {
    const [inventory] = useState([
        { id: 1, name: "Shampoing Professionnel", category: "Soins", stock: 45, minStock: 20, price: 12.50, status: "in_stock" },
        { id: 2, name: "Cire Coiffante", category: "Styling", stock: 15, minStock: 20, price: 8.99, status: "low_stock" },
        { id: 3, name: "Tondeuse Pro", category: "Équipement", stock: 3, minStock: 5, price: 150, status: "low_stock" },
        { id: 4, name: "Gel Fixation Forte", category: "Styling", stock: 0, minStock: 15, price: 9.50, status: "out_of_stock" }
    ]);

    const stats = useMemo(() => ({
        total: inventory.length,
        lowStock: inventory.filter(i => i.status === 'low_stock').length,
        outOfStock: inventory.filter(i => i.status === 'out_of_stock').length
    }), [inventory]);

    const getStatusBadge = (status) => {
        const variants = {
            in_stock: { bg: "bg-emerald-100", text: "text-emerald-800", label: "En Stock" },
            low_stock: { bg: "bg-amber-100", text: "text-amber-800", label: "Stock Faible" },
            out_of_stock: { bg: "bg-red-100", text: "text-red-800", label: "Rupture" }
        };
        return variants[status];
    };

    return {
        inventory,
        stats,
        getStatusBadge,
        isLoading: false,
        error: null
    };
}
