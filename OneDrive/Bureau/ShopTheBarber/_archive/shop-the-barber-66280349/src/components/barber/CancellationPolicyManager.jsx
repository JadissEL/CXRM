import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Pencil, Trash2, Clock, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancellationPolicyManager({ barberId }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', hours_before: 24, cancellation_fee_type: 'percentage', cancellation_fee_value: 50,
    no_show_fee_type: 'percentage', no_show_fee_value: 100, deposit_required: false, deposit_percentage: 30, is_active: true
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['cancellation-policies', barberId],
    queryFn: () => base44.entities.CancellationPolicy.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CancellationPolicy.create({ ...data, barber_id: barberId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] }); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CancellationPolicy.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] }); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CancellationPolicy.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] })
  });

  const closeDialog = () => { setIsDialogOpen(false); setEditing(null); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', hours_before: 24, cancellation_fee_type: 'percentage', cancellation_fee_value: 50, no_show_fee_type: 'percentage', no_show_fee_value: 100, deposit_required: false, deposit_percentage: 30, is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (policy) => { setEditing(policy); setForm({ ...policy }); setIsDialogOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Politiques d'Annulation</h2>
          <p className="text-slate-600">Définissez vos conditions et frais d'annulation</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Nouvelle Politique
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {policies.map((policy, i) => (
          <motion.div key={policy.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`border-2 ${policy.is_active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 opacity-60'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>{policy.name}</span>
                  </div>
                  <Badge className={policy.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100'}>{policy.is_active ? 'Active' : 'Inactive'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Annulation gratuite jusqu'à <strong>{policy.hours_before}h</strong> avant</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Frais annulation: <strong>{policy.cancellation_fee_value}{policy.cancellation_fee_type === 'percentage' ? '%' : '€'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Absence: <strong>{policy.no_show_fee_value}{policy.no_show_fee_type === 'percentage' ? '%' : '€'}</strong></span>
                  </div>
                  {policy.deposit_required && (
                    <div className="bg-white rounded p-2">
                      <span className="text-slate-700">Acompte requis: <strong>{policy.deposit_percentage}%</strong></span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(policy)}>
                    <Pencil className="w-3 h-3 mr-1" />Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteMutation.mutate(policy.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Créer'} une Politique</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Heures avant RDV pour annulation gratuite</Label>
              <Input type="number" min="0" value={form.hours_before} onChange={(e) => setForm({...form, hours_before: parseInt(e.target.value) || 0})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type frais annulation</Label>
                <Select value={form.cancellation_fee_type} onValueChange={(v) => setForm({...form, cancellation_fee_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valeur</Label><Input type="number" min="0" value={form.cancellation_fee_value} onChange={(e) => setForm({...form, cancellation_fee_value: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type frais absence</Label>
                <Select value={form.no_show_fee_type} onValueChange={(v) => setForm({...form, no_show_fee_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valeur</Label><Input type="number" min="0" value={form.no_show_fee_value} onChange={(e) => setForm({...form, no_show_fee_value: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div><Label>Acompte requis</Label><p className="text-xs text-slate-500">Exiger un paiement anticipé</p></div>
              <Switch checked={form.deposit_required} onCheckedChange={(c) => setForm({...form, deposit_required: c})} />
            </div>
            {form.deposit_required && (
              <div><Label>Pourcentage d'acompte</Label><Input type="number" min="0" max="100" value={form.deposit_percentage} onChange={(e) => setForm({...form, deposit_percentage: parseInt(e.target.value) || 0})} /></div>
            )}
            <div className="flex items-center justify-between py-2">
              <Label>Politique active</Label>
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm({...form, is_active: c})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}