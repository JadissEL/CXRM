import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  Paperclip,
  Send,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react';

export default function MessageInput({ 
  onSendMessage, 
  onStartTyping, 
  onStopTyping,
  disabled 
}) {
  const [messageText, setMessageText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const handleTextChange = (e) => {
    setMessageText(e.target.value);

    // Indicateur de saisie
    if (onStartTyping) {
      onStartTyping();
    }

    // Arrêter l'indicateur après 2 secondes d'inactivité
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      if (onStopTyping) {
        onStopTyping();
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!messageText.trim() && !selectedFile) return;
    if (disabled) return;

    let attachmentUrl = null;
    let messageType = 'text';
    let attachmentName = null;
    let attachmentSize = null;

    // Upload du fichier si présent
    if (selectedFile) {
      setUploadingFile(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ 
          file: selectedFile.file 
        });
        attachmentUrl = file_url;
        attachmentName = selectedFile.name;
        attachmentSize = selectedFile.size;
        messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      } catch (error) {
        console.error('Upload error:', error);
        alert('Erreur lors de l\'upload du fichier');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    await onSendMessage(
      messageText.trim() || `[${selectedFile?.name || 'Fichier'}]`,
      messageType,
      attachmentUrl,
      attachmentName,
      attachmentSize
    );

    setMessageText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onStopTyping) {
      onStopTyping();
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-[#F7F8FA] rounded-[10px] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D08B3D]/10 rounded-[10px] flex items-center justify-center flex-shrink-0">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-5 h-5 text-[#D08B3D]" />
            ) : (
              <Paperclip className="w-5 h-5 text-[#D08B3D]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#0B2545] truncate">{selectedFile.name}</p>
            <p className="text-xs text-[#4B5563]">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            disabled={uploadingFile}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || uploadingFile}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingFile}
          className="text-slate-600 hover:bg-slate-100 flex-shrink-0"
        >
          {uploadingFile ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </Button>

        <Input
          value={messageText}
          onChange={handleTextChange}
          placeholder="Écrivez votre message..."
          className="flex-1 border-slate-200 rounded-[10px] focus:ring-2 focus:ring-[#D08B3D] focus:border-[#D08B3D]"
          disabled={disabled || uploadingFile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <Button
          type="submit"
          disabled={(!messageText.trim() && !selectedFile) || disabled || uploadingFile}
          className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white flex-shrink-0 rounded-[10px] min-h-[44px]"
        >
          {uploadingFile ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>

      <p className="text-xs text-slate-500 mt-2 text-center">
        Appuyez sur Entrée pour envoyer • Maj+Entrée pour un saut de ligne
      </p>
    </div>
  );
}