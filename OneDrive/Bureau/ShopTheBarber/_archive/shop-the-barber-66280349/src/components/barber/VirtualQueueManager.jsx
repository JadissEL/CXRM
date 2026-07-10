import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone, Clock, PlayCircle, CheckCircle, XCircle, Bell, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig = {
  waiting: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  called: { label: 'Appelé', color: 'bg-blue-100 text-blue-700', icon: Bell },
  serving: { label: 'En cours', color: 'bg-purple-100 text-purple-700', icon: PlayCircle },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
  no_show: { label: 'Absent', color: 'bg-slate-100 text-slate-700', icon: XCircle }
};

export default function VirtualQueueManager({ barberId, services = [] }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_name: '', client_phone: '', service_id: '', notes: '' });

  const { data: queue = [] } = useQuery({
    queryKey: ['virtual-queue', barberId],
    queryFn: () => base44.entities.VirtualQueue.filter({ barber_id: barberId }),
    enabled: !!barberId,
    refetchInterval: 5000
  });

  const activeQueue = queue.filter(q => ['waiting', 'called', 'serving'].includes(q.status))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const position = activeQueue.length + 1;
      const avgServiceTime = 30;
      return base44.entities.VirtualQueue.create({
        ...data, barber_id: barberId, position, status: 'waiting',
        estimated_wait_time: position * avgServiceTime, check_in_time: new Date().toISOString()
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['virtual-queue'] }); setIsDialogOpen(false); setForm({ client_name: '', client_phone: '', service_id: '', notes: '' }); }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const updates = { status };
      if (status === 'called') updates.called_time = new Date().toISOString();
      return base44.entities.VirtualQueue.update(id, updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['virtual-queue'] })
  });

  const getServiceName = (id) => services.find(s => s.id === id)?.name || 'Service';

  const waitingCount = activeQueue.filter(q => q.status === 'waiting').length;
  const servingCount = activeQueue.filter(q => q.status === 'serving').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">File d'Attente Virtuelle</h2>
          <p className="text-slate-600">Gérez les clients sans réservation</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <UserPlus className="w-4 h-4 mr-2" />Ajouter à la File
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{waitingCount}</p>
            <p className="text-sm text-yellow-600">En attente</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <PlayCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{servingCount}</p>
            <p className="text-sm text-purple-600">En cours</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{activeQueue.length}</p>
            <p className="text-sm text-blue-600">Total file</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <Card className="border-2 border-slate-200">
        <CardHeader><CardTitle>File d'Attente</CardTitle></CardHeader>
        <CardContent>
          {activeQueue.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun client dans la file</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activeQueue.map((item, index) => {
                  const status = statusConfig[item.status];
                  const StatusIcon = status.icon;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`p-4 rounded-lg border-2 ${item.status === 'serving' ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {item.position || index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.client_name || 'Client'}</p>
                            {item.client_phone && <p className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{item.client_phone}</p>}
                            <p className="text-xs text-slate-400">{getServiceName(item.service_id)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Badge className={status.color}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                            {item.estimated_wait_time && item.status === 'waiting' && (
                              <p className="text-xs text-slate-500 mt-1">~{item.estimated_wait_time} min</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {item.status === 'waiting' && (
                              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'called' })} className="bg-blue-600 text-white">
                                <Bell className="w-3 h-3 mr-1" />Appeler
                              </Button>
                            )}
                            {item.status === 'called' && (
                              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'serving' })} className="bg-purple-600 text-white">
                                <PlayCircle className="w-3 h-3 mr-1" />Commencer
                              </Button>
                            )}
                            {item.status === 'serving' && (
                              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'completed' })} className="bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />Terminer
                              </Button>
                            )}
                            {['waiting', 'called'].includes(item.status) && (
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cancelled' })}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Queue Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter à la File d'Attente</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div><Label>Nom du client *</Label><Input value={form.client_name} onChange={(e) => setForm({...form, client_name: e.target.value})} required /></div>
            <div><Label>Téléphone</Label><Input value={form.client_phone} onChange={(e) => setForm({...form, client_phone: e.target.value})} placeholder="+33..." /></div>
            <div><Label>Service</Label>
              <Select value={form.service_id} onValueChange={(v) => setForm({...form, service_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{services.filter(s => s.is_active).map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.price}€</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Notes optionnelles" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}