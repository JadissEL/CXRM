import { useState } from 'react';

export function useNotifications() {
    const [notifications] = useState([
        {
            id: 1,
            type: 'booking',
            title: 'Réservation confirmée',
            message: 'Votre rendez-vous avec Alex Martin est confirmé pour demain à 14h',
            is_read: false,
            priority: 'high',
            created_date: new Date().toISOString(),
            link: '/ClientDashboard'
        },
        {
            id: 2,
            type: 'order',
            title: 'Commande expédiée',
            message: 'Votre commande #12345 a été expédiée',
            is_read: true,
            priority: 'normal',
            created_date: new Date(Date.now() - 86400000).toISOString(),
            link: '/OrderTracking?id=12345'
        }
    ]);

    const unreadNotifications = notifications.filter(n => !n.is_read);

    const getUnreadCount = () => unreadNotifications.length;

    const getNotificationsByType = (type) => {
        return notifications.filter(n => n.type === type);
    };

    const markAsRead = (id) => {
        console.log('Mark as read:', id);
    };

    const markAllAsRead = () => {
        console.log('Mark all as read');
    };

    const deleteNotification = (id) => {
        console.log('Delete notification:', id);
    };

    return {
        notifications,
        unreadNotifications,
        getUnreadCount,
        getNotificationsByType,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isLoading: false,
        error: null
    };
}
