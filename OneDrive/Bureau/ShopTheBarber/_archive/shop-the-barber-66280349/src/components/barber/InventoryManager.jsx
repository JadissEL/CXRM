import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, Loader2, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'hair_care', label: 'Soins Cheveux', emoji: '💇' },
  { value: 'beard_care', label: 'Soins Barbe', emoji: '🧔' },
  { value: 'styling', label: 'Coiffage', emoji: '✨' },
  { value: 'tools', label: 'Outils', emoji: '✂️' },
  { value: 'consumables', label: 'Consommables', emoji: '📦' },
  { value: 'other', label: 'Autre', emoji: '🏷️' }
];

export default function InventoryManager({ barberId }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    product_name: '', brand: '', category: 'hair_care', sku: '',
    quantity: 0, min_quantity: 5, purchase_price: '', sell_price: '', supplier: ''
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['salon-inventory', barberId],
    queryFn: () => base44.entities.SalonInventory.filter({ barber_id: barberId }),
    enabled: !!barberId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalonInventory.create({ ...data, barber_id: barberId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salon-inventory'] }); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalonInventory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salon-inventory'] }); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SalonInventory.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salon-inventory'] }); setDeleteItem(null); }
  });

  const closeDialog = () => { setIsDialogOpen(false); setEditingItem(null); };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ product_name: '', brand: '', category: 'hair_care', sku: '', quantity: 0, min_quantity: 5, purchase_price: '', sell_price: '', supplier: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item, purchase_price: item.purchase_price?.toString() || '', sell_price: item.sell_price?.toString() || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, purchase_price: parseFloat(formData.purchase_price) || 0, sell_price: parseFloat(formData.sell_price) || 0 };
    editingItem ? updateMutation.mutate({ id: editingItem.id, data }) : createMutation.mutate(data);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.purchase_price || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-200">
          <CardContent className="p-4">
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{inventory.length}</p>
            <p className="text-sm text-slate-600">Produits</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-200">
          <CardContent className="p-4">
            <TrendingDown className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold">{lowStockItems.length}</p>
            <p className="text-sm text-slate-600">Stock Bas</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-200 col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Valeur Stock</p>
            <p className="text-2xl font-bold">{totalValue.toFixed(2)}€</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Alertes Stock Bas ({lowStockItems.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <Badge key={item.id} variant="outline" className="bg-white">
                {item.product_name} ({item.quantity} restants)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Ajouter
        </Button>
      </div>

      {/* Inventory Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredInventory.map((item, index) => {
            const cat = categories.find(c => c.value === item.category);
            const isLowStock = item.quantity <= item.min_quantity;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={`border-2 ${isLowStock ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat?.emoji}</span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <p className="text-xs text-slate-500">{item.brand}</p>
                        </div>
                      </div>
                      {isLowStock && <Badge className="bg-amber-500 text-white">Stock Bas</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-slate-500">Stock:</span> <strong>{item.quantity}</strong></div>
                      <div><span className="text-slate-500">Min:</span> {item.min_quantity}</div>
                      <div><span className="text-slate-500">Achat:</span> {item.purchase_price}€</div>
                      <div><span className="text-slate-500">Vente:</span> {item.sell_price}€</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}><Pencil className="w-3 h-3 mr-1" />Modifier</Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteItem(item)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un Produit</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nom *</Label><Input value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} required /></div>
              <div><Label>Marque</Label><Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Catégorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>SKU</Label><Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantité</Label><Input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} /></div>
              <div><Label>Seuil Alerte</Label><Input type="number" min="0" value={formData.min_quantity} onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prix Achat (€)</Label><Input type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({...formData, purchase_price: e.target.value})} /></div>
              <div><Label>Prix Vente (€)</Label><Input type="number" step="0.01" value={formData.sell_price} onChange={(e) => setFormData({...formData, sell_price: e.target.value})} /></div>
            </div>
            <div><Label>Fournisseur</Label><Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>"{deleteItem?.product_name}" sera supprimé de votre inventaire.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteItem.id)} className="bg-red-600">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}