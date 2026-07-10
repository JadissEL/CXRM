import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Eye, Heart, Calendar, BookOpen, ArrowRight } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  video_url?: string;
  status: string;
  categories?: string;
  created_at: string;
  published_at?: string;
  view_count: number;
  likes_count: number;
  first_name: string;
  last_name: string;
  author_role: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export function MoroccanBlogShowcase() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const categories: Category[] = [
    { id: 1, name: 'Tendances', description: 'Les dernières tendances capillaires' },
    { id: 2, name: 'Techniques', description: 'Techniques de barbier professionnelles' },
    { id: 3, name: 'Conseils', description: 'Conseils de soin et d\'entretien' },
    { id: 4, name: 'Produits', description: 'Tests et recommandations de produits' },
    { id: 5, name: 'Style', description: 'Inspiration et conseils de style' },
  ];

  const featuredArticles: Article[] = [
    {
      id: 1,
      title: "Les Tendances Capillaires 2024 au Maroc",
      content: "Découvrez les coupes et styles qui dominent cette année...",
      excerpt: "Les tendances capillaires évoluent constamment. Découvrez les coupes et styles qui dominent cette année au Maroc et comment les adapter à votre personnalité.",
      featured_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop",
      category: "Tendances",
      created_at: "2024-01-15",
      published_at: "2024-01-15",
      view_count: 1247,
      likes_count: 89,
      first_name: "Ahmed",
      last_name: "El Mansouri",
      author_role: "admin",
      status: "published"
    },
    {
      id: 2,
      title: "Technique de Rasage Traditionnel Marocain",
      content: "Apprenez les secrets du rasage traditionnel...",
      excerpt: "Le rasage traditionnel marocain est un art ancestral. Découvrez les techniques et secrets transmis de génération en génération pour un rasage parfait.",
      featured_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop",
      category: "Techniques",
      created_at: "2024-01-12",
      published_at: "2024-01-12",
      view_count: 892,
      likes_count: 67,
      first_name: "Karim",
      last_name: "Ben Ali",
      author_role: "barber",
      status: "published"
    },
    {
      id: 3,
      title: "Guide Complet des Huiles Essentielles",
      content: "Les huiles essentielles pour les soins capillaires...",
      excerpt: "Les huiles essentielles sont essentielles pour des soins capillaires naturels. Guide complet des meilleures huiles et leurs bienfaits pour vos cheveux.",
      featured_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop",
      category: "Conseils",
      created_at: "2024-01-10",
      published_at: "2024-01-10",
      view_count: 1567,
      likes_count: 123,
      first_name: "Fatima",
      last_name: "Zahra",
      author_role: "admin",
      status: "published"
    },
    {
      id: 4,
      title: "Test: Les Meilleurs Produits de 2024",
      content: "Notre sélection des meilleurs produits...",
      excerpt: "Nous avons testé des dizaines de produits pour vous. Découvrez notre sélection des meilleurs produits capillaires de 2024, testés et approuvés.",
      featured_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop",
      category: "Produits",
      created_at: "2024-01-08",
      published_at: "2024-01-08",
      view_count: 2034,
      likes_count: 156,
      first_name: "Youssef",
      last_name: "Alaoui",
      author_role: "barber",
      status: "published"
    }
  ];

  const filteredArticles = selectedCategory === 'all' 
    ? featuredArticles 
    : featuredArticles.filter(a => a.category === selectedCategory);

  const handleLike = (articleId: number) => {
    console.log('Liking article:', articleId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-xl">
            <BookOpen className="h-8 w-8 text-moroccan-charcoal" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-moroccan-offwhite">
            Blog Premium
          </h2>
        </div>
        <p className="text-lg text-moroccan-cream max-w-2xl mx-auto">
          Découvrez nos articles premium avec expertise et style marocain authentique
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className={selectedCategory === 'all' 
            ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal font-bold' 
            : 'border-2 border-moroccan-darkgrey text-moroccan-offwhite hover:border-moroccan-gold'
          }
        >
          Tous
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.name)}
            className={selectedCategory === category.name 
              ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal font-bold' 
              : 'border-2 border-moroccan-darkgrey text-moroccan-offwhite hover:border-moroccan-gold'
            }
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-moroccan-darkgrey/50 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' 
              ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal' 
              : 'text-moroccan-offwhite hover:bg-moroccan-gold/20'
            }
          >
            Grille
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' 
              ? 'bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal' 
              : 'text-moroccan-offwhite hover:bg-moroccan-gold/20'
            }
          >
            Liste
          </Button>
        </div>
      </div>

      {/* Articles Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((article, index) => (
            <Card key={article.id} className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-darkgrey hover:border-moroccan-gold/50 transition-all duration-300 transform hover:scale-105 moroccan-pattern group" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <CardContent className="p-0 relative z-10">
                {article.featured_image && (
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/50 to-transparent"></div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    {article.category && (
                      <div className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal px-3 py-1 rounded-full text-xs font-bold">
                        {article.category}
                      </div>
                    )}
                    <span className="text-xs text-moroccan-gold font-semibold">
                      {article.author_role === 'admin' ? 'Admin' : 'Barbier'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-moroccan-offwhite mb-3 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {article.excerpt && (
                    <p className="text-moroccan-cream text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-moroccan-cream mb-4">
                    <span className="font-semibold">
                      Par {article.first_name} {article.last_name}
                    </span>
                    <span>{formatDate(article.published_at || article.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-moroccan-cream">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1 text-moroccan-gold" />
                        {article.view_count}
                      </span>
                      <button
                        onClick={() => handleLike(article.id)}
                        className="flex items-center hover:text-red-400 transition-colors"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {article.likes_count}
                      </button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-2 border-moroccan-darkgrey text-moroccan-offwhite hover:bg-moroccan-darkgrey hover:border-moroccan-gold transition-all duration-300"
                    >
                      Lire
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <Card key={article.id} className="relative overflow-hidden bg-gradient-to-r from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-darkgrey hover:border-moroccan-gold/50 transition-all duration-300 moroccan-pattern group" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex relative z-10">
                <div className="w-32 h-32 relative overflow-hidden">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/50 to-transparent"></div>
                </div>
                
                <CardContent className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        {article.category && (
                          <div className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal px-2 py-1 rounded-full text-xs font-bold">
                            {article.category}
                          </div>
                        )}
                        <span className="text-xs text-moroccan-gold font-semibold">
                          {article.author_role === 'admin' ? 'Admin' : 'Barbier'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-display font-bold text-moroccan-offwhite mb-2">
                        {article.title}
                      </h3>
                      
                      {article.excerpt && (
                        <p className="text-moroccan-cream text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-moroccan-cream mb-3">
                        <span className="font-semibold">
                          Par {article.first_name} {article.last_name}
                        </span>
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-3">
                      <div className="flex items-center space-x-4 text-sm text-moroccan-cream">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1 text-moroccan-gold" />
                          {article.view_count}
                        </span>
                        <button
                          onClick={() => handleLike(article.id)}
                          className="flex items-center hover:text-red-400 transition-colors"
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {article.likes_count}
                        </button>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-moroccan-darkgrey text-moroccan-offwhite hover:bg-moroccan-darkgrey hover:border-moroccan-gold transition-all duration-300"
                      >
                        Lire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center mt-12">
        <Button
          size="lg"
          className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold px-8 py-3 shadow-moroccan transition-all duration-300 transform hover:scale-105"
        >
          Voir tous les articles
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
} 