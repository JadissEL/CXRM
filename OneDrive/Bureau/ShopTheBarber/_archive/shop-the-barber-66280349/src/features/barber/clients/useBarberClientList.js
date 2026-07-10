import { useMemo } from 'react';

export function useBarberClientList() {
    const clients = [
        { id: 1, name: "Jean Dupont", email: "jean@email.com", phone: "+33 6 12 34 56 78", visits: 12, lastVisit: "2024-11-28", avatar: null },
        { id: 2, name: "Marie Martin", email: "marie@email.com", phone: "+33 6 23 45 67 89", visits: 8, lastVisit: "2024-11-25", avatar: null },
        { id: 3, name: "Pierre Dubois", email: "pierre@email.com", phone: "+33 6 34 56 78 90", visits: 15, lastVisit: "2024-11-30", avatar: null },
        { id: 4, name: "Sophie Laurent", email: "sophie@email.com", phone: "+33 6 45 67 89 01", visits: 20, lastVisit: "2024-12-01", avatar: null }
    ];

    const stats = useMemo(() => ({
        total: clients.length,
        totalVisits: clients.reduce((sum, c) => sum + c.visits, 0),
        regularClients: clients.filter(c => c.visits >= 10).length
    }), [clients]);

    return {
        clients,
        stats,
        isLoading: false,
        error: null
    };
}
