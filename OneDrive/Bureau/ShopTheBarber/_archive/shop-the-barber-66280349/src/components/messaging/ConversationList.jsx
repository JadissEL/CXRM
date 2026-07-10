import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Archive,
  Pin,
  Trash2,
  Check,
  CheckCheck,
  MessageSquare
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation,
  onArchive,
  onTogglePin,
  currentUser
}) {
  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Hier';
    } else {
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  // Trier: épinglées en premier, puis par date
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPin = a.participant_1_id === currentUser?.id ? a.is_pinned_p1 : a.is_pinned_p2;
    const bPin = b.participant_1_id === currentUser?.id ? b.is_pinned_p1 : b.is_pinned_p2;
    
    if (aPin && !bPin) return -1;
    if (!aPin && bPin) return 1;
    
    return new Date(b.last_message_date) - new Date(a.last_message_date);
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-600">Aucune conversation</p>
        </div>
      ) : (
        <AnimatePresence>
          {sortedConversations.map((conv, index) => {
            const isSelected = conv.id === selectedConversationId;
            const unreadField = conv.participant_1_id === currentUser?.id 
              ? 'unread_count_p1' 
              : 'unread_count_p2';
            const unreadCount = conv[unreadField] || 0;
            const isLastFromMe = conv.last_message_sender_id === currentUser?.id;
            const isPinned = conv.participant_1_id === currentUser?.id 
              ? conv.is_pinned_p1 
              : conv.is_pinned_p2;

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-4 flex items-start gap-3 border-b border-slate-200 transition-all relative ${
                  isSelected 
                    ? 'bg-[#D08B3D]/10 border-l-4 border-l-[#D08B3D]' 
                    : 'hover:bg-[#F7F8FA]'
                }`}
              >
                {isPinned && (
                  <Pin className="absolute top-2 right-2 w-3 h-3 text-[#D08B3D] fill-current" />
                )}

                <Avatar className="w-12 h-12 ring-2 ring-slate-200 flex-shrink-0 rounded-[12px]">
                  <AvatarFallback className="bg-[#0B2545] text-white font-bold rounded-[12px]">
                    U
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[#0B2545] truncate">
                      Utilisateur
                    </p>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {formatMessageDate(conv.last_message_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-[#0B2545] font-semibold' : 'text-[#4B5563]'}`}>
                      {isLastFromMe && (
                        <span className="inline-flex items-center mr-1">
                          {conv.last_message && conv.last_message !== "" ? (
                            <CheckCheck className="w-3 h-3 text-[#D08B3D]" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )}
                        </span>
                      )}
                      {conv.last_message || 'Aucun message'}
                    </p>
                    
                    {unreadCount > 0 && (
                      <Badge className="bg-[#D08B3D] text-white border-0 flex-shrink-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {conv.conversation_type === 'client_barber' ? 'Barbier' :
                       conv.conversation_type === 'client_vendor' ? 'Vendeur' :
                       'Support'}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}>
                      <Pin className="w-4 h-4 mr-2" />
                      {isPinned ? 'Désépingler' : 'Épingler'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(conv.id); }}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.button>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}