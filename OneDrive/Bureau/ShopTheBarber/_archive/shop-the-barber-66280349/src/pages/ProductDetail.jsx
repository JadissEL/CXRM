
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  ShoppingCart,
  Star,
  Shield,
  Truck,
  RotateCcw,
  ChevronLeft,
  Plus,
  Minus,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useCart } from "../components/cart/CartContext";
import { useWishlist } from "../components/wishlist/WishlistContext"; // Added
import ReviewForm from "../components/reviews/ReviewForm"; // Added
import ReviewList from "../components/reviews/ReviewList"; // Added

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('id');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false); // Added

  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist(); // Added
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.list().then(list =>
      list.find(p => p.id === productId)
    ),
    enabled: !!productId
  });

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  // Added handleToggleWishlist
  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Produit non trouvé</h2>
          <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            Retour à la Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images || (product.image_url ? [product.image_url] : []);

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="text-slate-700 hover:bg-slate-100 rounded-xl"
            onClick={() => navigate(createPageUrl("Marketplace"))}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Retour à la Marketplace
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-100 relative">
                {images[selectedImage] ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <ShoppingCart className="w-24 h-24 text-slate-300" />
                  </div>
                )}
                {product.is_featured && (
                  <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white text-sm px-4 py-2 shadow-lg">
                    Produit Phare
                  </Badge>
                )}
              </div>
            </Card>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden transition-all border-2 ${
                      selectedImage === idx
                        ? 'border-blue-600 scale-105'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-sm mb-2">
                {product.brand || "Premium Brand"}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 5)
                          ? "text-yellow-400 fill-current"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-700">
                  {product.rating?.toFixed(1) || "5.0"} ({product.total_reviews || 0} avis)
                </span>
              </div>

              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-5xl font-bold text-slate-900">{product.price}€</span>
                {product.stock < 10 && product.stock > 0 && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    Plus que {product.stock} en stock
                  </Badge>
                )}
              </div>

              <p className="text-slate-600 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <Card className="border-2 border-slate-200 p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-2xl font-bold text-slate-900 w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1">
                  <p className="text-slate-600 text-sm">Prix total</p>
                  <p className="text-3xl font-bold text-slate-900">{(product.price * quantity).toFixed(2)}€</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={addedToCart || product.stock === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 text-lg font-bold rounded-xl shadow-lg"
                >
                  {product.stock === 0 ? (
                    "Rupture de stock"
                  ) : addedToCart ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Ajouté au Panier !
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Ajouter au Panier
                    </>
                  )}
                </Button>
                {/* Modified Heart button for wishlist functionality */}
                <Button
                  onClick={handleToggleWishlist}
                  variant="outline"
                  size="icon"
                  className={`w-14 h-14 rounded-xl border-2 ${
                    isInWishlist(productId)
                      ? "border-red-500 text-red-500 hover:bg-red-50"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist(productId) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "Livraison Gratuite" },
                { icon: Shield, label: "Paiement Sécurisé" },
                { icon: RotateCcw, label: "Retour 30 jours" }
              ].map((feature, idx) => (
                <Card key={idx} className="border-2 border-slate-200 p-4 text-center hover:shadow-lg transition-all">
                  <feature.icon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-700 text-xs font-medium">{feature.label}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-white border-2 border-slate-200 w-full justify-start mb-8">
              <TabsTrigger value="description" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-700">
                Description
              </TabsTrigger>
              <TabsTrigger value="specs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-700">
                Caractéristiques
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-700">
                Avis ({product.total_reviews || 0})
              </TabsTrigger>
              {/* New TabsTrigger for Questions */}
              <TabsTrigger value="questions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-700">
                Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <Card className="border-2 border-slate-200 p-8">
                <p className="text-slate-700 text-lg leading-relaxed">
                  {product.description || "Description détaillée du produit à venir..."}
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="specs">
              <Card className="border-2 border-slate-200 p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-600">Marque</span>
                    <span className="text-slate-900 font-semibold">{product.brand || "Premium"}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-600">Catégorie</span>
                    <span className="text-slate-900 font-semibold">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-slate-600">Disponibilité</span>
                    <Badge className={product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {product.stock > 0 ? `En stock (${product.stock})` : "Rupture de stock"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Modified Reviews Tab Content */}
            <TabsContent value="reviews">
              <div className="space-y-8">
                {!showReviewForm && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rédiger un Avis
                    </Button>
                  </div>
                )}

                {showReviewForm && (
                  <ReviewForm
                    targetType="product"
                    targetId={productId}
                    onSuccess={() => setShowReviewForm(false)}
                  />
                )}

                <ReviewList targetType="product" targetId={productId} />
              </div>
            </TabsContent>

            {/* New Questions Tab Content */}
            <TabsContent value="questions">
              <Card className="border-2 border-slate-200 p-8 text-center">
                <p className="text-slate-600">
                  Section Questions/Réponses à venir...
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
