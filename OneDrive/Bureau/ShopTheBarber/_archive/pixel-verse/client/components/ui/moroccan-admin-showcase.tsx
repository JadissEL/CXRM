import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { 
  CheckCircle, 
  X, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  Star,
  Eye
} from 'lucide-react';

export function MoroccanAdminShowcase() {
  const [selectedTab, setSelectedTab] = React.useState('moderation');

  const mockContent = [
    {
      id: 1,
      content_type: 'article',
      title: "Guide complet de la coiffure marocaine",
      author: "Ahmed Benali",
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: 'pending_review',
      excerpt: "Découvrez les techniques traditionnelles de coiffure marocaine et leurs secrets ancestraux..."
    },
    {
      id: 2,
      content_type: 'video',
      title: "Tutoriel: Coupe moderne pour hommes",
      author: "Karim El Fassi",
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      status: 'published',
      excerpt: "Apprenez à réaliser une coupe moderne et élégante avec nos techniques professionnelles..."
    },
    {
      id: 3,
      content_type: 'article',
      title: "Les tendances 2024 en coiffure masculine",
      author: "Fatima Zahra",
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      status: 'rejected',
      excerpt: "Découvrez les nouvelles tendances qui vont dominer la coiffure masculine cette année..."
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-gold/20 to-moroccan-copper/20 text-moroccan-gold border border-moroccan-gold/30 rounded-full text-xs font-bold">En attente</div>;
      case 'published':
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-green/20 to-moroccan-gold/20 text-moroccan-green border border-moroccan-green/30 rounded-full text-xs font-bold">Publié</div>;
      case 'rejected':
        return <div className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">Rejeté</div>;
      default:
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-darkgrey/20 to-moroccan-charcoal/20 text-moroccan-offwhite/60 border border-moroccan-gold/20 rounded-full text-xs font-bold">{status}</div>;
    }
  };

  const getContentIcon = (type: string) => {
    return type === 'article' ? <span className="text-2xl">📄</span> : <span className="text-2xl">🎥</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading text-moroccan-offwhite mb-4">
            Outils d'Administration Premium
          </h2>
          <p className="text-xl text-moroccan-offwhite/70 max-w-2xl mx-auto">
            Gérez votre plateforme avec nos outils d'administration avancés et interface premium
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border border-moroccan-gold/30 rounded-xl p-1 shadow-moroccan-lg">
            <button
              onClick={() => setSelectedTab('moderation')}
              className={`px-6 py-3 rounded-lg font-heading font-bold transition-all duration-300 ${
                selectedTab === 'moderation'
                  ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal shadow-moroccan-xl'
                  : 'text-moroccan-offwhite/60 hover:text-moroccan-offwhite'
              }`}
            >
              Modération
            </button>
            <button
              onClick={() => setSelectedTab('analytics')}
              className={`px-6 py-3 rounded-lg font-heading font-bold transition-all duration-300 ${
                selectedTab === 'analytics'
                  ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal shadow-moroccan-xl'
                  : 'text-moroccan-offwhite/60 hover:text-moroccan-offwhite'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setSelectedTab('users')}
              className={`px-6 py-3 rounded-lg font-heading font-bold transition-all duration-300 ${
                selectedTab === 'users'
                  ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal shadow-moroccan-xl'
                  : 'text-moroccan-offwhite/60 hover:text-moroccan-offwhite'
              }`}
            >
              Utilisateurs
            </button>
          </div>
        </div>

        {/* Content Based on Tab */}
        {selectedTab === 'moderation' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 shadow-moroccan-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">12</h3>
                  <p className="text-moroccan-offwhite/60">Articles</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-moroccan-green/10 to-moroccan-gold/10 border-moroccan-green/30 shadow-moroccan-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-moroccan-green to-moroccan-gold rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">8</h3>
                  <p className="text-moroccan-offwhite/60">Vidéos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-moroccan-royal-blue/10 to-moroccan-green/10 border-moroccan-royal-blue/30 shadow-moroccan-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-moroccan-royal-blue to-moroccan-green rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                    <CheckCircle className="h-6 w-6 text-moroccan-charcoal" />
                  </div>
                  <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">15</h3>
                  <p className="text-moroccan-offwhite/60">Approuvés</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 shadow-moroccan-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">3</h3>
                  <p className="text-moroccan-offwhite/60">En attente</p>
                </CardContent>
              </Card>
            </div>

            {/* Content List */}
            <div className="space-y-6">
              {mockContent.map((item, index) => (
                <Card 
                  key={item.id}
                  className="group relative bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/20 shadow-moroccan-lg hover:shadow-moroccan-xl transition-all duration-500 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Moroccan Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5 rounded-xl overflow-hidden">
                    <div className="moroccan-pattern"></div>
                  </div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-copper/20 rounded-lg">
                            {getContentIcon(item.content_type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">{item.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-moroccan-offwhite/60">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-moroccan-gold" />
                                <span>{item.author}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-moroccan-gold" />
                                <span>{formatDate(item.created_date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-moroccan-offwhite/80 text-sm mb-4 leading-relaxed">
                          {item.excerpt}
                        </p>
                        
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gradient-to-r from-moroccan-green/10 to-moroccan-gold/10 border-moroccan-green/30 text-moroccan-green hover:from-moroccan-green/20 hover:to-moroccan-gold/20 hover:border-moroccan-green/50 transition-all duration-300 shadow-moroccan"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/50 transition-all duration-300 shadow-moroccan"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gradient-to-r from-moroccan-darkgrey/20 to-moroccan-charcoal/20 border-moroccan-gold/20 text-moroccan-offwhite/60 hover:from-moroccan-darkgrey/30 hover:to-moroccan-charcoal/30 hover:border-moroccan-gold/30 hover:text-moroccan-offwhite transition-all duration-300 shadow-moroccan"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="text-center py-12">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-copper/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">📊</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-moroccan-pattern opacity-20"></div>
            </div>
            <h3 className="text-2xl font-heading text-moroccan-offwhite mb-4">Analytics Avancés</h3>
            <p className="text-moroccan-offwhite/60 text-lg">
              Tableaux de bord détaillés et métriques en temps réel
            </p>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="text-center py-12">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-copper/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">👥</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-moroccan-pattern opacity-20"></div>
            </div>
            <h3 className="text-2xl font-heading text-moroccan-offwhite mb-4">Gestion des Utilisateurs</h3>
            <p className="text-moroccan-offwhite/60 text-lg">
              Gérez les comptes, rôles et permissions des utilisateurs
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 bg-gradient-to-br from-moroccan-darkgrey/30 to-moroccan-charcoal/30 border border-moroccan-gold/20 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
              <Eye className="h-6 w-6 text-moroccan-charcoal" />
            </div>
            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">Modération Intelligente</h3>
            <p className="text-moroccan-offwhite/60">Approuvez, rejetez ou supprimez le contenu avec des outils avancés</p>
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
              <Filter className="h-6 w-6 text-moroccan-charcoal" />
            </div>
            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">Filtres Avancés</h3>
            <p className="text-moroccan-offwhite/60">Recherchez et filtrez le contenu par type, statut et auteur</p>
          </div>
        </div>
      </div>
    </section>
  );
} 