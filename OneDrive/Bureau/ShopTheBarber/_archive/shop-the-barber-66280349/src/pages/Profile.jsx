import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, MapPin, Upload, Save, CheckCircle, Shield, Scissors, Store, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: user?.address || '',
    city: user?.city || '',
    profile_image: user?.profile_image || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => await base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_image: file_url });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: "Admin", color: "bg-[#D6454A]", icon: Shield },
      barber: { label: "Barbier", color: "bg-[#0B2545]", icon: Scissors },
      vendor: { label: "Vendeur", color: "bg-[#D08B3D]", icon: Store },
      client: { label: "Client", color: "bg-[#4B5563]", icon: LayoutDashboard }
    };
    return config[role] || config.client;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D08B3D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4B5563]">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <Card className="max-w-md w-full mx-4 rounded-[12px]">
          <CardContent className="p-12 text-center">
            <User className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Connexion requise</h2>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleConfig = getRoleBadge(user.role);

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Mon Profil</h1>
          <p className="text-[#4B5563]">Gérez vos informations personnelles</p>
        </motion.div>

        {success && (
          <Alert className="mb-6 border-[#1E7A4B] bg-[#1E7A4B]/10 rounded-[10px]">
            <CheckCircle className="h-4 w-4 text-[#1E7A4B]" />
            <AlertDescription className="text-[#1E7A4B]">Profil mis à jour avec succès !</AlertDescription>
          </Alert>
        )}

        <Card className="rounded-[12px] border-2 border-slate-200 shadow-xl">
          <CardHeader className="border-b border-slate-200 bg-[#0B2545] rounded-t-[10px]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={formData.profile_image || user.profile_image} />
                  <AvatarFallback className="bg-[#D08B3D] text-white text-2xl font-bold">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.full_name || 'Utilisateur'}</h2>
                  <p className="text-white/70">{user.email}</p>
                  <Badge className={`${roleConfig.color} text-white mt-2`}>
                    <roleConfig.icon className="w-3 h-3 mr-1" />{roleConfig.label}
                  </Badge>
                </div>
              </div>
              {!isEditing ? (
                <Button onClick={() => { setIsEditing(true); setFormData({ full_name: user.full_name || '', phone: user.phone || '', bio: user.bio || '', address: user.address || '', city: user.city || '', profile_image: user.profile_image || '' }); }} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                  Modifier le profil
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="border-white text-white hover:bg-white/10 rounded-[10px] min-h-[44px]">Annuler</Button>
                  <Button onClick={handleSubmit} disabled={updateProfileMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                    <Save className="w-4 h-4 mr-2" />{updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isEditing && (
                <div>
                  <Label className="mb-3 block text-[#0B2545]">Photo de profil</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-24 h-24 ring-2 ring-slate-200">
                      <AvatarImage src={formData.profile_image} />
                      <AvatarFallback className="bg-[#D08B3D] text-white text-3xl">{formData.full_name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <input type="file" id="profile-image" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('profile-image').click()} className="rounded-[10px] border-slate-200 min-h-[44px]">
                        <Upload className="w-4 h-4 mr-2" />{uploading ? 'Upload...' : 'Changer la photo'}
                      </Button>
                      <p className="text-xs text-[#4B5563] mt-2">JPG, PNG ou GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name" className="text-[#0B2545]"><User className="w-4 h-4 inline mr-2" />Nom complet</Label>
                  {isEditing ? (
                    <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Votre nom complet" className="mt-2 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                  ) : (
                    <p className="mt-2 text-[#0B2545] font-medium">{user.full_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#0B2545]"><Mail className="w-4 h-4 inline mr-2" />Email</Label>
                  <p className="mt-2 text-[#0B2545] font-medium">{user.email}</p>
                  <p className="text-xs text-[#4B5563] mt-1">L'email ne peut pas être modifié</p>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[#0B2545]"><Phone className="w-4 h-4 inline mr-2" />Téléphone</Label>
                  {isEditing ? (
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+33 6 12 34 56 78" className="mt-2 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                  ) : (
                    <p className="mt-2 text-[#0B2545] font-medium">{user.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city" className="text-[#0B2545]"><MapPin className="w-4 h-4 inline mr-2" />Ville</Label>
                  {isEditing ? (
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Paris" className="mt-2 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                  ) : (
                    <p className="mt-2 text-[#0B2545] font-medium">{user.city || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-[#0B2545]"><MapPin className="w-4 h-4 inline mr-2" />Adresse complète</Label>
                {isEditing ? (
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Rue de la République, 75001 Paris" className="mt-2 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                ) : (
                  <p className="mt-2 text-[#0B2545] font-medium">{user.address || '-'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bio" className="text-[#0B2545]">Biographie</Label>
                {isEditing ? (
                  <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Parlez-nous de vous..." rows={4} className="mt-2 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
                ) : (
                  <p className="mt-2 text-[#4B5563]">{user.bio || 'Aucune biographie'}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}