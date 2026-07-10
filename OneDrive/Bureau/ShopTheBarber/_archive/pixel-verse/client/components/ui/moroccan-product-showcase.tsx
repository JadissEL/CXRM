import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Star, Heart, Sparkles, ArrowRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_featured: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export function MoroccanProductShowcase() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const categories: Category[] = [
    { id: 1, name: 'Shampoings & Soins', description: 'Produits de soin capillaire' },
    { id: 2, name: 'Cires & Pommades', description: 'Produits de coiffage' },
    { id: 3, name: 'Outils & Accessoires', description: 'Outils de barbier' },
    { id: 4, name: 'Parfums & Fragrances', description: 'Parfums masculins' },
    { id: 5, name: 'Kits Complets', description: 'Kits de soin complets' },
  ];

  const featuredProducts: Product[] = [
    {
      id: 1,
      name: "Shampoing Premium Moroccan",
      description: "Shampoing enrichi aux huiles essentielles marocaines pour cheveux secs",
      price: 89.99,
      original_price: 119.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Shampoings & Soins",
      brand: "MoroccanCare",
      rating: 4.8,
      review_count: 127,
      in_stock: true,
      is_featured: true
    },
    {
      id: 2,
      name: "Cire à Cheveux Gold Edition",
      description: "Cire de coiffage longue tenue avec finition naturelle",
      price: 45.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Cires & Pommades",
      brand: "StylePro",
      rating: 4.6,
      review_count: 89,
      in_stock: true,
      is_featured: true
    },
    {
      id: 3,
      name: "Kit Barbier Professionnel",
      description: "Kit complet avec ciseaux, peignes et accessoires",
      price: 199.99,
      original_price: 249.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Kits Complets",
      brand: "BarberElite",
      rating: 4.9,
      review_count: 203,
      in_stock: true,
      is_featured: true
    },
    {
      id: 4,
      name: "Parfum Masculin Royal",
      description: "Fragrance exclusive aux notes de bois et épices",
      price: 129.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Parfums & Fragrances",
      brand: "RoyalScents",
      rating: 4.7,
      review_count: 156,
      in_stock: true,
      is_featured: false
    }
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category === selectedCategory);

  const handleAddToCart = (product: Product) => {
    console.log('Adding to cart:', product);
  };

  const handleWishlist = (product: Product) => {
    console.log('Adding to wishlist:', product);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-xl">
            <span className="text-2xl">👑</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-moroccan-offwhite">
            Produits Premium
          </h2>
        </div>
        <p className="text-lg text-moroccan-cream max-w-2xl mx-auto">
          Découvrez notre sélection de produits de qualité pour votre style unique
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

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-darkgrey hover:border-moroccan-gold/50 transition-all duration-300 transform hover:scale-105 moroccan-pattern group">
              <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <CardHeader className="p-0 relative z-10">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {product.is_featured && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal px-3 py-1 rounded-full text-xs font-bold flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Vedette
                    </div>
                  )}
                  {product.original_price && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-moroccan-darkgrey/80 hover:bg-moroccan-gold/20 text-moroccan-gold hover:text-moroccan-offwhite"
                    onClick={() => handleWishlist(product)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 relative z-10">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-moroccan-offwhite line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-moroccan-gold font-semibold">{product.brand}</p>
                  </div>
                  
                  <p className="text-sm text-moroccan-cream line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating)
                            ? "fill-moroccan-gold text-moroccan-gold"
                            : "text-moroccan-darkgrey"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-moroccan-cream ml-1">
                      ({product.review_count})
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xl font-display font-bold text-moroccan-gold">
                        {product.price.toFixed(2)} DH
                      </span>
                      {product.original_price && (
                        <span className="text-sm text-moroccan-cream/70 line-through ml-2">
                          {product.original_price.toFixed(2)} DH
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold px-3 py-1 shadow-moroccan transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.in_stock}
                    >
                      <span className="mr-1">🛒</span>
                      {product.in_stock ? 'Ajouter' : 'Rupture'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative overflow-hidden bg-gradient-to-r from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-darkgrey hover:border-moroccan-gold/50 transition-all duration-300 moroccan-pattern group">
              <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex relative z-10">
                <div className="w-32 h-32 relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {product.is_featured && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal px-2 py-1 rounded-full text-xs font-bold">
                      <Sparkles className="h-3 w-3 mr-1 inline" />
                      Vedette
                    </div>
                  )}
                </div>
                
                <CardContent className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-moroccan-offwhite mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-moroccan-gold font-semibold mb-2">{product.brand}</p>
                      <p className="text-sm text-moroccan-cream mb-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? "fill-moroccan-gold text-moroccan-gold"
                                : "text-moroccan-darkgrey"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-moroccan-cream ml-2">
                          ({product.review_count})
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-3">
                      <div>
                        <span className="text-2xl font-display font-bold text-moroccan-gold">
                          {product.price.toFixed(2)} DH
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-moroccan-cream/70 line-through ml-2">
                            {product.original_price.toFixed(2)} DH
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-moroccan-gold hover:bg-moroccan-gold/20"
                          onClick={() => handleWishlist(product)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold px-4 py-2 shadow-moroccan transition-all duration-300 transform hover:scale-105"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.in_stock}
                        >
                          <span className="mr-2">🛒</span>
                          {product.in_stock ? 'Ajouter' : 'Rupture'}
                        </Button>
                      </div>
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
          Voir tous les produits
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
} 