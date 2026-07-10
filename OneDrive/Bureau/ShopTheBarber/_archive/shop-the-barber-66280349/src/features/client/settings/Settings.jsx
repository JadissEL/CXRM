import { useSettings } from './useSettings';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Save, Moon, Sun, Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
    const {
        formData,
        isDarkMode,
        toggleDarkMode,
        handleProfileUpdate,
        handleChange,
        updateProfileMutation
    } = useSettings();

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Paramètres</h1>
                    <p className="text-[#4B5563]">Gérez vos préférences et informations</p>
                </motion.div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="bg-white rounded-[10px] border border-slate-200 p-1">
                        <TabsTrigger value="profile" className="rounded-[8px]">
                            <User className="w-4 h-4 mr-2" />Profil
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-[8px]">
                            <Bell className="w-4 h-4 mr-2" />Notifications
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-[8px]">
                            <Shield className="w-4 h-4 mr-2" />Confidentialité
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <Label>Nom complet</Label>
                                        <Input value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Téléphone</Label>
                                        <Input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Adresse</Label>
                                        <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
                                    </div>
                                    <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                                        <Save className="w-4 h-4 mr-2" />
                                        {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[#0B2545] mb-4">Préférences de notification</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-[#0B2545]">Notifications par email</p>
                                            <p className="text-sm text-[#4B5563]">Recevoir des emails pour les mises à jour</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-[#0B2545]">Notifications push</p>
                                            <p className="text-sm text-[#4B5563]">Recevoir des notifications sur votre appareil</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[#0B2545] mb-4">Confidentialité et sécurité</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-[#0B2545]">Mode sombre</p>
                                            <p className="text-sm text-[#4B5563]">Activer le thème sombre</p>
                                        </div>
                                        <Button onClick={toggleDarkMode} variant="outline" size="icon">
                                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
