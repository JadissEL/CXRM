import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  Upload,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReturnRequestForm({ order, onSuccess, onCancel }) {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [detailedReason, setDetailedReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'defective', label: 'Produit défectueux', icon: '🔧' },
    { value: 'wrong_item', label: 'Mauvais article reçu', icon: '📦' },
    { value: 'not_as_described', label: 'Ne correspond pas à la description', icon: '📝' },
    { value: 'damaged', label: 'Produit endommagé', icon: '💔' },
    { value: 'no_longer_needed', label: 'Plus besoin', icon: '🤷' },
    { value: 'other', label: 'Autre raison', icon: '💬' }
  ];

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.product_id === item.product_id);
      if (exists) {
        return prev.filter(i => i.product_id !== item.product_id);
      }
      return [...prev, { ...item, quantity: item.quantity }];
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 photos autorisées');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setImages([...images, ...uploadedUrls]);
    } catch (err) {
      setError('Erreur lors du téléchargement des images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const createReturnMutation = useMutation({
    mutationFn: async (returnData) => {
      const user = await base44.auth.me();
      return await base44.entities.Return.create({
        ...returnData,
        client_id: user.id
      });
    },
    onSuccess: async (returnRequest) => {
      const user = await base44.auth.me();
      
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'order',
        title: 'Demande de retour créée',
        message: `Votre demande de retour pour la commande #${order.id.slice(0, 8)} a été enregistrée. Nous vous contacterons sous 24-48h.`,
        link: `/OrderTracking?orderId=${order.id}`,
        priority: 'medium'
      });

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Demande de retour - Commande #${order.id.slice(0, 8)}`,
        body: `
          Bonjour,
          
          Votre demande de retour a été enregistrée avec succès.
          
          Numéro de commande: ${order.id}
          Articles à retourner: ${selectedItems.length}
          
          Nous traiterons votre demande dans les 24-48 heures.
          Vous recevrez une étiquette de retour par email.
          
          Cordialement,
          L'équipe ShopTheBarber
        `
      });

      queryClient.invalidateQueries({ queryKey: ['returns'] });
      onSuccess(returnRequest);
    },
    onError: (err) => {
      setError('Erreur lors de la création de la demande de retour');
    }
  });

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      setError('Veuillez sélectionner au moins un article');
      return;
    }

    if (!reason) {
      setError('Veuillez sélectionner une raison');
      return;
    }

    if (!detailedReason.trim()) {
      setError('Veuillez décrire votre problème');
      return;
    }

    const returnData = {
      order_id: order.id,
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        reason: detailedReason
      })),
      reason,
      detailed_reason: detailedReason,
      images,
      refund_method: refundMethod
    };

    createReturnMutation.mutate(returnData);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[12px] border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[#0B2545]">
            <RotateCcw className="w-6 h-6 text-[#D08B3D]" />
            Demande de retour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="bg-[#D6454A]/10 border-[#D6454A] rounded-[10px]">
              <AlertCircle className="h-4 w-4 text-[#D6454A]" />
              <AlertDescription className="text-[#D6454A]">{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Articles à retourner *
            </Label>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <Card
                  key={idx}
                  className={`rounded-[10px] p-4 cursor-pointer transition-all ${
                    selectedItems.find(i => i.product_id === item.product_id)
                      ? 'border-2 border-[#D08B3D] bg-[#D08B3D]/5'
                      : 'border-2 border-slate-200 hover:border-[#D08B3D]'
                  }`}
                  onClick={() => handleItemToggle(item)}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={!!selectedItems.find(i => i.product_id === item.product_id)}
                      onCheckedChange={() => handleItemToggle(item)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#0B2545]">{item.name}</p>
                      <p className="text-sm text-[#4B5563]">
                        Quantité: {item.quantity} • Prix: {item.price}€
                      </p>
                    </div>
                    {selectedItems.find(i => i.product_id === item.product_id) && (
                      <CheckCircle className="w-5 h-5 text-[#D08B3D]" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Raison du retour *
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="grid md:grid-cols-2 gap-3">
                {reasons.map((r) => (
                  <Card
                    key={r.value}
                    className={`rounded-[10px] p-4 cursor-pointer transition-all ${
                      reason === r.value
                        ? 'border-2 border-[#D08B3D] bg-[#D08B3D]/5'
                        : 'border-2 border-slate-200 hover:border-[#D08B3D]'
                    }`}
                    onClick={() => setReason(r.value)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={r.value} id={r.value} />
                      <Label htmlFor={r.value} className="flex items-center gap-2 cursor-pointer flex-1">
                        <span className="text-2xl">{r.icon}</span>
                        <span className="text-sm font-semibold">{r.label}</span>
                      </Label>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-2 block">
              Décrivez votre problème *
            </Label>
            <Textarea
              placeholder="Expliquez en détail la raison de votre retour..."
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold mb-2 block">
              Photos (optionnel, max 5)
            </Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg border-2 border-slate-300 transition-colors">
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {uploading ? 'Téléchargement...' : 'Ajouter des photos'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading || images.length >= 5}
                  />
                </label>
                <span className="text-sm text-slate-600">
                  {images.length}/5 photos
                </span>
              </div>

              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {images.map((url, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 group"
                      >
                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Méthode de remboursement
            </Label>
            <RadioGroup value={refundMethod} onValueChange={setRefundMethod}>
              <Card
                className={`rounded-[10px] p-4 cursor-pointer mb-3 ${refundMethod === 'original_payment' ? 'border-2 border-[#D08B3D] bg-[#D08B3D]/5' : 'border-2 border-slate-200'}`}
                onClick={() => setRefundMethod('original_payment')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="original_payment" id="original_payment" />
                  <Label htmlFor="original_payment" className="cursor-pointer flex-1">
                    <p className="font-semibold text-[#0B2545]">Remboursement sur le moyen de paiement original</p>
                    <p className="text-sm text-[#4B5563]">Le montant sera crédité sous 5-10 jours ouvrables</p>
                  </Label>
                </div>
              </Card>

              <Card
                className={`rounded-[10px] p-4 cursor-pointer ${refundMethod === 'store_credit' ? 'border-2 border-[#D08B3D] bg-[#D08B3D]/5' : 'border-2 border-slate-200'}`}
                onClick={() => setRefundMethod('store_credit')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="store_credit" id="store_credit" />
                  <Label htmlFor="store_credit" className="cursor-pointer flex-1">
                    <p className="font-semibold text-[#0B2545]">Crédit boutique</p>
                    <p className="text-sm text-[#4B5563]">Disponible immédiatement après réception</p>
                    <Badge className="mt-2 bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">
                      +10% de bonus
                    </Badge>
                  </Label>
                </div>
              </Card>
            </RadioGroup>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-[10px] min-h-[44px]"
              disabled={createReturnMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReturnMutation.isPending}
              className="flex-1 bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
            >
              {createReturnMutation.isPending ? (
                'Envoi en cours...'
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Soumettre la demande
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}