import React from 'react';
import { Button } from './button';
import { NotificationCenter } from '../NotificationCenter';
import { Bell, Star, CheckCircle, AlertCircle, X } from 'lucide-react';

export function MoroccanNotificationShowcase() {
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(3);

  const mockNotifications = [
    {
      id: 1,
      title: "Réservation confirmée",
      message: "Votre rendez-vous avec Ahmed le 15 décembre à 14h00 a été confirmé.",
      type: 'success' as const,
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: 2,
      title: "Nouveau produit disponible",
      message: "Découvrez notre nouvelle gamme de produits de coiffure premium.",
      type: 'info' as const,
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 3,
      title: "Promotion spéciale",
      message: "20% de réduction sur tous les services ce weekend !",
      type: 'warning' as const,
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: 4,
      title: "Maintenance prévue",
      message: "Le site sera en maintenance le 20 décembre de 2h à 4h du matin.",
      type: 'error' as const,
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal relative overflow-hidden">
      {/* Moroccan Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="moroccan-pattern"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-full mb-6 shadow-moroccan-xl">
            <Bell className="h-8 w-8 text-moroccan-charcoal" />
          </div>
          <h2 className="text-4xl md:text-5xl font-heading text-moroccan-offwhite mb-4">
            Centre de Notifications
          </h2>
          <p className="text-xl text-moroccan-offwhite/70 max-w-2xl mx-auto">
            Restez informé de vos rendez-vous, promotions et actualités avec notre système de notifications premium
          </p>
        </div>

        {/* Notification Preview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mockNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`group relative p-6 rounded-xl border transition-all duration-500 hover:shadow-moroccan-xl transform hover:-translate-y-2 ${
                notification.is_read 
                  ? 'bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/10' 
                  : 'bg-gradient-to-r from-moroccan-gold/10 to-moroccan-green/10 border-moroccan-gold/30 shadow-moroccan-lg'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Moroccan Pattern Overlay */}
              <div className="absolute inset-0 opacity-5 rounded-xl overflow-hidden">
                <div className="moroccan-pattern"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    notification.is_read 
                      ? 'bg-moroccan-darkgrey/50' 
                      : 'bg-gradient-to-br from-moroccan-gold/20 to-moroccan-green/20'
                  }`}>
                    {notification.type === 'success' && <CheckCircle className="h-6 w-6 text-moroccan-green" />}
                    {notification.type === 'warning' && <AlertCircle className="h-6 w-6 text-moroccan-gold" />}
                    {notification.type === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
                    {notification.type === 'info' && <Star className="h-6 w-6 text-moroccan-royal-blue" />}
                  </div>
                  {!notification.is_read && (
                    <div className="w-3 h-3 bg-moroccan-gold rounded-full animate-moroccan-pulse"></div>
                  )}
                </div>
                
                <h4 className={`font-heading text-lg mb-2 ${
                  notification.is_read ? 'text-moroccan-offwhite/70' : 'text-moroccan-offwhite'
                }`}>
                  {notification.title}
                </h4>
                <p className={`text-sm leading-relaxed mb-4 ${
                  notification.is_read ? 'text-moroccan-offwhite/50' : 'text-moroccan-offwhite/80'
                }`}>
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-moroccan-gold rounded-full mr-2"></div>
                    <p className="text-xs text-moroccan-offwhite/40 font-medium">
                      {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="px-2 py-1 bg-gradient-to-r from-moroccan-green/20 to-moroccan-gold/20 border border-moroccan-green/30 rounded-full">
                      <span className="text-xs text-moroccan-green font-bold">Nouveau</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Demo */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 p-6 bg-gradient-to-r from-moroccan-gold/10 to-moroccan-green/10 border border-moroccan-gold/30 rounded-2xl shadow-moroccan-lg">
            <div className="relative">
              <Button
                onClick={() => setIsNotificationOpen(true)}
                className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold px-8 py-3 rounded-xl shadow-moroccan-xl transition-all duration-300 transform hover:scale-105"
              >
                <Bell className="h-5 w-5 mr-2" />
                Ouvrir les Notifications
              </Button>
              {notificationCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-moroccan-green to-moroccan-gold text-moroccan-charcoal text-xs font-bold rounded-full flex items-center justify-center shadow-moroccan animate-moroccan-pulse">
                  {notificationCount}
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-moroccan-offwhite font-medium">Notifications en temps réel</p>
              <p className="text-moroccan-offwhite/60 text-sm">Cliquez pour voir la démo</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 bg-gradient-to-br from-moroccan-darkgrey/30 to-moroccan-charcoal/30 border border-moroccan-gold/20 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
              <CheckCircle className="h-6 w-6 text-moroccan-charcoal" />
            </div>
            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">Notifications en Temps Réel</h3>
            <p className="text-moroccan-offwhite/60">Recevez instantanément vos notifications de réservation et mises à jour</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-moroccan-darkgrey/30 to-moroccan-charcoal/30 border border-moroccan-gold/20 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-moroccan-green to-moroccan-gold rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
              <Star className="h-6 w-6 text-moroccan-charcoal" />
            </div>
            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">Interface Premium</h3>
            <p className="text-moroccan-offwhite/60">Design élégant avec animations fluides et micro-interactions</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-moroccan-darkgrey/30 to-moroccan-charcoal/30 border border-moroccan-gold/20 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-moroccan-royal-blue to-moroccan-green rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
              <Bell className="h-6 w-6 text-moroccan-charcoal" />
            </div>
            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">Gestion Intelligente</h3>
            <p className="text-moroccan-offwhite/60">Marquez comme lu, filtrez par type et gérez vos préférences</p>
          </div>
        </div>
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </section>
  );
} 