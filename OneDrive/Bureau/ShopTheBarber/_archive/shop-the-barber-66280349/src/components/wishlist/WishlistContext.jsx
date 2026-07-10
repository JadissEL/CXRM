import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    loadUser();
  }, []);

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Wishlist.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async ({ product, notifyOnPriceDrop = false }) => {
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        throw new Error('User not authenticated');
      }
      
      return await base44.entities.Wishlist.create({
        user_id: user.id,
        product_id: product.id,
        added_date: new Date().toISOString(),
        notify_on_price_drop: notifyOnPriceDrop,
        original_price: product.price
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      const item = wishlistItems.find(w => w.product_id === productId);
      if (item) {
        await base44.entities.Wishlist.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const toggleWishlist = async (product, notifyOnPriceDrop = false) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlistMutation.mutateAsync(product.id);
    } else {
      await addToWishlistMutation.mutateAsync({ product, notifyOnPriceDrop });
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist: (product, notify) => addToWishlistMutation.mutate({ product, notifyOnPriceDrop: notify }),
        removeFromWishlist: (productId) => removeFromWishlistMutation.mutate(productId),
        toggleWishlist,
        isInWishlist,
        getWishlistCount
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}