import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useAdminUserManagement() {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all users
    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['admin-all-users'],
        queryFn: async () => {
            try {
                return await base44.entities.User.list();
            } catch (err) {
                throw new Error(`Failed to fetch users: ${err.message}`);
            }
        }
    });

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.role?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalUsers = users.length;
        const clientCount = users.filter(u => u.role === 'client').length;
        const barberCount = users.filter(u => u.role === 'barber').length;
        const suspendedCount = users.filter(u => u.status === 'suspended' || u.is_suspended).length;

        return {
            total: totalUsers,
            clients: clientCount,
            barbers: barberCount,
            suspended: suspendedCount
        };
    }, [users]);

    // Role configuration
    const roleColors = {
        client: { bg: "bg-blue-100", text: "text-blue-800", label: "Client" },
        barber: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Barbier" },
        vendor: { bg: "bg-purple-100", text: "text-purple-800", label: "Vendeur" },
        admin: { bg: "bg-amber-100", text: "text-amber-800", label: "Admin" }
    };

    return {
        users: filteredUsers,
        stats,
        roleColors,
        searchQuery,
        setSearchQuery,
        isLoading,
        error
    };
}
