import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCart } from "./CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShoppingCart, X, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MiniCart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-xs h-5 w-5 flex items-center justify-center p-0 text-white">
              {cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-white">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-slate-900">
            Mon Panier
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {cartCount} {cartCount > 1 ? 'articles' : 'article'} dans votre panier
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex flex-col h-[calc(100vh-200px)]">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-20 h-20 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Votre panier est vide
              </h3>
              <p className="text-slate-600 mb-6">
                Découvrez nos produits premium
              </p>
              <Link to={createPageUrl("Marketplace")} onClick={() => setIsOpen(false)}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Explorer la Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {item.price.toFixed(2)}€
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <SheetFooter className="border-t border-slate-200 pt-4 mt-4">
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-slate-900">{cartTotal.toFixed(2)}€</span>
                  </div>
                  <Link to={createPageUrl("Checkout")} onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg font-bold shadow-lg">
                      Commander
                    </Button>
                  </Link>
                </div>
              </SheetFooter>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}