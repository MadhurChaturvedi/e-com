import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'novastore_guest_cart';

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { notify } = useNotification();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    pricing: { subtotal: 0, shippingFee: 0, total: 0 },
  });
  const [loading, setLoading] = useState(false);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        // Check if there are guest items to merge
        const savedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        if (savedGuestCart) {
          try {
            const guestItems = JSON.parse(savedGuestCart);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              await cartService.mergeCart(guestItems);
              localStorage.removeItem(GUEST_CART_KEY);
            }
          } catch (e) {
            localStorage.removeItem(GUEST_CART_KEY);
          }
        }

        const res = await cartService.getCart();
        if (res.success && res.data) {
          setCart(res.data);
        }
      } catch (err) {
        console.error('Failed to load user cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Load guest cart from localStorage
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (saved) {
        try {
          const items = JSON.parse(saved);
          const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
          setCart({
            items,
            itemCount: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
            pricing: {
              subtotal,
              shippingFee: subtotal >= 50 || subtotal === 0 ? 0 : 10,
              total: subtotal + (subtotal >= 50 || subtotal === 0 ? 0 : 10),
            },
          });
        } catch (e) {
          setCart({ items: [], itemCount: 0, pricing: { subtotal: 0, shippingFee: 0, total: 0 } });
        }
      } else {
        setCart({ items: [], itemCount: 0, pricing: { subtotal: 0, shippingFee: 0, total: 0 } });
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1, variantId = null) => {
    const qty = Math.max(1, parseInt(quantity, 10));

    if (isAuthenticated) {
      try {
        const res = await cartService.addToCart(product._id, qty, variantId);
        if (res.success && res.data) {
          setCart(res.data);
          notify(`Added "${product.name}" to cart.`, 'success');
        }
      } catch (err) {
        notify(err.message || 'Could not add product to cart.', 'error');
        throw err;
      }
    } else {
      // Guest cart logic
      const currentItems = [...cart.items];
      const existingIdx = currentItems.findIndex(
        i => (i.product?._id || i.productId) === product._id
      );

      if (existingIdx > -1) {
        currentItems[existingIdx].quantity += qty;
      } else {
        currentItems.push({
          _id: `guest-${Date.now()}-${Math.random()}`,
          productId: product._id,
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            images: product.images,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stockQuantity: product.stockQuantity,
            SKU: product.SKU,
            isActive: product.isActive,
          },
          price: product.price,
          quantity: qty,
          itemTotal: product.price * qty,
          isAvailable: true,
        });
      }

      const subtotal = currentItems.reduce(
        (sum, i) => sum + (i.product?.price || i.price || 0) * i.quantity,
        0
      );
      const newCart = {
        items: currentItems,
        itemCount: currentItems.reduce((sum, i) => sum + i.quantity, 0),
        pricing: {
          subtotal,
          shippingFee: subtotal >= 50 ? 0 : 10,
          total: subtotal + (subtotal >= 50 ? 0 : 10),
        },
      };

      setCart(newCart);
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(
          currentItems.map(i => ({
            productId: i.product?._id || i.productId,
            quantity: i.quantity,
            price: i.product?.price || i.price,
            product: i.product,
          }))
        )
      );
      notify(`Added "${product.name}" to cart.`, 'success');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    const qty = parseInt(quantity, 10);

    if (isAuthenticated) {
      try {
        const res = await cartService.updateCartItem(itemId, qty);
        if (res.success && res.data) {
          setCart(res.data);
        }
      } catch (err) {
        notify(err.message || 'Could not update item quantity.', 'error');
      }
    } else {
      let currentItems = [...cart.items];
      if (qty <= 0) {
        currentItems = currentItems.filter(i => i._id !== itemId);
      } else {
        const item = currentItems.find(i => i._id === itemId);
        if (item) {
          item.quantity = qty;
          item.itemTotal = (item.product?.price || item.price) * qty;
        }
      }

      const subtotal = currentItems.reduce(
        (sum, i) => sum + (i.product?.price || i.price || 0) * i.quantity,
        0
      );
      const newCart = {
        items: currentItems,
        itemCount: currentItems.reduce((sum, i) => sum + i.quantity, 0),
        pricing: {
          subtotal,
          shippingFee: subtotal >= 50 || subtotal === 0 ? 0 : 10,
          total: subtotal + (subtotal >= 50 || subtotal === 0 ? 0 : 10),
        },
      };
      setCart(newCart);
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(
          currentItems.map(i => ({
            productId: i.product?._id || i.productId,
            quantity: i.quantity,
            price: i.product?.price || i.price,
            product: i.product,
          }))
        )
      );
    }
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        const res = await cartService.removeFromCart(itemId);
        if (res.success && res.data) {
          setCart(res.data);
          notify('Item removed from cart.', 'info');
        }
      } catch (err) {
        notify(err.message || 'Could not remove item.', 'error');
      }
    } else {
      const currentItems = cart.items.filter(i => i._id !== itemId);
      const subtotal = currentItems.reduce(
        (sum, i) => sum + (i.product?.price || i.price || 0) * i.quantity,
        0
      );
      const newCart = {
        items: currentItems,
        itemCount: currentItems.reduce((sum, i) => sum + i.quantity, 0),
        pricing: {
          subtotal,
          shippingFee: subtotal >= 50 || subtotal === 0 ? 0 : 10,
          total: subtotal + (subtotal >= 50 || subtotal === 0 ? 0 : 10),
        },
      };
      setCart(newCart);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentItems));
      notify('Item removed from cart.', 'info');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
      } catch (err) {
        console.warn('Error clearing remote cart:', err);
      }
    }
    localStorage.removeItem(GUEST_CART_KEY);
    setCart({ items: [], itemCount: 0, pricing: { subtotal: 0, shippingFee: 0, total: 0 } });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount: cart.itemCount || 0,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
