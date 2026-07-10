import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Users, Search, Star, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const hairTypes = [
  { value: 'straight', label: 'Lisses', emoji: '💇' },
  { value: 'wavy', label: 'Ondulés', emoji: '🌊' },
  { value: 'curly', label: 'Bouclés', emoji: '🔄' },
  { value: 'coily', label: 'Crépus', emoji: '⭕' }
];

const commPrefs = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'none', label: 'Aucune' }
];

export default function ClientCRM({ barberId }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: clientProfiles = [] } = useQuery({
    queryKey: ['client-profiles', barberId],
    queryFn: () => base44.entities.ClientProfile.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['crm-bookings', barberId],
    queryFn: () => base44.entities.Booking.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: loyalties = [] } = useQuery({
    queryKey: ['client-loyalties', barberId],
    queryFn: () => base44.entities.ClientLoyalty.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientProfile.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client-profiles'] }); setIsEditOpen(false); }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientProfile.create({ ...data, barber_id: barberId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client-profiles'] }); setIsEditOpen(false); }
  });

  // Get unique clients from bookings
  const clientIds = [...new Set(bookings.map(b => b.client_id))];
  const clients = clientIds.map(clientId => {
    const user = allUsers.find(u => u.id === clientId);
    const profile = clientProfiles.find(p => p.client_id === clientId);
    const clientBookings = bookings.filter(b => b.client_id === clientId);
    const loyalty = loyalties.find(l => l.client_id === clientId);
    return {
      id: clientId,
      user,
      profile,
      bookings: clientBookings,
      loyalty,
      totalSpent: clientBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0),
      visitCount: clientBookings.filter(b => b.status === 'completed').length,
      lastVisit: clientBookings.filter(b => b.status === 'completed').sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))[0]
    };
  }).filter(c => c.user);

  const filteredClients = clients.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.user?.full_name?.toLowerCase().includes(query) || c.user?.email?.toLowerCase().includes(query);
  });

  const openClientDetails = (client) => setSelectedClient(client);

  const openEdit = (client) => {
    setFormData({
      client_id: client.id,
      hair_type: client.profile?.hair_type || '',
      preferred_styles: (client.profile?.preferred_styles || []).join(', '),
      allergies: client.profile?.allergies || '',
      notes: client.profile?.notes || '',
      preferred_products: (client.profile?.preferred_products || []).join(', '),
      communication_preference: client.profile?.communication_preference || 'email',
      birthday: client.profile?.birthday || '',
      tags: (client.profile?.tags || []).join(', ')
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      preferred_styles: formData.preferred_styles.split(',').map(s => s.trim()).filter(s => s),
      preferred_products: formData.preferred_products.split(',').map(s => s.trim()).filter(s => s),
      tags: formData.tags.split(',').map(s => s.trim()).filter(s => s)
    };
    const existing = clientProfiles.find(p => p.client_id === formData.client_id);
    existing ? updateMutation.mutate({ id: existing.id, data }) : createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">CRM Clients</h2>
          <p className="text-[#4B5563]">Suivez les préférences et l'historique de vos clients</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2 border-[#0B2545] text-[#0B2545]">
          <Users className="w-5 h-5 mr-2" />{clients.length} clients
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input placeholder="Rechercher un client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClients.map((client, index) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] hover:shadow-lg transition-all cursor-pointer" onClick={() => openClientDetails(client)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={client.user?.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        {client.user?.full_name?.[0] || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{client.user?.full_name || 'Client'}</p>
                      <p className="text-sm text-slate-500 truncate">{client.user?.email}</p>
                    </div>
                    {client.loyalty && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <Star className="w-3 h-3 mr-1" />{client.loyalty.total_points} pts
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-slate-500">Visites</p>
                      <p className="font-semibold">{client.visitCount}</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-slate-500">Total</p>
                      <p className="font-semibold">{client.totalSpent.toFixed(0)}€</p>
                    </div>
                  </div>
                  {client.profile?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {client.profile.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Client Details Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedClient.user?.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {selectedClient.user?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedClient.user?.full_name}</p>
                    <p className="text-sm font-normal text-slate-500">{selectedClient.user?.email}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedClient.visitCount}</p>
                    <p className="text-xs text-blue-600">Visites</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedClient.totalSpent.toFixed(0)}€</p>
                    <p className="text-xs text-green-600">Dépensé</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedClient.loyalty?.total_points || 0}</p>
                    <p className="text-xs text-purple-600">Points</p>
                  </div>
                </div>

                {/* Profile Info */}
                {selectedClient.profile && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Préférences</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {selectedClient.profile.hair_type && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Type de cheveux</span>
                          <span>{hairTypes.find(h => h.value === selectedClient.profile.hair_type)?.label}</span>
                        </div>
                      )}
                      {selectedClient.profile.preferred_styles?.length > 0 && (
                        <div>
                          <span className="text-slate-500">Styles préférés</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedClient.profile.preferred_styles.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {selectedClient.profile.allergies && (
                        <div className="bg-red-50 p-2 rounded flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700">{selectedClient.profile.allergies}</span>
                        </div>
                      )}
                      {selectedClient.profile.notes && (
                        <div>
                          <span className="text-slate-500">Notes</span>
                          <p className="mt-1 text-slate-700">{selectedClient.profile.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Visits */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Dernières Visites</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedClient.bookings.filter(b => b.status === 'completed').slice(0, 5).map(b => (
                        <div key={b.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                          <span>{format(new Date(b.booking_date), 'd MMM yyyy', { locale: fr })}</span>
                          <span className="font-semibold">{b.total_price}€</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={() => openEdit(selectedClient)} className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                  Modifier les Préférences
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Préférences Client</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Type de cheveux</Label>
              <Select value={formData.hair_type} onValueChange={(v) => setFormData({...formData, hair_type: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{hairTypes.map(h => <SelectItem key={h.value} value={h.value}>{h.emoji} {h.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Styles préférés (séparés par virgule)</Label>
              <Input value={formData.preferred_styles} onChange={(e) => setFormData({...formData, preferred_styles: e.target.value})} placeholder="Fade, Pompadour" />
            </div>
            <div><Label>Allergies / Sensibilités</Label>
              <Input value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} placeholder="Ex: Parfum, latex" />
            </div>
            <div><Label>Notes personnelles</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Préférences particulières..." />
            </div>
            <div><Label>Tags (séparés par virgule)</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="VIP, Fidèle, Entreprise" />
            </div>
            <div><Label>Préférence de communication</Label>
              <Select value={formData.communication_preference} onValueChange={(v) => setFormData({...formData, communication_preference: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{commPrefs.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date d'anniversaire</Label>
              <Input type="date" value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(updateMutation.isPending || createMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}