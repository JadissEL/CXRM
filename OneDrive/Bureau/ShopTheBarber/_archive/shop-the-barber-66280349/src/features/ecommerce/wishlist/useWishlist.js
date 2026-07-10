import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useWishlist() {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showComparison, setShowComparison] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const { data: wishlistItems = [], isLoading } = useQuery({
        queryKey: ['wishlist', user?.id],
        queryFn: () => base44.entities.WishlistItem.filter({ user_id: user.id }),
        enabled: !!user
    });

    const { data: products = [] } = useQuery({
        queryKey: ['wishlist-products', wishlistItems],
        queryFn: async () => {
            if (!wishlistItems.length) return [];
            const productIds = wishlistItems.map(item => item.product_id);
            return base44.entities.Product.filter({ id: productIds });
        },
        enabled: wishlistItems.length > 0
    });

    const { data: priceAlerts = [] } = useQuery({
        queryKey: ['price-alerts', user?.id],
        queryFn: () => base44.entities.PriceAlert.filter({ user_id: user.id }),
        enabled: !!user
    });

    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleCompare = () => {
        if (selectedProducts.length >= 2) {
            setShowComparison(true);
        }
    };

    return {
        wishlistItems,
        products,
        priceAlerts,
        selectedProducts,
        showComparison,
        setShowComparison,
        toggleProductSelection,
        handleCompare,
        isLoading,
        error: null
    };
}
