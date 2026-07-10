import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useMessages() {
    const [searchParams] = useSearchParams();
    const conversationId = searchParams.get('conversation');

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: () => base44.entities.Conversation.filter({ user_id: user.id }, '-updated_date'),
        enabled: !!user
    });

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
        enabled: !!conversationId
    });

    const { data: activeConversation } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => base44.entities.Conversation.get(conversationId),
        enabled: !!conversationId
    });

    const handleSendMessage = (text, type, attachmentUrl, attachmentName, attachmentSize) => {
        // Message sending logic
        console.log('Sending message:', text);
    };

    const handleArchive = (convId) => {
        // Archive conversation logic
        console.log('Archiving conversation:', convId);
    };

    return {
        conversations,
        messages,
        activeConversation,
        handleSendMessage,
        handleArchive,
        isLoading: conversationsLoading || messagesLoading,
        error: null
    };
}
