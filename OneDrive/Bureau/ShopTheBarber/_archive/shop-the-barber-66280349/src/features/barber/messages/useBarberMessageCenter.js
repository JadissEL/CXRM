export function useBarberMessageCenter() {
    const conversations = [
        { id: 1, client: "Jean Dupont", lastMessage: "Merci pour la coupe!", time: "10:30", unread: 0, avatar: null },
        { id: 2, client: "Marie Martin", lastMessage: "Disponible demain?", time: "09:15", unread: 2, avatar: null },
        { id: 3, client: "Pierre Dubois", lastMessage: "Parfait, à bientôt", time: "Hier", unread: 0, avatar: null },
        { id: 4, client: "Sophie Laurent", lastMessage: "Merci beaucoup!", time: "Hier", unread: 0, avatar: null }
    ];

    return {
        conversations,
        isLoading: false,
        error: null
    };
}
