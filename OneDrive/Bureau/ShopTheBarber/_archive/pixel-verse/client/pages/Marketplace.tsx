import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, Star, Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  isNew?: boolean; // Added for new products
  isPromo?: boolean; // Added for promo products
  promoPrice?: number; // Added for promo price
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export default function Marketplace() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [sortBy, setSortBy] = React.useState('featured');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const mockProducts: Product[] = [
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
      is_featured: true,
      isNew: true, // Added for new product
      isPromo: true, // Added for promo product
      promoPrice: 79.99 // Added for promo price
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
      is_featured: true,
      isNew: false, // Added for new product
      isPromo: false, // Added for promo product
      promoPrice: undefined // Added for promo price
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
      is_featured: true,
      isNew: true, // Added for new product
      isPromo: false, // Added for promo product
      promoPrice: undefined // Added for promo price
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
      is_featured: false,
      isNew: false, // Added for new product
      isPromo: false, // Added for promo product
      promoPrice: undefined // Added for promo price
    },
    {
      id: 5,
      name: "Pommade Texturante",
      description: "Pommade pour volume et texture naturelle",
      price: 32.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Cires & Pommades",
      brand: "TextureLab",
      rating: 4.5,
      review_count: 78,
      in_stock: true,
      is_featured: false,
      isNew: false, // Added for new product
      isPromo: false, // Added for promo product
      promoPrice: undefined // Added for promo price
    },
    {
      id: 6,
      name: "Ciseaux de Précision",
      description: "Ciseaux professionnels en acier inoxydable",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      category: "Outils & Accessoires",
      brand: "PrecisionTools",
      rating: 4.8,
      review_count: 94,
      in_stock: true,
      is_featured: false,
      isNew: false, // Added for new product
      isPromo: false, // Added for promo product
      promoPrice: undefined // Added for promo price
    }
  ];
  const uniqueBrands = Array.from(new Set(mockProducts.map(p => p.brand)));
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [minRating, setMinRating] = React.useState(1);

  // Filtre prix global
  const prices = mockProducts.map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;
  const [priceRange, setPriceRange] = React.useState<[number, number]>([minPrice, maxPrice]);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering Marketplace page...');

  React.useEffect(() => {
    loadCategories();
    loadProducts();
  }, [searchTerm, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      // Mock categories for now
      setCategories([
        { id: 1, name: 'Shampoings & Soins', description: 'Produits de soin capillaire' },
        { id: 2, name: 'Cires & Pommades', description: 'Produits de coiffage' },
        { id: 3, name: 'Outils & Accessoires', description: 'Outils de barbier' },
        { id: 4, name: 'Parfums & Fragrances', description: 'Parfums masculins' },
        { id: 5, name: 'Kits Complets', description: 'Kits de soin complets' },
      ]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Filter and sort products
      let filteredProducts = mockProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const inSelectedCategories = selectedCategories.length === 0 || selectedCategories.includes(product.category);
        const inPriceRange = product.price >= priceRange[0] && product.price <= priceRange[1];
        const inSelectedBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
        const matchesRating = product.rating >= minRating;
        const matchesStock = !inStockOnly || product.in_stock;
        return matchesSearch && inSelectedCategories && inPriceRange && inSelectedBrands && matchesRating && matchesStock;
      });

      // Sort products
      switch (sortBy) {
        case 'price-low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case 'featured':
        default:
          filteredProducts.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
          break;
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', product);
  };

  const handleWishlist = (product: Product) => {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', product);
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page marketplace :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal moroccan-pattern">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b-2 border-moroccan-gold/20 bg-gradient-to-r from-moroccan-darkgrey/95 to-moroccan-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-moroccan-darkgrey/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            {/* Logo & Titre */}
            <div className="flex items-center space-x-3">
              <Link to="/">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-moroccan-gold to-moroccan-copper">
                  <span className="text-lg font-bold text-moroccan-charcoal">M</span>
                </div>
              </Link>
              <span className="font-display text-xl font-bold text-moroccan-offwhite">
                Marketplace
              </span>
            </div>

            {/* Barre de recherche centrale */}
            <div className="flex-1 flex justify-center px-8">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-gold" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey text-moroccan-offwhite focus:border-moroccan-gold placeholder-moroccan-cream/50 shadow-moroccan"
                />
              </div>
            </div>

            {/* Icônes Panier & Favoris */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="relative text-moroccan-gold hover:bg-moroccan-gold/20 hover:text-moroccan-offwhite">
                <span className="text-xl">🛒</span>
                <span className="absolute -top-1 -right-1 bg-moroccan-gold text-moroccan-charcoal text-xs font-bold rounded-full px-1.5 py-0.5 border-2 border-moroccan-darkgrey">0</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-moroccan-gold hover:bg-moroccan-gold/20 hover:text-moroccan-offwhite">
                <span className="text-xl">❤️</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-xl">
                <span className="text-2xl">👑</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-moroccan-offwhite">
                Marketplace Premium
              </h1>
            </div>
            <p className="text-xl text-moroccan-cream max-w-3xl mx-auto">
              Découvrez les meilleurs produits de coiffure et de soin pour hommes, 
              sélectionnés avec soin pour votre style unique
            </p>
          </div>

          {/* Layout principal : sidebar + grid */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filtres */}
            <aside className="hidden lg:block w-72 mr-8 sticky top-24 self-start bg-moroccan-darkgrey/80 rounded-3xl shadow-moroccan-xl border-2 border-moroccan-gold/50 p-6 mb-8 animate-slide-up backdrop-blur-lg backdrop-saturate-150 ring-2 ring-moroccan-gold/10">
              <h2 className="text-xl font-bold text-moroccan-gold mb-6 flex items-center gap-2">
                <span className="text-2xl">🧩</span> Filtres
              </h2>
              {/* Filtre Catégories */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-moroccan-offwhite mb-3 flex items-center gap-2">
                  <span className="text-lg">🏷️</span> Catégories
                </h3>
                <div className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer text-moroccan-cream hover:text-moroccan-gold transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.name)}
                        onChange={() => {
                          setSelectedCategories((prev) =>
                            prev.includes(category.name)
                              ? prev.filter((c) => c !== category.name)
                              : [...prev, category.name]
                          );
                        }}
                        className="accent-moroccan-gold w-4 h-4 rounded border-moroccan-gold/60 focus:ring-moroccan-gold"
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Filtre Prix */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-moroccan-offwhite mb-3 flex items-center gap-2">
                  <span className="text-xl">💰</span> Prix
                </h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([minPrice, Number(e.target.value)])}
                    className="w-full accent-moroccan-gold bg-moroccan-darkgrey/60 rounded-lg h-2 appearance-none focus:outline-none focus:ring-2 focus:ring-moroccan-gold"
                  />
                  <div className="flex justify-between text-xs text-moroccan-gold">
                    <span>{minPrice} €</span>
                    <span>{priceRange[1]} €</span>
                  </div>
                </div>
              </div>
              {/* Filtre Marques */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-moroccan-offwhite mb-3 flex items-center gap-2">
                  <span className="text-xl">🏷️</span> Marques
                </h3>
                <div className="flex flex-col gap-2">
                  {uniqueBrands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer select-none text-moroccan-offwhite hover:text-moroccan-gold">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => {
                          setSelectedBrands((prev) =>
                            prev.includes(brand)
                              ? prev.filter((b) => b !== brand)
                              : [...prev, brand]
                          );
                        }}
                        className="accent-moroccan-gold w-4 h-4 rounded border-moroccan-gold/60 bg-moroccan-darkgrey/60 focus:ring-moroccan-gold"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Filtre Note */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-moroccan-offwhite mb-3 flex items-center gap-2">
                  <span className="text-xl">⭐</span> Note minimale
                </h3>
                <div className="flex gap-2 items-center">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMinRating(star)}
                      className={`text-2xl transition-all ${minRating >= star ? 'text-moroccan-gold scale-110' : 'text-moroccan-offwhite/40 hover:text-moroccan-gold/80'}`}
                      aria-label={`Filtrer à partir de ${star} étoiles`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-moroccan-gold font-bold">{minRating}+</span>
                </div>
              </div>
              {/* Filtre Disponibilité */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-moroccan-offwhite mb-3 flex items-center gap-2">
                  <span className="text-xl">📦</span> Disponibilité
                </h3>
                <label className="flex items-center gap-3 cursor-pointer select-none text-moroccan-offwhite hover:text-moroccan-gold">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="accent-moroccan-gold w-5 h-5 rounded focus:ring-2 focus:ring-moroccan-gold/60 border-moroccan-gold/40"
                  />
                  <span>En stock uniquement</span>
                </label>
              </div>
              {/* Les autres filtres viendront ici */}
              {/* Filtres à venir ici (catégories, prix, marques, note, stock) */}
              <div className="text-moroccan-cream text-sm opacity-60 text-center py-8">Filtres à venir…</div>
            </aside>
            {/* Drawer mobile à ajouter plus tard */}

            {/* Grille produits premium */}
            <section className="flex-1">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-moroccan-gold mx-auto"></div>
                  <p className="mt-6 text-moroccan-cream text-lg">Chargement des produits...</p>
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="relative group bg-moroccan-darkgrey/80 rounded-3xl shadow-moroccan-xl border-2 border-moroccan-gold/30 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-moroccan-xl animate-scale-in"
                    >
                      {/* Badge promo/nouveau */}
                      {product.isNew && (
                        <span className="absolute top-4 left-4 bg-moroccan-gold text-moroccan-darkgrey font-bold px-3 py-1 rounded-full text-xs shadow-gold animate-gold-glow z-10">
                          Nouveau
                        </span>
                      )}
                      {product.isPromo && (
                        <span className="absolute top-4 right-4 bg-moroccan-copper text-moroccan-offwhite font-bold px-3 py-1 rounded-full text-xs shadow-gold animate-gold-glow z-10">
                          Promo
                        </span>
                      )}
                      {/* Wishlist (cœur animé) */}
                      <button
                        className="absolute top-4 right-4 z-20 text-2xl transition-colors duration-200 hover:text-moroccan-gold focus:outline-none"
                        aria-label="Ajouter à la wishlist"
                      >
                        <span className="transition-transform duration-200 group-hover:scale-125 animate-moroccan-pulse">❤️</span>
                      </button>
                      {/* Image produit */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-56 object-cover rounded-t-3xl border-b-2 border-moroccan-gold/20 group-hover:brightness-110 transition-all duration-200"
                      />
                      {/* Infos produit */}
                      <div className="p-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-moroccan-offwhite group-hover:text-moroccan-gold transition-colors duration-200">
                            {product.name}
                          </h3>
                          <span className="text-xs text-moroccan-gold font-semibold uppercase tracking-wide">
                            {product.brand}
                          </span>
                        </div>
                        {/* Note étoiles */}
                        <div className="flex items-center gap-1 mb-1">
                          {[1,2,3,4,5].map((star) => (
                            <span key={star} className={star <= product.rating ? "text-moroccan-gold" : "text-moroccan-gold/30"}>★</span>
                          ))}
                        </div>
                        {/* Prix */}
                        <div className="flex items-center gap-2 mb-2">
                          {product.isPromo ? (
                            <>
                              <span className="text-lg font-bold text-moroccan-gold animate-gold-glow">{product.promoPrice} €</span>
                              <span className="text-sm text-moroccan-offwhite/60 line-through">{product.price} €</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-moroccan-gold">{product.price} €</span>
                          )}
                        </div>
                        {/* Bouton Ajouter au panier */}
                        <button
                          className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-darkgrey font-bold shadow-moroccan border-2 border-moroccan-gold/60 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 animate-fade-in flex items-center justify-center gap-2"
                          aria-label="Ajouter au panier"
                        >
                          <span className="text-lg">🛒</span>
                          Ajouter au panier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-moroccan-cream text-lg">Aucun produit trouvé.</div>
              )}
            </section>
          </div>
          {/* Bouton Réinitialiser les filtres */}
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedCategories([]);
                setPriceRange([minPrice, maxPrice]);
                setSelectedBrands([]);
                setMinRating(1);
                setInStockOnly(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-darkgrey font-bold shadow-moroccan-lg border-2 border-moroccan-gold/60 hover:from-moroccan-copper hover:to-moroccan-gold hover:text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold transition-all duration-200 animate-fade-in"
              aria-label="Réinitialiser les filtres"
            >
              <span className="text-lg">🔄</span>
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page marketplace (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
} 