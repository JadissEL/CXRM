import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MessagingContext = createContext();

export function MessagingProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    loadUser();
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allConversations = await base44.entities.Conversation.list('-last_message_date');
      return allConversations.filter(c => 
        (c.participant_1_id === user.id || c.participant_2_id === user.id) &&
        (c.participant_1_id === user.id ? !c.is_archived_p1 : !c.is_archived_p2)
      );
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const { data: archivedConversations = [] } = useQuery({
    queryKey: ['archived-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allConversations = await base44.entities.Conversation.list('-last_message_date');
      return allConversations.filter(c => 
        (c.participant_1_id === user.id && c.is_archived_p1) ||
        (c.participant_2_id === user.id && c.is_archived_p2)
      );
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  const getTotalUnreadCount = () => {
    if (!user) return 0;
    return conversations.reduce((total, conv) => {
      const unreadField = conv.participant_1_id === user.id ? 'unread_count_p1' : 'unread_count_p2';
      return total + (conv[unreadField] || 0);
    }, 0);
  };

  const getOrCreateConversation = async (otherUserId, conversationType) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return null;
    }

    const existing = [...conversations, ...archivedConversations].find(c => 
      (c.participant_1_id === user.id && c.participant_2_id === otherUserId) ||
      (c.participant_2_id === user.id && c.participant_1_id === otherUserId)
    );

    if (existing) {
      // Désarchiver si nécessaire
      if (existing.participant_1_id === user.id && existing.is_archived_p1) {
        await base44.entities.Conversation.update(existing.id, { is_archived_p1: false });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['archived-conversations'] });
      } else if (existing.participant_2_id === user.id && existing.is_archived_p2) {
        await base44.entities.Conversation.update(existing.id, { is_archived_p2: false });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['archived-conversations'] });
      }
      return existing;
    }

    const newConv = await base44.entities.Conversation.create({
      participant_1_id: user.id,
      participant_2_id: otherUserId,
      conversation_type: conversationType,
      last_message: "",
      last_message_date: new Date().toISOString(),
      last_message_sender_id: user.id
    });

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    return newConv;
  };

  const sendMessage = async (conversationId, messageText, messageType = 'text', attachmentUrl = null, attachmentName = null, attachmentSize = null) => {
    if (!user) return;

    const conversation = [...conversations, ...archivedConversations].find(c => c.id === conversationId);
    if (!conversation) return;

    await base44.entities.Message.create({
      conversation_id: conversationId,
      sender_id: user.id,
      message_text: messageText,
      message_type: messageType,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_size: attachmentSize
    });

    const otherUserId = conversation.participant_1_id === user.id 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const unreadField = conversation.participant_1_id === user.id 
      ? 'unread_count_p2' 
      : 'unread_count_p1';

    await base44.entities.Conversation.update(conversationId, {
      last_message: messageText,
      last_message_date: new Date().toISOString(),
      last_message_sender_id: user.id,
      [unreadField]: (conversation[unreadField] || 0) + 1
    });

    // Arrêter l'indicateur de saisie
    await stopTyping(conversationId);

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });

    // Notification
    await base44.entities.Notification.create({
      user_id: otherUserId,
      type: 'message',
      title: 'Nouveau Message',
      message: `${user.full_name || 'Un utilisateur'} vous a envoyé un message`,
      link: `/Messages?conversation=${conversationId}`,
      icon: 'message',
      priority: 'medium'
    });
  };

  const markAsRead = async (conversationId) => {
    if (!user) return;

    const conversation = [...conversations, ...archivedConversations].find(c => c.id === conversationId);
    if (!conversation) return;

    const unreadField = conversation.participant_1_id === user.id 
      ? 'unread_count_p1' 
      : 'unread_count_p2';

    if (conversation[unreadField] > 0) {
      await base44.entities.Conversation.update(conversationId, {
        [unreadField]: 0
      });

      const messages = await base44.entities.Message.filter({ conversation_id: conversationId });
      const unreadMessages = messages.filter(m => !m.is_read && m.sender_id !== user.id);
      
      for (const msg of unreadMessages) {
        await base44.entities.Message.update(msg.id, {
          is_read: true,
          read_date: new Date().toISOString()
        });
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  };

  const archiveConversation = async (conversationId) => {
    if (!user) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const archiveField = conversation.participant_1_id === user.id 
      ? 'is_archived_p1' 
      : 'is_archived_p2';

    await base44.entities.Conversation.update(conversationId, {
      [archiveField]: true
    });

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['archived-conversations'] });
  };

  const unarchiveConversation = async (conversationId) => {
    if (!user) return;

    const conversation = archivedConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const archiveField = conversation.participant_1_id === user.id 
      ? 'is_archived_p1' 
      : 'is_archived_p2';

    await base44.entities.Conversation.update(conversationId, {
      [archiveField]: false
    });

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['archived-conversations'] });
  };

  const togglePin = async (conversationId) => {
    if (!user) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const pinField = conversation.participant_1_id === user.id 
      ? 'is_pinned_p1' 
      : 'is_pinned_p2';

    await base44.entities.Conversation.update(conversationId, {
      [pinField]: !conversation[pinField]
    });

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const startTyping = async (conversationId) => {
    if (!user) return;

    const indicators = await base44.entities.TypingIndicator.filter({
      conversation_id: conversationId,
      user_id: user.id
    });

    if (indicators.length > 0) {
      await base44.entities.TypingIndicator.update(indicators[0].id, {
        is_typing: true,
        last_activity: new Date().toISOString()
      });
    } else {
      await base44.entities.TypingIndicator.create({
        conversation_id: conversationId,
        user_id: user.id,
        is_typing: true,
        last_activity: new Date().toISOString()
      });
    }
  };

  const stopTyping = async (conversationId) => {
    if (!user) return;

    const indicators = await base44.entities.TypingIndicator.filter({
      conversation_id: conversationId,
      user_id: user.id
    });

    if (indicators.length > 0) {
      await base44.entities.TypingIndicator.update(indicators[0].id, {
        is_typing: false
      });
    }
  };

  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!user) return;

    const message = await base44.entities.Message.list();
    const msg = message.find(m => m.id === messageId);
    
    if (!msg) return;

    if (deleteForEveryone && msg.sender_id === user.id) {
      await base44.entities.Message.update(messageId, {
        is_deleted: true,
        message_text: 'Ce message a été supprimé'
      });
    } else {
      const deletedFor = msg.deleted_for || [];
      deletedFor.push(user.id);
      await base44.entities.Message.update(messageId, {
        deleted_for: deletedFor
      });
    }

    queryClient.invalidateQueries({ queryKey: ['messages'] });
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        archivedConversations,
        getTotalUnreadCount,
        getOrCreateConversation,
        sendMessage,
        markAsRead,
        archiveConversation,
        unarchiveConversation,
        togglePin,
        startTyping,
        stopTyping,
        deleteMessage,
        currentUser: user
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}