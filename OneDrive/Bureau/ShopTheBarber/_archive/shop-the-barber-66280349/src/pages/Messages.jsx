import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMessaging } from "../components/messaging/MessagingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Phone, Video, Info, ArrowLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ConversationList from "../components/messaging/ConversationList";
import MessageBubble from "../components/messaging/MessageBubble";
import MessageInput from "../components/messaging/MessageInput";
import TypingIndicator from "../components/messaging/TypingIndicator";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationId = searchParams.get('conversation');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const messagesContainerRef = useRef(null);

  const { conversations, archivedConversations, sendMessage, markAsRead, archiveConversation, unarchiveConversation, togglePin, startTyping, stopTyping, deleteMessage, currentUser } = useMessaging();

  const selectedConversation = [...conversations, ...archivedConversations].find(c => c.id === selectedConversationId);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const msgs = await base44.entities.Message.filter({ conversation_id: selectedConversationId }, 'created_date');
      return msgs.filter(m => !m.deleted_for?.includes(currentUser?.id));
    },
    enabled: !!selectedConversationId,
    refetchInterval: 2000
  });

  const { data: otherUser } = useQuery({
    queryKey: ['other-user', selectedConversation?.participant_1_id, selectedConversation?.participant_2_id],
    queryFn: async () => {
      if (!selectedConversation || !currentUser) return null;
      const otherUserId = selectedConversation.participant_1_id === currentUser.id ? selectedConversation.participant_2_id : selectedConversation.participant_1_id;
      const users = await base44.entities.User.list();
      return users.find(u => u.id === otherUserId);
    },
    enabled: !!selectedConversation && !!currentUser
  });

  const { data: typingIndicators = [] } = useQuery({
    queryKey: ['typing-indicators', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId || !currentUser) return [];
      const indicators = await base44.entities.TypingIndicator.filter({ conversation_id: selectedConversationId });
      return indicators.filter(i => i.user_id !== currentUser.id && i.is_typing && new Date() - new Date(i.last_activity) < 3000);
    },
    enabled: !!selectedConversationId && !!currentUser,
    refetchInterval: 1000
  });

  useEffect(() => { if (selectedConversationId && messages.length > 0) markAsRead(selectedConversationId); }, [selectedConversationId, messages.length]);
  useEffect(() => { if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight; }, [messages, typingIndicators]);

  const handleSendMessage = async (text, type, attachmentUrl, attachmentName, attachmentSize) => await sendMessage(selectedConversationId, text, type, attachmentUrl, attachmentName, attachmentSize);
  const handleArchive = (convId) => activeTab === 'active' ? archiveConversation(convId) : unarchiveConversation(convId);
  const filteredConversations = (activeTab === 'active' ? conversations : archivedConversations).filter(conv => !searchQuery || conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          <div className={`lg:col-span-4 flex flex-col ${selectedConversationId ? 'hidden lg:flex' : 'flex'}`}>
            <Card className="rounded-[12px] border-2 border-slate-200 flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-[#0B2545] mb-4">Messages</h1>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563] w-5 h-5" />
                  <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border-slate-200 rounded-[10px] focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full bg-slate-100 rounded-[10px] p-1">
                    <TabsTrigger value="active" className="flex-1 rounded-[8px] min-h-[44px] data-[state=active]:bg-white">Actives ({conversations.length})</TabsTrigger>
                    <TabsTrigger value="archived" className="flex-1 rounded-[8px] min-h-[44px] data-[state=active]:bg-white">Archivées ({archivedConversations.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <ConversationList conversations={filteredConversations} selectedConversationId={selectedConversationId} onSelectConversation={(id) => setSearchParams({ conversation: id })} onArchive={handleArchive} onTogglePin={togglePin} currentUser={currentUser} />
            </Card>
          </div>

          <div className={`lg:col-span-8 flex flex-col ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}>
            {!selectedConversation ? (
              <Card className="rounded-[12px] border-2 border-slate-200 flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <MessageSquare className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0B2545] mb-2">Sélectionnez une conversation</h3>
                  <p className="text-[#4B5563]">Choisissez une conversation pour commencer à discuter</p>
                </div>
              </Card>
            ) : (
              <Card className="rounded-[12px] border-2 border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden min-h-[44px] min-w-[44px]" onClick={() => setSearchParams({})}><ArrowLeft className="w-5 h-5" /></Button>
                    <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">{otherUser?.full_name?.[0] || 'U'}</span></div>
                    <div><p className="font-semibold text-[#0B2545]">{otherUser?.full_name || 'Utilisateur'}</p><p className="text-xs text-[#1E7A4B]">En ligne</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-[#4B5563] min-h-[44px] min-w-[44px]"><Phone className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-[#4B5563] min-h-[44px] min-w-[44px]"><Video className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-[#4B5563] min-h-[44px] min-w-[44px]"><Info className="w-5 h-5" /></Button>
                  </div>
                </div>
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-[#F7F8FA]">
                  <AnimatePresence>{messages.map((msg) => <MessageBubble key={msg.id} message={msg} isMe={msg.sender_id === currentUser?.id} otherUser={otherUser} onDelete={deleteMessage} />)}</AnimatePresence>
                  <AnimatePresence>{typingIndicators.length > 0 && <TypingIndicator userName={otherUser?.full_name} />}</AnimatePresence>
                </div>
                <MessageInput onSendMessage={handleSendMessage} onStartTyping={() => startTyping(selectedConversationId)} onStopTyping={() => stopTyping(selectedConversationId)} disabled={!selectedConversationId} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}