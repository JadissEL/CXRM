import { useState } from 'react';

export function useShopEmployeeManagement() {
    const [employees] = useState([
        { id: 1, name: "Alex Martin", role: "Barbier Senior", email: "alex@shop.com", phone: "+33 6 12 34 56 78", status: "active", avatar: null, joinDate: "2023-01-15" },
        { id: 2, name: "Sophie Dubois", role: "Barbier", email: "sophie@shop.com", phone: "+33 6 23 45 67 89", status: "active", avatar: null, joinDate: "2023-06-20" },
        { id: 3, name: "Marc Lefebvre", role: "Apprenti", email: "marc@shop.com", phone: "+33 6 34 56 78 90", status: "active", avatar: null, joinDate: "2024-01-10" }
    ]);

    return {
        employees,
        isLoading: false,
        error: null
    };
}
