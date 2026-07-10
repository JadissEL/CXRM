import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Trash2,
  Download,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';

export default function MessageBubble({ message, isMe, otherUser, onDelete }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = () => {
    if (message.attachment_url) {
      window.open(message.attachment_url, '_blank');
    }
  };

  if (message.is_deleted) {
    return (
      <div className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 italic">
          Ce message a été supprimé
        </div>
      </div>
    );
  }

  if (message.deleted_for?.includes(message.sender_id)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 group ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isMe && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0 rounded-[10px]">
          <AvatarImage src={otherUser?.profile_image} />
          <AvatarFallback className="bg-[#0B2545] text-white text-xs rounded-[10px]">
            {otherUser?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
        <div className={`rounded-[12px] px-4 py-3 ${
          isMe 
            ? 'bg-[#0B2545] text-white rounded-br-none' 
            : 'bg-white text-[#0B2545] border border-slate-200 rounded-bl-none shadow-sm'
        }`}>
          {/* Image */}
          {message.message_type === 'image' && message.attachment_url && (
            <div className="mb-2 relative">
              {!imageLoaded && (
                <div className="w-full h-48 bg-slate-200 rounded-lg animate-pulse flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <img 
                src={message.attachment_url} 
                alt="Attachment" 
                className={`rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity ${imageLoaded ? 'block' : 'hidden'}`}
                onClick={() => window.open(message.attachment_url, '_blank')}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}

          {/* File */}
          {message.message_type === 'file' && message.attachment_url && (
            <div 
              className={`mb-2 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={downloadFile}
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                isMe ? 'bg-white/30' : 'bg-[#D08B3D]/10'
              }`}>
                <File className={`w-5 h-5 ${isMe ? 'text-white' : 'text-[#D08B3D]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>
                  {message.attachment_name || 'Fichier'}
                </p>
                {message.attachment_size && (
                  <p className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                    {formatFileSize(message.attachment_size)}
                  </p>
                )}
              </div>
              <Download className={`w-5 h-5 ${isMe ? 'text-white' : 'text-slate-600'}`} />
            </div>
          )}

          {/* Text */}
          {message.message_text && message.message_text !== '' && (
            <p className="leading-relaxed whitespace-pre-wrap break-words">
              {message.message_text}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <p className="text-xs text-slate-500">
            {format(new Date(message.created_date), 'HH:mm')}
          </p>
          {isMe && (
            <span className="text-xs">
              {message.is_read ? (
                <CheckCheck className="w-3 h-3 text-[#D08B3D]" />
              ) : (
                <Check className="w-3 h-3 text-slate-400" />
              )}
            </span>
          )}

          {/* Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isMe && (
                <DropdownMenuItem onClick={() => onDelete(message.id, true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer pour tout le monde
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(message.id, false)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer pour moi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}