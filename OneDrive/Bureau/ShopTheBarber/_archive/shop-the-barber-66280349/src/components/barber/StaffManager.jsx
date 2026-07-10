import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Users, Pencil, Trash2, Shield, Crown, Scissors, UserPlus, Loader2, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import StaffScheduleManager from './StaffScheduleManager';
import StaffPerformance from './StaffPerformance';

const roles = [
  { value: 'owner', label: 'Propriétaire', icon: Crown, color: 'bg-yellow-500' },
  { value: 'manager', label: 'Manager', icon: Shield, color: 'bg-purple-500' },
  { value: 'barber', label: 'Barbier', icon: Scissors, color: 'bg-blue-500' },
  { value: 'assistant', label: 'Assistant', icon: Users, color: 'bg-green-500' }
];

const allPermissions = [
  { key: 'bookings', label: 'Gérer les réservations' },
  { key: 'services', label: 'Modifier les services' },
  { key: 'inventory', label: 'Gérer l\'inventaire' },
  { key: 'clients', label: 'Voir les clients' },
  { key: 'analytics', label: 'Voir les analytics' },
  { key: 'staff', label: 'Gérer l\'équipe' },
  { key: 'settings', label: 'Paramètres du salon' }
];

export default function StaffManager({ barberId, bookings = [], services = [] }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    user_email: '', role: 'barber', permissions: ['bookings', 'clients'],
    commission_rate: 0, specialties: '', is_active: true
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['salon-staff', barberId],
    queryFn: () => base44.entities.SalonStaff.filter({ salon_id: barberId }),
    enabled: !!barberId
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = allUsers.find(u => u.email === data.user_email);
      if (!user) throw new Error('Utilisateur non trouvé');
      return base44.entities.SalonStaff.create({
        salon_id: barberId, user_id: user.id, role: data.role,
        permissions: data.permissions, commission_rate: data.commission_rate,
        specialties: data.specialties.split(',').map(s => s.trim()).filter(s => s),
        is_active: data.is_active
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salon-staff'] }); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalonStaff.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salon-staff'] }); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SalonStaff.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salon-staff'] })
  });

  const closeDialog = () => { setIsDialogOpen(false); setEditingStaff(null); };

  const openCreate = () => {
    setEditingStaff(null);
    setFormData({ user_email: '', role: 'barber', permissions: ['bookings', 'clients'], commission_rate: 0, specialties: '', is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (member) => {
    const user = allUsers.find(u => u.id === member.user_id);
    setEditingStaff(member);
    setFormData({
      user_email: user?.email || '', role: member.role,
      permissions: member.permissions || [], commission_rate: member.commission_rate || 0,
      specialties: (member.specialties || []).join(', '), is_active: member.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id,
        data: {
          role: formData.role, permissions: formData.permissions,
          commission_rate: formData.commission_rate,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
          is_active: formData.is_active
        }
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Équipe du Salon</h2>
          <p className="text-[#4B5563]">Gérez les membres, horaires et performances</p>
        </div>
        <Button onClick={openCreate} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
          <UserPlus className="w-4 h-4 mr-2" />Ajouter un Membre
        </Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" />Membres</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="w-4 h-4 mr-2" />Planning</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="w-4 h-4 mr-2" />Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {/* Staff Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, index) => {
          const user = allUsers.find(u => u.id === member.user_id);
          const roleInfo = roles.find(r => r.value === member.role);
          const RoleIcon = roleInfo?.icon || Users;
          return (
            <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={`rounded-[12px] border-2 ${member.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={user?.profile_image} />
                      <AvatarFallback className={`${roleInfo?.color} text-white`}>
                        {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{user?.full_name || 'Utilisateur'}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                      <Badge className={`mt-1 ${roleInfo?.color} text-white`}>
                        <RoleIcon className="w-3 h-3 mr-1" />{roleInfo?.label}
                      </Badge>
                    </div>
                  </div>

                  {member.specialties?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Spécialités</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.commission_rate > 0 && (
                    <p className="text-sm text-slate-600 mb-4">Commission: <strong>{member.commission_rate}%</strong></p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-[8px] border-slate-200 min-h-[44px]" onClick={() => openEdit(member)}>
                      <Pencil className="w-3 h-3 mr-1" />Modifier
                    </Button>
                    {member.role !== 'owner' && (
                      <Button variant="outline" size="sm" className="text-[#D6454A] border-[#D6454A] rounded-[8px] min-h-[44px]" onClick={() => deleteMutation.mutate(member.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

            {staff.length === 0 && (
              <Card className="col-span-full rounded-[12px] border-2 border-dashed border-slate-300">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#0B2545] mb-2">Aucun membre</h3>
                  <p className="text-[#4B5563] mb-4">Ajoutez des membres à votre équipe</p>
                  <Button onClick={openCreate} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                    <UserPlus className="w-4 h-4 mr-2" />Ajouter
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <StaffScheduleManager barberId={barberId} staff={staff} users={allUsers} />
        </TabsContent>

        <TabsContent value="performance">
          <StaffPerformance barberId={barberId} staff={staff} users={allUsers} bookings={bookings} services={services} />
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingStaff ? 'Modifier' : 'Ajouter'} un Membre</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingStaff && (
              <div><Label>Email de l'utilisateur *</Label>
                <Input type="email" value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} placeholder="email@example.com" required />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Rôle</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Commission (%)</Label>
                <Input type="number" min="0" max="100" value={formData.commission_rate} onChange={(e) => setFormData({...formData, commission_rate: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div><Label>Spécialités (séparées par virgule)</Label>
              <Input value={formData.specialties} onChange={(e) => setFormData({...formData, specialties: e.target.value})} placeholder="Fade, Barbe, Coloration" />
            </div>
            <div>
              <Label className="mb-3 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <div key={p.key} className="flex items-center gap-2">
                    <Checkbox checked={formData.permissions.includes(p.key)} onCheckedChange={() => togglePermission(p.key)} />
                    <span className="text-sm">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Membre actif</Label>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingStaff ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}