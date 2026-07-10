import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Gift, Plus, Pencil, Trash2, Star, Users, Award, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const rewardTypes = [
  { value: 'discount_percent', label: '% de réduction', icon: '🏷️' },
  { value: 'discount_fixed', label: 'Réduction fixe (€)', icon: '💰' },
  { value: 'free_service', label: 'Service gratuit', icon: '✂️' },
  { value: 'free_product', label: 'Produit gratuit', icon: '🎁' }
];

export default function LoyaltyManager({ barberId }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', points_per_euro: 1, reward_type: 'discount_percent',
    reward_value: 10, points_required: 100, is_active: true
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['loyalty-programs', barberId],
    queryFn: () => base44.entities.LoyaltyProgram.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const { data: clientLoyalties = [] } = useQuery({
    queryKey: ['client-loyalties', barberId],
    queryFn: () => base44.entities.ClientLoyalty.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LoyaltyProgram.create({ ...data, barber_id: barberId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] }); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LoyaltyProgram.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] }); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyProgram.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] })
  });

  const closeDialog = () => { setIsDialogOpen(false); setEditingProgram(null); };

  const openCreate = () => {
    setEditingProgram(null);
    setFormData({ name: '', description: '', points_per_euro: 1, reward_type: 'discount_percent', reward_value: 10, points_required: 100, is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (program) => {
    setEditingProgram(program);
    setFormData({ ...program });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editingProgram ? updateMutation.mutate({ id: editingProgram.id, data: formData }) : createMutation.mutate(formData);
  };

  const totalPoints = clientLoyalties.reduce((sum, cl) => sum + cl.total_points, 0);
  const totalMembers = clientLoyalties.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Programme de Fidélité</h2>
          <p className="text-[#4B5563]">Récompensez vos clients réguliers</p>
        </div>
        <Button onClick={openCreate} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" />Nouveau Programme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-[#0B2545] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#0B2545]">{totalMembers}</p>
            <p className="text-sm text-[#4B5563]">Membres</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-[#D08B3D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#0B2545]">{totalPoints}</p>
            <p className="text-sm text-[#4B5563]">Points Distribués</p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-2 border-slate-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-[#D08B3D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#0B2545]">{programs.filter(p => p.is_active).length}</p>
            <p className="text-sm text-[#4B5563]">Programmes Actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <div className="grid md:grid-cols-2 gap-6">
        {programs.map((program, index) => {
          const rewardType = rewardTypes.find(r => r.value === program.reward_type);
          return (
            <motion.div key={program.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={`rounded-[12px] border-2 ${program.is_active ? 'border-[#D08B3D] bg-[#D08B3D]/5' : 'border-slate-200 opacity-60'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-purple-600" />
                      <span>{program.name}</span>
                    </div>
                    <Badge className={program.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                      {program.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">{program.description}</p>
                  <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Points par €</span>
                      <span className="font-semibold">{program.points_per_euro} pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Points requis</span>
                      <span className="font-semibold">{program.points_required} pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Récompense</span>
                      <span className="font-semibold">{rewardType?.icon} {program.reward_value}{program.reward_type.includes('percent') ? '%' : '€'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-[8px] border-slate-200 min-h-[44px]" onClick={() => openEdit(program)}>
                      <Pencil className="w-3 h-3 mr-1" />Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-[#D6454A] border-[#D6454A] rounded-[8px] min-h-[44px]" onClick={() => deleteMutation.mutate(program.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {programs.length === 0 && (
          <Card className="col-span-2 rounded-[12px] border-2 border-dashed border-slate-300">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0B2545] mb-2">Aucun programme</h3>
              <p className="text-[#4B5563] mb-4">Créez votre premier programme de fidélité</p>
              <Button onClick={openCreate} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />Créer un Programme
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProgram ? 'Modifier' : 'Créer'} un Programme</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nom *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Points par €</Label><Input type="number" min="1" value={formData.points_per_euro} onChange={(e) => setFormData({...formData, points_per_euro: parseInt(e.target.value) || 1})} /></div>
              <div><Label>Points requis</Label><Input type="number" min="1" value={formData.points_required} onChange={(e) => setFormData({...formData, points_required: parseInt(e.target.value) || 100})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type de récompense</Label>
                <Select value={formData.reward_type} onValueChange={(v) => setFormData({...formData, reward_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{rewardTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.icon} {r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valeur</Label><Input type="number" min="1" value={formData.reward_value} onChange={(e) => setFormData({...formData, reward_value: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Programme actif</Label>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProgram ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}