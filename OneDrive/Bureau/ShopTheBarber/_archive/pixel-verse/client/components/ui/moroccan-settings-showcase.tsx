import React from "react";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  Settings,
  User,
  Bell,
  Eye,
  EyeOff,
  ArrowLeft,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Check,
  Shield,
  Globe,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";

export default function MoroccanSettingsShowcase() {
  const [activeTab, setActiveTab] = React.useState("profile");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Mock settings data
  const [profileSettings, setProfileSettings] = React.useState({
    firstName: "Ahmed",
    lastName: "Alaoui",
    email: "ahmed.alaoui@example.com",
    phone: "+212 6 12 34 56 78",
    city: "Casablanca",
    address: "123 Rue Mohammed V",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = React.useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingReminders: true,
    promotionalEmails: false,
    newBarberAlerts: true,
    reviewReminders: true,
  });

  const [privacySettings, setPrivacySettings] = React.useState({
    profileVisibility: "public",
    showPhoneNumber: false,
    showEmail: false,
    allowReviews: true,
    allowContact: true,
  });

  const [appSettings, setAppSettings] = React.useState({
    theme: "dark",
    language: "fr",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  const [bookingPreferences, setBookingPreferences] = React.useState({
    defaultLocationType: "shop",
    preferredTimeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    reminderTime: "2h",
    autoConfirm: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal text-white relative overflow-hidden">
      {/* Moroccan Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="moroccan-pattern"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-moroccan-gold/20 bg-moroccan-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-moroccan-charcoal/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-moroccan-gold hover:text-white hover:bg-moroccan-gold/10 transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-moroccan-gold to-moroccan-copper">
                <Settings className="h-6 w-6 text-moroccan-charcoal" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Paramètres Premium
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
              <CardHeader className="border-b border-moroccan-gold/20">
                <CardTitle className="text-white flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-moroccan-gold to-moroccan-copper">
                    <Settings className="h-4 w-4 text-moroccan-charcoal" />
                  </div>
                  <span>Sections</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                {[
                  { id: "profile", label: "Profil", icon: User, color: "from-blue-500 to-blue-600" },
                  { id: "notifications", label: "Notifications", icon: Bell, color: "from-green-500 to-green-600" },
                  { id: "privacy", label: "Confidentialité", icon: Zap, color: "from-purple-500 to-purple-600" },
                  { id: "app", label: "Application", icon: Settings, color: "from-orange-500 to-orange-600" },
                  { id: "booking", label: "Réservations", icon: Calendar, color: "from-red-500 to-red-600" },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-300 ${
                      activeTab === section.id
                        ? "bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal shadow-lg transform scale-105"
                        : "text-moroccan-offwhite hover:text-white hover:bg-moroccan-gold/10"
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${activeTab === section.id ? "bg-white/20" : `bg-gradient-to-r ${section.color}`}`}>
                      <section.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Informations Personnelles</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Gérez vos informations personnelles et votre profil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-moroccan-offwhite font-medium">Prénom</Label>
                        <Input
                          id="firstName"
                          value={profileSettings.firstName}
                          onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300"
                          placeholder="Votre prénom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-moroccan-offwhite font-medium">Nom</Label>
                        <Input
                          id="lastName"
                          value={profileSettings.lastName}
                          onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300"
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-moroccan-offwhite font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileSettings.email}
                        disabled
                        className="bg-moroccan-darkgrey/50 border-moroccan-gold/20 text-moroccan-offwhite cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-moroccan-offwhite font-medium">Téléphone</Label>
                      <Input
                        id="phone"
                        value={profileSettings.phone}
                        onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                        className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300"
                        placeholder="+212 6 12 34 56 78"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-moroccan-offwhite font-medium">Ville</Label>
                        <Input
                          id="city"
                          value={profileSettings.city}
                          onChange={(e) => setProfileSettings({...profileSettings, city: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300"
                          placeholder="Casablanca"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-moroccan-offwhite font-medium">Adresse</Label>
                        <Input
                          id="address"
                          value={profileSettings.address}
                          onChange={(e) => setProfileSettings({...profileSettings, address: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300"
                          placeholder="Votre adresse complète"
                        />
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Sauvegarder le profil
                    </Button>
                  </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Changer le Mot de Passe</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Mettez à jour votre mot de passe pour sécuriser votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-moroccan-offwhite font-medium">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={profileSettings.currentPassword}
                          onChange={(e) => setProfileSettings({...profileSettings, currentPassword: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-moroccan-offwhite hover:text-moroccan-gold transition-colors duration-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-moroccan-offwhite font-medium">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={profileSettings.newPassword}
                          onChange={(e) => setProfileSettings({...profileSettings, newPassword: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-moroccan-offwhite hover:text-moroccan-gold transition-colors duration-300"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-moroccan-offwhite font-medium">Confirmer le nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={profileSettings.confirmPassword}
                          onChange={(e) => setProfileSettings({...profileSettings, confirmPassword: e.target.value})}
                          className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-moroccan-offwhite hover:text-moroccan-gold transition-colors duration-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Changer le mot de passe
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="animate-fade-in">
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Notifications</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Configurez vos préférences de notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Notifications par email</Label>
                            <p className="text-sm text-moroccan-offwhite">Recevoir des notifications par email</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Notifications SMS</Label>
                            <p className="text-sm text-moroccan-offwhite">Recevoir des notifications par SMS</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Notifications push</Label>
                            <p className="text-sm text-moroccan-offwhite">Recevoir des notifications push</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Rappels de réservation</Label>
                            <p className="text-sm text-moroccan-offwhite">Rappels avant vos rendez-vous</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.bookingReminders}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, bookingReminders: checked})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* App Settings */}
            {activeTab === "app" && (
              <div className="animate-fade-in">
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Préférences de l'Application</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Personnalisez votre expérience utilisateur
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Thème</Label>
                        <Select value={appSettings.theme} onValueChange={(value) => setAppSettings({...appSettings, theme: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="dark" className="text-white hover:bg-moroccan-gold/20">Sombre</SelectItem>
                            <SelectItem value="light" className="text-white hover:bg-moroccan-gold/20">Clair</SelectItem>
                            <SelectItem value="auto" className="text-white hover:bg-moroccan-gold/20">Automatique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Langue</Label>
                        <Select value={appSettings.language} onValueChange={(value) => setAppSettings({...appSettings, language: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="fr" className="text-white hover:bg-moroccan-gold/20">Français</SelectItem>
                            <SelectItem value="en" className="text-white hover:bg-moroccan-gold/20">English</SelectItem>
                            <SelectItem value="ar" className="text-white hover:bg-moroccan-gold/20">العربية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Format d'heure</Label>
                        <Select value={appSettings.timeFormat} onValueChange={(value) => setAppSettings({...appSettings, timeFormat: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="12h" className="text-white hover:bg-moroccan-gold/20">12 heures</SelectItem>
                            <SelectItem value="24h" className="text-white hover:bg-moroccan-gold/20">24 heures</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Devise</Label>
                        <Select value={appSettings.currency} onValueChange={(value) => setAppSettings({...appSettings, currency: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="MAD" className="text-white hover:bg-moroccan-gold/20">Dirham (MAD)</SelectItem>
                            <SelectItem value="EUR" className="text-white hover:bg-moroccan-gold/20">Euro (EUR)</SelectItem>
                            <SelectItem value="USD" className="text-white hover:bg-moroccan-gold/20">Dollar (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <div className="animate-fade-in">
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Confidentialité</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Contrôlez la visibilité de vos informations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Visibilité du profil</Label>
                        <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="public" className="text-white hover:bg-moroccan-gold/20">Public</SelectItem>
                            <SelectItem value="friends" className="text-white hover:bg-moroccan-gold/20">Amis uniquement</SelectItem>
                            <SelectItem value="private" className="text-white hover:bg-moroccan-gold/20">Privé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Afficher le téléphone</Label>
                            <p className="text-sm text-moroccan-offwhite">Autoriser l'affichage de votre numéro</p>
                          </div>
                        </div>
                        <Switch
                          checked={privacySettings.showPhoneNumber}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showPhoneNumber: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Afficher l'email</Label>
                            <p className="text-sm text-moroccan-offwhite">Autoriser l'affichage de votre email</p>
                          </div>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showEmail: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-moroccan-gold" />
                          <div>
                            <Label className="text-white font-medium">Autoriser les avis</Label>
                            <p className="text-sm text-moroccan-offwhite">Permettre aux autres de vous évaluer</p>
                          </div>
                        </div>
                        <Switch
                          checked={privacySettings.allowReviews}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowReviews: checked})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Booking Preferences */}
            {activeTab === "booking" && (
              <div className="animate-fade-in">
                <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
                  <CardHeader className="border-b border-moroccan-gold/20">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white">Préférences de Réservation</span>
                    </CardTitle>
                    <CardDescription className="text-moroccan-offwhite">
                      Personnalisez vos préférences de réservation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Type de lieu par défaut</Label>
                        <Select value={bookingPreferences.defaultLocationType} onValueChange={(value) => setBookingPreferences({...bookingPreferences, defaultLocationType: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="shop" className="text-white hover:bg-moroccan-gold/20">Salon de coiffure</SelectItem>
                            <SelectItem value="home" className="text-white hover:bg-moroccan-gold/20">À domicile</SelectItem>
                            <SelectItem value="both" className="text-white hover:bg-moroccan-gold/20">Les deux</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-moroccan-offwhite font-medium">Temps de rappel</Label>
                        <Select value={bookingPreferences.reminderTime} onValueChange={(value) => setBookingPreferences({...bookingPreferences, reminderTime: value})}>
                          <SelectTrigger className="bg-moroccan-darkgrey border-moroccan-gold/30 text-white focus:border-moroccan-gold focus:ring-moroccan-gold/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                            <SelectItem value="1h" className="text-white hover:bg-moroccan-gold/20">1 heure avant</SelectItem>
                            <SelectItem value="2h" className="text-white hover:bg-moroccan-gold/20">2 heures avant</SelectItem>
                            <SelectItem value="4h" className="text-white hover:bg-moroccan-gold/20">4 heures avant</SelectItem>
                            <SelectItem value="1d" className="text-white hover:bg-moroccan-gold/20">1 jour avant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-moroccan-darkgrey/50 border border-moroccan-gold/20">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-moroccan-gold" />
                        <div>
                          <Label className="text-white font-medium">Confirmation automatique</Label>
                          <p className="text-sm text-moroccan-offwhite">Confirmer automatiquement les réservations</p>
                        </div>
                      </div>
                      <Switch
                        checked={bookingPreferences.autoConfirm}
                        onCheckedChange={(checked) => setBookingPreferences({...bookingPreferences, autoConfirm: checked})}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Save Button */}
            <Card className="bg-gradient-to-br from-moroccan-charcoal to-moroccan-darkgrey border-moroccan-gold/20 shadow-moroccan-xl backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div>
                    <h3 className="font-semibold text-white text-lg">Sauvegarder tous les paramètres</h3>
                    <p className="text-sm text-moroccan-offwhite">Appliquez tous les changements de paramètres</p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Sauvegarder les paramètres
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30 shadow-moroccan-xl backdrop-blur">
              <CardHeader className="border-b border-red-500/30">
                <CardTitle className="text-red-400 flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-red-500 to-red-600">
                    <Trash2 className="h-4 w-4 text-white" />
                  </div>
                  <span>Zone Dangereuse</span>
                </CardTitle>
                <CardDescription className="text-red-300">
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div>
                    <h3 className="font-semibold text-red-300 text-lg">Supprimer mon compte</h3>
                    <p className="text-sm text-red-200">Cette action est irréversible et supprimera définitivement votre compte</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 