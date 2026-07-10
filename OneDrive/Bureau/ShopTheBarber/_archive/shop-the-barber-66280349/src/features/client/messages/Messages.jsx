import { useMessages } from './useMessages';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Messages() {
    const { conversations, messages, activeConversation, handleSendMessage, isLoading } = useMessages();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D08B3D]" /></div>;
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Messages</h1>
                    <p className="text-[#4B5563]">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-4">
                                <h2 className="font-bold text-[#0B2545] mb-4">Conversations</h2>
                                <div className="space-y-2">
                                    {conversations.map((conv) => (
                                        <div key={conv.id} className="p-3 bg-slate-50 rounded-[10px] cursor-pointer hover:bg-slate-100 transition-colors">
                                            <p className="font-semibold text-[#0B2545]">{conv.participant_name || 'Conversation'}</p>
                                            <p className="text-sm text-[#4B5563] truncate">{conv.last_message}</p>
                                        </div>
                                    ))}
                                    {conversations.length === 0 && (
                                        <p className="text-center text-[#4B5563] py-8">Aucune conversation</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                {activeConversation ? (
                                    <>
                                        <div className="border-b pb-4 mb-4">
                                            <h2 className="font-bold text-[#0B2545]">{activeConversation.participant_name || 'Conversation'}</h2>
                                        </div>

                                        <div className="h-96 overflow-y-auto mb-4 space-y-4">
                                            {messages.map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.is_sender ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs p-3 rounded-[10px] ${msg.is_sender ? 'bg-[#D08B3D] text-white' : 'bg-slate-100 text-[#0B2545]'}`}>
                                                        <p>{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${msg.is_sender ? 'text-white/70' : 'text-[#4B5563]'}`}>
                                                            {format(new Date(msg.created_date), 'HH:mm', { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3">
                                            <Input placeholder="Écrivez votre message..." className="flex-1 rounded-[10px]" />
                                            <Button onClick={() => handleSendMessage('Message')} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-96 flex items-center justify-center text-[#4B5563]">
                                        Sélectionnez une conversation
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
