import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  Scissors,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'haircut', label: 'Coupe de cheveux', emoji: '✂️' },
  { value: 'beard', label: 'Barbe', emoji: '🧔' },
  { value: 'shave', label: 'Rasage', emoji: '🪒' },
  { value: 'styling', label: 'Coiffage', emoji: '💇' },
  { value: 'treatment', label: 'Soins', emoji: '💆' },
  { value: 'package', label: 'Forfait', emoji: '📦' }
];

export default function ServiceManager({ barberId, services }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    category: 'haircut',
    is_active: true
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create({ ...data, barber_id: barberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setDeleteConfirm(null);
    }
  });

  const openCreateDialog = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '30',
      category: 'haircut',
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      is_active: service.is_active
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration)
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || { label: category, emoji: '✨' };
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Mes Services</h2>
          <p className="text-[#4B5563]">Gérez vos prestations et tarifs</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Service
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {services.map((service, index) => {
            const categoryInfo = getCategoryInfo(service.category);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`rounded-[12px] border-2 transition-all hover:shadow-lg ${
                  service.is_active ? 'border-slate-200 hover:border-[#D08B3D]' : 'border-slate-100 opacity-60'
                }`}>
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{categoryInfo.emoji}</span>
                        <div>
                          <h3 className="font-bold text-[#0B2545]">{service.name}</h3>
                          <Badge variant="outline" className="text-xs mt-1 border-[#4B5563] text-[#4B5563]">
                            {categoryInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={service.is_active ? 'bg-[#1E7A4B]/20 text-[#1E7A4B]' : 'bg-[#D6454A]/20 text-[#D6454A]'}>
                        {service.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#F7F8FA] rounded-[10px] p-3">
                        <div className="flex items-center gap-2 text-[#4B5563] mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Prix</span>
                        </div>
                        <p className="text-xl font-bold text-[#D08B3D]">{service.price}€</p>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-[10px] p-3">
                        <div className="flex items-center gap-2 text-[#4B5563] mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">Durée</span>
                        </div>
                        <p className="text-xl font-bold text-[#0B2545]">{service.duration} min</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-[8px] border-slate-200 min-h-[44px]"
                        onClick={() => openEditDialog(service)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#D6454A] border-[#D6454A] hover:bg-[#D6454A]/10 rounded-[8px] min-h-[44px]"
                        onClick={() => setDeleteConfirm(service)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {services.length === 0 && (
          <Card className="col-span-full rounded-[12px] border-2 border-dashed border-slate-300">
            <CardContent className="p-12 text-center">
              <Scissors className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0B2545] mb-2">
                Aucun service
              </h3>
              <p className="text-[#4B5563] mb-4">
                Créez votre premier service pour commencer à recevoir des réservations
              </p>
              <Button onClick={openCreateDialog} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                Créer un Service
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Modifier le Service' : 'Nouveau Service'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du service *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Coupe homme classique"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="25.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Durée (minutes) *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 75, 90, 120].map((dur) => (
                      <SelectItem key={dur} value={dur.toString()}>
                        {dur} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="is_active">Service actif</Label>
                <p className="text-sm text-slate-500">
                  Désactivez pour masquer ce service
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingService ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteConfirm?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              className="bg-[#D6454A] hover:bg-[#D6454A]/90 rounded-[10px]"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}