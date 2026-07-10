import { useState } from 'react';

export function useBarberServiceManagement() {
    const [services, setServices] = useState([
        { id: 1, name: "Coupe Classique", price: 25, duration: 30, category: "haircut", active: true },
        { id: 2, name: "Barbe", price: 15, duration: 20, category: "beard", active: true },
        { id: 3, name: "Coupe + Barbe", price: 35, duration: 45, category: "package", active: true },
        { id: 4, name: "Coupe Enfant", price: 18, duration: 25, category: "haircut", active: true }
    ]);

    const categoryLabels = {
        haircut: "Coupe",
        beard: "Barbe",
        package: "Forfait"
    };

    const addService = (service) => {
        setServices(prev => [...prev, { ...service, id: Date.now() }]);
    };

    const updateService = (id, updates) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteService = (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
    };

    return {
        services,
        categoryLabels,
        addService,
        updateService,
        deleteService,
        isLoading: false,
        error: null
    };
}
