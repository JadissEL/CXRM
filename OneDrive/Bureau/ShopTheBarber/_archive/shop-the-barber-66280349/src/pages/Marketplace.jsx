import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingCart,
  Star,
  Grid3x3,
  List,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [showFilters, setShowFilters] = useState(true);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', sortBy],
    queryFn: async () => {
      const sortField = sortBy === 'price_asc' ? 'price' : 
                       sortBy === 'price_desc' ? '-price' :
                       sortBy === 'newest' ? '-created_date' : '-is_featured';
      return await base44.entities.Product.list(sortField);
    }
  });

  const categories = [
    { id: "beard_care", label: "Soin de la Barbe", icon: "🧔" },
    { id: "hair_care", label: "Soin des Cheveux", icon: "💇" },
    { id: "shaving", label: "Rasage", icon: "🪒" },
    { id: "styling", label: "Coiffage", icon: "✨" },
    { id: "tools", label: "Outils", icon: "✂️" },
    { id: "accessories", label: "Accessoires", icon: "🎯" }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-[#0B2545] mb-4">Catégories</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
                className="border-[#4B5563] data-[state=checked]:bg-[#0B2545] data-[state=checked]:border-[#0B2545]"
              />
              <span className="text-2xl">{category.icon}</span>
              <span className="text-[#4B5563] group-hover:text-[#0B2545] transition-colors">
                {category.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-bold text-[#0B2545] mb-4">Prix</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-[#4B5563]">
            <span>{priceRange[0]}€</span>
            <span>{priceRange[1]}€</span>
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      <Button
        variant="outline"
        className="w-full border-[#4B5563] text-[#4B5563] hover:bg-[#F7F8FA] rounded-[10px]"
        onClick={() => {
          setSelectedCategories([]);
          setPriceRange([0, 200]);
          setSearchQuery("");
        }}
      >
        Réinitialiser les Filtres
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-[#D08B3D] text-white border-0 px-5 py-2 font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            Marketplace Premium
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-[#0B2545] mb-4">
            Produits d'Exception
          </h1>
          <p className="text-xl text-[#4B5563] max-w-2xl mx-auto">
            Les meilleurs produits de grooming sélectionnés par des experts
          </p>
        </motion.div>

        {/* Search & Controls */}
        <div className="bg-white rounded-[12px] p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563] w-5 h-5" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-slate-200 text-[#0B2545] placeholder:text-[#4B5563] rounded-[10px] focus:ring-2 focus:ring-[#D08B3D] focus:border-[#D08B3D]"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-64 h-12 bg-white border-slate-200 text-[#0B2545] rounded-[10px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="featured">Les Plus Populaires</SelectItem>
                <SelectItem value="newest">Nouveautés</SelectItem>
                <SelectItem value="price_asc">Prix Croissant</SelectItem>
                <SelectItem value="price_desc">Prix Décroissant</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              {/* Desktop Filter Toggle */}
              <Button
                variant="outline"
                className={`hidden lg:flex h-12 px-4 border-slate-200 rounded-[10px] ${showFilters ? 'bg-[#0B2545]/10 text-[#0B2545] border-[#0B2545]' : 'bg-white text-[#4B5563]'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-12 px-4 border-slate-200 rounded-[10px]">
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="filter-sheet h-[80vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-[#0B2545]">Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  className={`h-12 px-4 border-slate-200 rounded-[10px] ${viewMode === 'grid' ? 'bg-[#0B2545]/10 text-[#0B2545] border-[#0B2545]' : 'bg-white text-[#4B5563]'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className={`h-12 px-4 border-slate-200 rounded-[10px] ${viewMode === 'list' ? 'bg-[#0B2545]/10 text-[#0B2545] border-[#0B2545]' : 'bg-white text-[#4B5563]'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="hidden lg:block w-80 shrink-0"
              >
                <div className="bg-white rounded-[12px] p-6 sticky top-24 shadow-lg">
                  <h2 className="text-xl font-bold text-[#0B2545] mb-6 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filtres
                  </h2>
                  <FilterContent />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[#4B5563]">
                <span className="font-bold text-[#0B2545] text-xl">{filteredProducts.length}</span> produit(s)
              </p>
            </div>

            {isLoading ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="rounded-[12px] border-slate-200">
                    <Skeleton className="aspect-square w-full rounded-t-[12px]" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-[12px] p-16 text-center shadow-lg">
                <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-[#0B2545] mb-3">
                  Aucun produit trouvé
                </h3>
                <p className="text-[#4B5563] mb-6">
                  Essayez de modifier vos filtres
                </p>
                <Button
                  className="btn-accent"
                  onClick={() => {
                    setSelectedCategories([]);
                    setPriceRange([0, 200]);
                    setSearchQuery("");
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group card-provider overflow-hidden">
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D08B3D]/20 to-[#D08B3D]/5">
                            <ShoppingCart className="w-16 h-16 text-[#D08B3D]/30" />
                          </div>
                        )}
                        
                        {product.is_featured && (
                          <Badge className="absolute top-3 right-3 bg-[#D08B3D] border-0 text-white">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Top
                          </Badge>
                        )}

                        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0B2545] shadow-lg min-h-[44px] min-w-[44px]"
                          >
                            <Heart className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-5 bg-white">
                        <p className="text-xs text-[#4B5563] mb-1 uppercase tracking-wider">
                          {product.brand || "Premium"}
                        </p>
                        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                          <h3 className="font-bold text-[#0B2545] mb-2 line-clamp-2 text-lg group-hover:text-[#D08B3D] transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating || 5)
                                    ? "text-[#D08B3D] fill-current"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#4B5563]">
                            ({product.total_reviews || 0})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-[#0B2545]">
                            {product.price}€
                          </span>
                          <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                            <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                              Voir
                            </Button>
                          </Link>
                        </div>

                        {product.stock < 10 && product.stock > 0 && (
                          <p className="text-xs text-[#D6454A] mt-2 font-medium">
                            Plus que {product.stock} en stock
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}