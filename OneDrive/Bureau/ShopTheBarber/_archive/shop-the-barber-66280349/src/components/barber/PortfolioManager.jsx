import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Trash2,
  Plus,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortfolioManager({ barberProfile }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const portfolioImages = barberProfile?.portfolio_images || [];

  const updateMutation = useMutation({
    mutationFn: (images) => base44.entities.BarberProfile.update(barberProfile.id, {
      portfolio_images: images
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
    }
  });

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newImages = [...portfolioImages];

    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newImages.push(file_url);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    await updateMutation.mutateAsync(newImages);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;
    const newImages = portfolioImages.filter((_, i) => i !== deleteIndex);
    await updateMutation.mutateAsync(newImages);
    setDeleteIndex(null);
  };

  const moveImage = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= portfolioImages.length) return;
    const newImages = [...portfolioImages];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    await updateMutation.mutateAsync(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Portfolio</h2>
          <p className="text-[#4B5563]">Montrez vos meilleures réalisations</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Upload...' : 'Ajouter des Photos'}
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {portfolioImages.map((imageUrl, index) => (
            <motion.div
              key={imageUrl}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-square rounded-[12px] overflow-hidden border-2 border-slate-200 hover:border-[#D08B3D] transition-colors"
            >
              <img
                src={imageUrl}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="text-red-600"
                  onClick={() => setDeleteIndex(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Position Badge */}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {index + 1}
              </div>

              {/* Move Arrows */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 text-xs"
                    onClick={() => moveImage(index, index - 1)}
                  >
                    ←
                  </Button>
                )}
                {index < portfolioImages.length - 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 text-xs"
                    onClick={() => moveImage(index, index + 1)}
                  >
                    →
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add New */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Plus className="w-8 h-8" />
              <span className="text-sm">Ajouter</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Empty State */}
      {portfolioImages.length === 0 && (
        <Card className="rounded-[12px] border-2 border-dashed border-slate-300">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0B2545] mb-2">
              Aucune photo dans votre portfolio
            </h3>
            <p className="text-[#4B5563] mb-4">
              Ajoutez des photos de vos réalisations pour attirer plus de clients
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
            >
              <Upload className="w-4 h-4 mr-2" />
              Télécharger des Photos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Portfolio preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette photo sera retirée de votre portfolio. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}