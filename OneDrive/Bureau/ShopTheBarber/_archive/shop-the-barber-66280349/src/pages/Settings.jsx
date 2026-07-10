import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { User, Camera, Save, CheckCircle, Shield, Bell, Lock, AlertCircle, Moon, Sun, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Settings() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "", phone: user?.phone || "", bio: user?.bio || "", address: user?.address || "", city: user?.city || ""
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_bookings: true, email_orders: true, email_promotions: false, sms_reminders: true, push_notifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_public: true, show_email: false, show_phone: false
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shopthebarber-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shopthebarber-theme', 'light');
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => await base44.auth.updateMe(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['current-user'] }); setSuccess(true); setError(""); setTimeout(() => setSuccess(false), 3000); },
    onError: () => { setError("Erreur lors de la mise à jour. Veuillez réessayer."); setSuccess(false); }
  });

  const handleProfileUpdate = (e) => { e.preventDefault(); updateProfileMutation.mutate(profileData); };
  const handleChange = (field, value) => setProfileData(prev => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D08B3D]"></div>
      </div>
    );
  }

  if (!user) { base44.auth.redirectToLogin(); return null; }

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Paramètres</h1>
          <p className="text-[#4B5563]">Gérez vos préférences et paramètres de compte</p>
        </motion.div>

        {success && <Alert className="mb-6 bg-[#1E7A4B]/10 border-[#1E7A4B] rounded-[10px]"><CheckCircle className="h-4 w-4 text-[#1E7A4B]" /><AlertDescription className="text-[#1E7A4B]">Paramètres mis à jour avec succès !</AlertDescription></Alert>}
        {error && <Alert className="mb-6 bg-[#D6454A]/10 border-[#D6454A] rounded-[10px]"><AlertCircle className="h-4 w-4 text-[#D6454A]" /><AlertDescription className="text-[#D6454A]">{error}</AlertDescription></Alert>}

        <div className="grid lg:grid-cols-4 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <Card className="shadow-lg rounded-[12px] border-2 border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 ring-4 ring-slate-100">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-[#0B2545] text-white text-3xl font-bold">{user.full_name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#D08B3D] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-[#0B2545] mb-1">{user.full_name || "Utilisateur"}</h2>
                <p className="text-sm text-[#4B5563] mb-3">{user.email}</p>
                <Badge className="bg-[#D08B3D] text-white border-0 mb-4">{user.role === 'client' ? 'Client' : user.role === 'barber' ? 'Barbier' : user.role === 'vendor' ? 'Vendeur' : 'Admin'}</Badge>
                {user.verified && <div className="flex items-center justify-center gap-2 text-[#1E7A4B] text-sm"><Shield className="w-4 h-4" /><span className="font-medium">Vérifié</span></div>}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white dark:bg-slate-800 rounded-[10px] border-2 border-slate-200 dark:border-slate-700 p-1 w-full justify-start overflow-x-auto">
                <TabsTrigger value="profile" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"><User className="w-4 h-4 mr-2" />Profil</TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
                <TabsTrigger value="privacy" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"><Shield className="w-4 h-4 mr-2" />Confidentialité</TabsTrigger>
                <TabsTrigger value="security" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"><Lock className="w-4 h-4 mr-2" />Sécurité</TabsTrigger>
                <TabsTrigger value="appearance" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"><Palette className="w-4 h-4 mr-2" />Apparence</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="shadow-lg rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="text-[#0B2545]">Informations Personnelles</CardTitle><CardDescription className="text-[#4B5563]">Mettez à jour vos informations de profil</CardDescription></CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[#0B2545] font-medium">Nom complet *</Label>
                          <Input value={profileData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} className="rounded-[10px] border-slate-200 focus:border-[#D08B3D] focus:ring-[#D08B3D]" placeholder="Jean Dupont" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#0B2545] font-medium">Téléphone</Label>
                          <Input type="tel" value={profileData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="rounded-[10px] border-slate-200 focus:border-[#D08B3D] focus:ring-[#D08B3D]" placeholder="+33 6 12 34 56 78" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#0B2545] font-medium">Biographie</Label>
                        <Textarea value={profileData.bio} onChange={(e) => handleChange('bio', e.target.value)} className="rounded-[10px] border-slate-200 focus:border-[#D08B3D] focus:ring-[#D08B3D] min-h-[100px]" placeholder="Parlez-nous de vous..." />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[#0B2545] font-medium">Adresse</Label><Input value={profileData.address} onChange={(e) => handleChange('address', e.target.value)} className="rounded-[10px] border-slate-200 focus:border-[#D08B3D] focus:ring-[#D08B3D]" placeholder="123 Rue de la Paix" /></div>
                        <div className="space-y-2"><Label className="text-[#0B2545] font-medium">Ville</Label><Input value={profileData.city} onChange={(e) => handleChange('city', e.target.value)} className="rounded-[10px] border-slate-200 focus:border-[#D08B3D] focus:ring-[#D08B3D]" placeholder="Paris" /></div>
                      </div>
                      <Button type="submit" className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white shadow-lg h-12 rounded-[10px] min-h-[44px]" disabled={updateProfileMutation.isPending}><Save className="w-4 h-4 mr-2" />{updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="shadow-lg rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="text-[#0B2545]">Préférences de Notifications</CardTitle><CardDescription className="text-[#4B5563]">Gérez comment vous souhaitez être notifié</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0B2545]">Notifications par Email</h3>
                      {[{ key: 'email_bookings', title: 'Réservations', desc: 'Recevoir un email pour chaque réservation' }, { key: 'email_orders', title: 'Commandes', desc: 'Recevoir un email pour chaque commande' }, { key: 'email_promotions', title: 'Promotions', desc: 'Recevoir les offres et nouveautés' }].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-[#F7F8FA] rounded-[10px]">
                          <div><p className="font-medium text-[#0B2545]">{item.title}</p><p className="text-sm text-[#4B5563]">{item.desc}</p></div>
                          <Switch checked={notificationSettings[item.key]} onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, [item.key]: checked}))} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 pt-6 border-t border-slate-200">
                      <h3 className="font-semibold text-[#0B2545]">Autres Notifications</h3>
                      {[{ key: 'sms_reminders', title: 'Rappels SMS', desc: 'Rappels avant vos rendez-vous' }, { key: 'push_notifications', title: 'Notifications Push', desc: 'Notifications sur votre navigateur' }].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-[#F7F8FA] rounded-[10px]">
                          <div><p className="font-medium text-[#0B2545]">{item.title}</p><p className="text-sm text-[#4B5563]">{item.desc}</p></div>
                          <Switch checked={notificationSettings[item.key]} onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, [item.key]: checked}))} />
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white h-12 rounded-[10px] min-h-[44px]"><Save className="w-4 h-4 mr-2" />Enregistrer les Préférences</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy">
                <Card className="shadow-lg rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="text-[#0B2545]">Confidentialité</CardTitle><CardDescription className="text-[#4B5563]">Contrôlez qui peut voir vos informations</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    {[{ key: 'profile_public', title: 'Profil Public', desc: 'Rendre mon profil visible par tous' }, { key: 'show_email', title: "Afficher l'Email", desc: 'Les autres utilisateurs peuvent voir mon email' }, { key: 'show_phone', title: 'Afficher le Téléphone', desc: 'Les autres utilisateurs peuvent voir mon téléphone' }].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-[#F7F8FA] rounded-[10px]">
                        <div><p className="font-medium text-[#0B2545]">{item.title}</p><p className="text-sm text-[#4B5563]">{item.desc}</p></div>
                        <Switch checked={privacySettings[item.key]} onCheckedChange={(checked) => setPrivacySettings(prev => ({...prev, [item.key]: checked}))} />
                      </div>
                    ))}
                    <Button className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white h-12 rounded-[10px] min-h-[44px]"><Save className="w-4 h-4 mr-2" />Enregistrer les Paramètres</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="shadow-lg rounded-[12px] border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader><CardTitle className="text-[#0B2545] dark:text-slate-100">Sécurité du Compte</CardTitle><CardDescription className="text-[#4B5563] dark:text-slate-400">Protégez votre compte avec ces options</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-[#0B2545]/10 dark:bg-[#0B2545]/30 border border-[#0B2545] rounded-[10px]">
                      <p className="text-sm text-[#0B2545] dark:text-slate-200"><Shield className="w-4 h-4 inline mr-2" />La modification du mot de passe et l'authentification à deux facteurs sont gérées par la plateforme base44.</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0B2545] dark:text-slate-100">Historique de Connexion</h3>
                      <div className="p-4 bg-[#F7F8FA] dark:bg-slate-700 rounded-[10px]">
                        <p className="text-sm text-[#4B5563] dark:text-slate-400">Dernière connexion : {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                      </div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-[#D6454A]">Zone Dangereuse</h3>
                      <Button variant="outline" className="w-full border-[#D6454A] text-[#D6454A] hover:bg-[#D6454A]/10 rounded-[10px] min-h-[44px]">Supprimer mon Compte</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance">
                <Card className="shadow-lg rounded-[12px] border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-[#0B2545] dark:text-slate-100">Apparence</CardTitle>
                    <CardDescription className="text-[#4B5563] dark:text-slate-400">Personnalisez l'apparence de l'application</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#F7F8FA] dark:bg-slate-700 rounded-[10px]">
                      <div className="flex items-center gap-4">
                        {isDarkMode ? (
                          <div className="w-12 h-12 rounded-[10px] bg-slate-800 flex items-center justify-center">
                            <Moon className="w-6 h-6 text-[#D08B3D]" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-[10px] bg-[#D08B3D]/10 flex items-center justify-center">
                            <Sun className="w-6 h-6 text-[#D08B3D]" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#0B2545] dark:text-slate-100">Mode Sombre</p>
                          <p className="text-sm text-[#4B5563] dark:text-slate-400">
                            {isDarkMode ? 'Activé - Interface sombre' : 'Désactivé - Interface claire'}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={isDarkMode} 
                        onCheckedChange={toggleDarkMode}
                      />
                    </div>

                    <div className="p-4 bg-[#D08B3D]/10 dark:bg-[#D08B3D]/20 border border-[#D08B3D] rounded-[10px]">
                      <p className="text-sm text-[#0B2545] dark:text-slate-200">
                        <Palette className="w-4 h-4 inline mr-2 text-[#D08B3D]" />
                        Le mode sombre réduit la fatigue oculaire et économise la batterie sur les écrans OLED.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { setIsDarkMode(false); document.documentElement.classList.remove('dark'); localStorage.setItem('shopthebarber-theme', 'light'); }}
                        className={`p-4 rounded-[12px] border-2 transition-all ${!isDarkMode ? 'border-[#D08B3D] bg-[#D08B3D]/10' : 'border-slate-200 dark:border-slate-700'}`}
                      >
                        <div className="w-full h-20 bg-[#F7F8FA] rounded-[8px] mb-3 flex items-center justify-center shadow-inner">
                          <Sun className="w-8 h-8 text-[#D08B3D]" />
                        </div>
                        <p className="font-medium text-[#0B2545] dark:text-slate-100">Clair</p>
                      </button>
                      <button
                        onClick={() => { setIsDarkMode(true); document.documentElement.classList.add('dark'); localStorage.setItem('shopthebarber-theme', 'dark'); }}
                        className={`p-4 rounded-[12px] border-2 transition-all ${isDarkMode ? 'border-[#D08B3D] bg-[#D08B3D]/10' : 'border-slate-200 dark:border-slate-700'}`}
                      >
                        <div className="w-full h-20 bg-slate-800 rounded-[8px] mb-3 flex items-center justify-center shadow-inner">
                          <Moon className="w-8 h-8 text-[#D08B3D]" />
                        </div>
                        <p className="font-medium text-[#0B2545] dark:text-slate-100">Sombre</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}