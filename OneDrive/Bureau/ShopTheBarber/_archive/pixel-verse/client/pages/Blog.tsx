import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Eye, Heart, Calendar, Search, Filter, ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function Blog() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering Blog page...');

  // Images par défaut pour les articles
  const defaultArticleImages = [
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=400&fit=crop",
  ];

  // Articles fictifs avec images pour la démonstration
  const mockArticles: Article[] = [
    {
      id: 1,
      title: "Les Tendances Coiffure 2024 : Style Moderne et Élégance",
      content: "Découvrez les dernières tendances en matière de coiffure masculine pour 2024...",
      excerpt: "Les tendances coiffure 2024 mettent l'accent sur l'élégance naturelle et les coupes modernes qui s'adaptent à tous les types de visages.",
      featured_image: defaultArticleImages[0],
      status: "published",
      categories: "Tendances,Style",
      created_at: "2024-01-15T10:00:00Z",
      published_at: "2024-01-15T10:00:00Z",
      view_count: 1247,
      likes_count: 89,
      first_name: "Hassan",
      last_name: "Alami",
      author_role: "Barbier Expert"
    },
    {
      id: 2,
      title: "Comment Entretenir sa Barbe : Guide Complet",
      content: "Un guide complet pour entretenir votre barbe et la garder en parfait état...",
      excerpt: "L'entretien de la barbe nécessite des soins quotidiens et des produits de qualité pour un résultat optimal.",
      featured_image: defaultArticleImages[1],
      status: "published",
      categories: "Soins,Barbe",
      created_at: "2024-01-12T14:30:00Z",
      published_at: "2024-01-12T14:30:00Z",
      view_count: 2156,
      likes_count: 156,
      first_name: "Youssef",
      last_name: "Bennani",
      author_role: "Spécialiste Barbe"
    },
    {
      id: 3,
      title: "Les Secrets des Barbiers Marocains Traditionnels",
      content: "Découvrez les techniques ancestrales des barbiers marocains...",
      excerpt: "Les barbiers marocains utilisent des techniques traditionnelles transmises de génération en génération.",
      featured_image: defaultArticleImages[2],
      status: "published",
      categories: "Tradition,Culture",
      created_at: "2024-01-10T09:15:00Z",
      published_at: "2024-01-10T09:15:00Z",
      view_count: 1893,
      likes_count: 234,
      first_name: "Omar",
      last_name: "Tazi",
      author_role: "Barbier Traditionnel"
    },
    {
      id: 4,
      title: "Produits de Coiffure : Comment Choisir les Meilleurs",
      content: "Guide pour choisir les meilleurs produits de coiffure selon votre type de cheveux...",
      excerpt: "Le choix des produits de coiffure est crucial pour obtenir le résultat souhaité et préserver la santé de vos cheveux.",
      featured_image: defaultArticleImages[3],
      status: "published",
      categories: "Produits,Conseils",
      created_at: "2024-01-08T16:45:00Z",
      published_at: "2024-01-08T16:45:00Z",
      view_count: 1678,
      likes_count: 98,
      first_name: "Mehdi",
      last_name: "Benali",
      author_role: "Expert Produits"
    },
    {
      id: 5,
      title: "Coupes de Cheveux pour Visage Rond : Guide Complet",
      content: "Les meilleures coupes de cheveux pour les hommes ayant un visage rond...",
      excerpt: "Choisir la bonne coupe selon la forme de son visage est essentiel pour un look harmonieux et élégant.",
      featured_image: defaultArticleImages[4],
      status: "published",
      categories: "Conseils,Style",
      created_at: "2024-01-05T11:20:00Z",
      published_at: "2024-01-05T11:20:00Z",
      view_count: 2341,
      likes_count: 187,
      first_name: "Karim",
      last_name: "Alaoui",
      author_role: "Styliste Expert"
    },
    {
      id: 6,
      title: "L'Art du Rasage : Techniques Professionnelles",
      content: "Maîtrisez l'art du rasage avec les techniques des professionnels...",
      excerpt: "Le rasage est un art qui nécessite technique, patience et les bons outils pour un résultat parfait.",
      featured_image: defaultArticleImages[5],
      status: "published",
      categories: "Rasage,Technique",
      created_at: "2024-01-03T13:10:00Z",
      published_at: "2024-01-03T13:10:00Z",
      view_count: 1987,
      likes_count: 145,
      first_name: "Amine",
      last_name: "Zahra",
      author_role: "Spécialiste Rasage"
    }
  ];

  React.useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setArticles(mockArticles);
      setCategories([
        { id: 1, name: "Tendances", description: "Les dernières tendances" },
        { id: 2, name: "Style", description: "Conseils de style" },
        { id: 3, name: "Soins", description: "Soins et entretien" },
        { id: 4, name: "Barbe", description: "Tout sur la barbe" },
        { id: 5, name: "Tradition", description: "Techniques traditionnelles" },
        { id: 6, name: "Produits", description: "Guide des produits" }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLike = async (articleId: number) => {
    // Simuler l'action de like
    setArticles(prev => prev.map(article => 
      article.id === articleId 
        ? { ...article, likes_count: article.likes_count + 1 }
        : article
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (globalError) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-moroccan-gold mb-4">Erreur</h2>
          <p className="text-moroccan-sand">{globalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-moroccan-darkgrey/50 bg-moroccan-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-moroccan-charcoal/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-moroccan-sand hover:text-moroccan-gold">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moroccan-gradient-primary">
              <BookOpen className="h-5 w-5 text-moroccan-charcoal" />
            </div>
            <span className="font-heading text-xl font-bold text-moroccan-gold">
              Blog Premium
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section avec image de fond */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=600&fit=crop" 
            alt="Blog ShopTheBarber"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-charcoal/90 via-moroccan-charcoal/80 to-moroccan-darkgrey/70"></div>
        </div>
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="mb-6">
            <div className="bg-moroccan-gradient-primary text-moroccan-charcoal border-0 px-4 py-2 text-sm font-semibold rounded-full inline-flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Expertise & Conseils
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-moroccan-gold mb-6">
            Blog ShopTheBarber
          </h1>
          
          <p className="text-xl text-moroccan-sand max-w-3xl mx-auto mb-8">
            Découvrez les conseils, tendances et techniques des meilleurs barbiers du Maroc. 
            Expertise, style et innovation au service de votre image.
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-sand" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  className="w-full pl-12 pr-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite placeholder:text-moroccan-sand/60 focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <select
                className="w-full px-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort by */}
              <select
                className="w-full px-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                defaultValue="latest"
              >
                <option value="latest">Plus récents</option>
                <option value="popular">Plus populaires</option>
                <option value="views">Plus vus</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-moroccan-charcoal/50 border-moroccan-darkgrey animate-pulse">
                  <div className="h-48 bg-moroccan-darkgrey rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-moroccan-darkgrey rounded mb-2"></div>
                    <div className="h-4 bg-moroccan-darkgrey rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-moroccan-darkgrey rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Card key={article.id} className="bg-moroccan-charcoal/50 border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-105 group overflow-hidden">
                  {/* Article Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={article.featured_image || defaultArticleImages[article.id % defaultArticleImages.length]} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/80 to-transparent"></div>
                    
                    {/* Category Badge */}
                    {article.categories && (
                      <div className="absolute top-4 left-4">
                        <div className="bg-moroccan-gradient-primary text-moroccan-charcoal px-3 py-1 rounded-full text-xs font-semibold">
                          {article.categories.split(',')[0]}
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-moroccan-gold mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-moroccan-sand text-sm line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between mb-4 text-sm text-moroccan-sand">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-moroccan-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-moroccan-charcoal">
                            {article.first_name.charAt(0)}{article.last_name.charAt(0)}
                          </span>
                        </div>
                        <span>{article.first_name} {article.last_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(article.created_at)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-moroccan-sand">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.view_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{article.likes_count}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(article.id)}
                        className="text-moroccan-gold hover:text-moroccan-gold/80 hover:bg-moroccan-gold/10"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Read More Button */}
                    <Button 
                      className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all duration-300"
                    >
                      Lire l'article
                      <BookOpen className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
