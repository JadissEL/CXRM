import { useState } from 'react';

export function useAdminFeatureToggles() {
    const [features, setFeatures] = useState([
        { id: 1, name: "Réservations en Ligne", description: "Permettre aux clients de réserver en ligne", enabled: true, category: "core" },
        { id: 2, name: "Programme de Fidélité", description: "Système de points et récompenses", enabled: true, category: "engagement" },
        { id: 3, name: "Paiements en Ligne", description: "Accepter les paiements par carte", enabled: true, category: "payment" },
        { id: 4, name: "Chat en Direct", description: "Messagerie instantanée client-barbier", enabled: false, category: "communication" },
        { id: 5, name: "Notifications Push", description: "Notifications navigateur", enabled: true, category: "notification" },
        { id: 6, name: "Mode Maintenance", description: "Mettre la plateforme en maintenance", enabled: false, category: "system" }
    ]);

    const categoryConfig = {
        core: { label: "Fonctionnalité Principale", color: "bg-blue-100 text-blue-800" },
        engagement: { label: "Engagement", color: "bg-purple-100 text-purple-800" },
        payment: { label: "Paiement", color: "bg-emerald-100 text-emerald-800" },
        communication: { label: "Communication", color: "bg-amber-100 text-amber-800" },
        notification: { label: "Notification", color: "bg-pink-100 text-pink-800" },
        system: { label: "Système", color: "bg-red-100 text-red-800" }
    };

    const toggleFeature = (featureId) => {
        setFeatures(prev => prev.map(f =>
            f.id === featureId ? { ...f, enabled: !f.enabled } : f
        ));
        // In production, this would make an API call to persist the change
    };

    const stats = {
        active: features.filter(f => f.enabled).length,
        inactive: features.filter(f => !f.enabled).length,
        total: features.length
    };

    return {
        features,
        categoryConfig,
        stats,
        toggleFeature,
        isLoading: false,
        error: null
    };
}
