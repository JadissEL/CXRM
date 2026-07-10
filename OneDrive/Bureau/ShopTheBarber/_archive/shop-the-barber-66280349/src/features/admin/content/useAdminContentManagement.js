import { useState } from 'react';

export function useAdminContentManagement() {
    // Mock data - in production this would fetch from content API
    const content = [
        { id: 1, title: "Guide du Barbier Débutant", type: "article", status: "published", views: 1250, date: "2024-11-15" },
        { id: 2, title: "Tendances Coiffure 2025", type: "article", status: "draft", views: 0, date: "2024-12-01" },
        { id: 3, title: "Tutoriel Fade Classique", type: "video", status: "published", views: 3400, date: "2024-10-20" },
        { id: 4, title: "Les Meilleurs Produits 2024", type: "article", status: "published", views: 2100, date: "2024-09-10" },
        { id: 5, title: "Techniques de Rasage", type: "tutorial", status: "draft", views: 0, date: "2024-12-02" }
    ];

    const statusColors = {
        published: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Publié" },
        draft: { bg: "bg-amber-100", text: "text-amber-800", label: "Brouillon" },
        archived: { bg: "bg-slate-100", text: "text-slate-600", label: "Archivé" }
    };

    const typeLabels = {
        article: "Article",
        video: "Vidéo",
        tutorial: "Tutoriel"
    };

    const stats = {
        total: content.length,
        published: content.filter(c => c.status === 'published').length,
        totalViews: content.reduce((sum, c) => sum + c.views, 0)
    };

    return {
        content,
        statusColors,
        typeLabels,
        stats,
        isLoading: false,
        error: null
    };
}
