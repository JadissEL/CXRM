import { useState, useEffect, useMemo } from 'react';

export function useCart() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const savedCart = localStorage.getItem('shopthebarber_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    }, []);

    const saveCart = (items) => {
        localStorage.setItem('shopthebarber_cart', JSON.stringify(items));
        setCartItems(items);
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        const updated = cartItems.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );
        saveCart(updated);
    };

    const removeFromCart = (productId) => {
        const updated = cartItems.filter(item => item.id !== productId);
        saveCart(updated);
    };

    const total = useMemo(() =>
        cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        [cartItems]
    );

    return {
        cartItems,
        updateQuantity,
        removeFromCart,
        total,
        itemCount: cartItems.length,
        isLoading: false,
        error: null
    };
}
