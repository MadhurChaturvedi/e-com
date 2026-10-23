import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'novastore_guest_cart';

// Helper to compute subtotal, shipping, and total prices instantaneously
const computePricing = (items = []) => {
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product?.price || i.price || 0) * (i.quantity || 1),
    0
  );
  const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 10;
  return {
    subtotal,
    shippingFee,
    freeShippingThreshold: 50,
    total: subtotal + shippingFee,
  };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { notify } = useNotification();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    pricing: { subtotal: 0, shippingFee: 0, total: 0 },
  });
  const [loading, setLoading] = useState(false);

  // Debounce map for remote quantity updates to prevent HTTP request flooding on rapid clicks
  const quantityDebounceMap = useRef(new Map());

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
          } catch {
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
          const rawItems = JSON.parse(saved);
          if (Array.isArray(rawItems)) {
            const normalizedItems = rawItems.map((item) => {
              const p = (typeof item.product === 'object' && item.product) || {};
              const resolvedImages = Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : (Array.isArray(item.images) && item.images.length > 0
                  ? item.images
                  : (p.image ? [p.image] : (item.image ? [item.image] : [])));
              const primaryImage = resolvedImages[0] || p.image || item.image || '';
              const unitPrice = p.price ?? item.price ?? 0;
              const prodName = p.name || item.name || 'Product';
              const pid = p._id || item.productId || item._id;

              return {
                ...item,
                _id: item._id || `guest-${pid}-${Date.now()}`,
                productId: pid,
                product: {
                  ...p,
                  _id: pid,
                  name: prodName,
                  images: resolvedImages,
                  image: primaryImage,
                  price: unitPrice,
                },
                image: primaryImage,
                images: resolvedImages,
                name: prodName,
                price: unitPrice,
              };
            });

            setCart({
              items: normalizedItems,
              itemCount: normalizedItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
              pricing: computePricing(normalizedItems),
            });
          } else {
            setCart({ items: [], itemCount: 0, pricing: { subtotal: 0, shippingFee: 0, total: 0 } });
          }
        } catch {
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

  // Instant Optimistic Add to Cart (0ms perceived response)
  const addToCart = async (product, quantity = 1, variantId = null) => {
    const qty = Math.max(1, parseInt(quantity, 10));
    const previousCart = cart;

    // Resolve product ID reliably
    const targetProductId = product._id || product.id || product.productId;

    // Resolve distinct product images reliably
    const resolvedImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : (typeof product.images === 'string' ? [product.images] : []));
    const primaryImage = resolvedImages[0] || product.image || '';
    const unitPrice = product.price ?? 0;

    // 1. Optimistic Local Calculation
    const currentItems = [...cart.items];
    const existingIdx = currentItems.findIndex(
      (i) =>
        (i.product?._id || i.productId || i._id) === targetProductId &&
        (i.variantId === variantId || (!i.variantId && !variantId))
    );

    let optimisticItems;

    if (existingIdx > -1) {
      optimisticItems = currentItems.map((item, idx) => {
        if (idx === existingIdx) {
          const newQty = item.quantity + qty;
          const pPrice = item.product?.price ?? item.price ?? unitPrice;
          return {
            ...item,
            quantity: newQty,
            itemTotal: pPrice * newQty,
          };
        }
        return item;
      });
    } else {
      optimisticItems = [
        ...currentItems,
        {
          _id: `temp-${Date.now()}-${Math.random()}`,
          productId: targetProductId,
          product: {
            _id: targetProductId,
            name: product.name,
            slug: product.slug,
            images: resolvedImages,
            image: primaryImage,
            price: unitPrice,
            compareAtPrice: product.compareAtPrice,
            stockQuantity: product.stockQuantity,
            SKU: product.SKU,
            isActive: product.isActive !== false,
          },
          image: primaryImage,
          images: resolvedImages,
          name: product.name,
          variantId: variantId || null,
          price: unitPrice,
          quantity: qty,
          itemTotal: unitPrice * qty,
          isAvailable: true,
        },
      ];
    }

    const optimisticCart = {
      ...cart,
      items: optimisticItems,
      itemCount: optimisticItems.reduce((sum, i) => sum + i.quantity, 0),
      pricing: computePricing(optimisticItems),
    };

    // INSTANT UI UPDATE (0ms)
    setCart(optimisticCart);
    notify(`Added "${product.name}" to cart.`, 'success');

    // 2. Synchronize with backend
    if (isAuthenticated) {
      try {
        const res = await cartService.addToCart(targetProductId, qty, variantId);
        if (res.success && res.data) {
          setCart(res.data);
        }
      } catch (err) {
        // Roll back on backend validation failure (e.g. out of stock)
        setCart(previousCart);
        notify(err.message || 'Could not add product to cart.', 'error');
        throw err;
      }
    } else {
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(
          optimisticItems.map((i) => ({
            productId: i.product?._id || i.productId || i._id,
            quantity: i.quantity,
            price: i.product?.price ?? i.price ?? unitPrice,
            product: i.product,
            image: i.image || i.product?.image || primaryImage,
            images: i.images || i.product?.images || resolvedImages,
            name: i.name || i.product?.name,
            variantId: i.variantId,
          }))
        )
      );
    }
  };

  // Instant Optimistic Quantity Update with rapid-click debouncing (0ms perceived response)
  const updateQuantity = async (itemId, quantity) => {
    const qty = parseInt(quantity, 10);
    const previousCart = cart;

    let optimisticItems;
    if (qty <= 0) {
      optimisticItems = cart.items.filter((i) => i._id !== itemId);
    } else {
      optimisticItems = cart.items.map((item) => {
        if (item._id === itemId) {
          const unitPrice = item.product?.price || item.price || 0;
          return {
            ...item,
            quantity: qty,
            itemTotal: unitPrice * qty,
          };
        }
        return item;
      });
    }

    const optimisticCart = {
      ...cart,
      items: optimisticItems,
      itemCount: optimisticItems.reduce((sum, i) => sum + i.quantity, 0),
      pricing: computePricing(optimisticItems),
    };

    // INSTANT UI UPDATE (0ms) - user sees quantity number change immediately
    setCart(optimisticCart);

    if (isAuthenticated) {
      // Clear any pending debounce timer for this item
      if (quantityDebounceMap.current.has(itemId)) {
        clearTimeout(quantityDebounceMap.current.get(itemId));
      }

      // Debounce server write request by 250ms so rapid clicks don't flood the network
      const timer = setTimeout(async () => {
        quantityDebounceMap.current.delete(itemId);
        try {
          const res = await cartService.updateCartItem(itemId, qty);
          if (res.success && res.data) {
            setCart(res.data);
          }
        } catch (err) {
          // Roll back on failure
          setCart(previousCart);
          notify(err.message || 'Could not update item quantity.', 'error');
        }
      }, 250);

      quantityDebounceMap.current.set(itemId, timer);
    } else {
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(
          optimisticItems.map((i) => ({
            productId: i.product?._id || i.productId,
            quantity: i.quantity,
            price: i.product?.price || i.price,
            product: i.product,
            variantId: i.variantId,
          }))
        )
      );
    }
  };

  // Instant Optimistic Item Removal (0ms perceived response)
  const removeFromCart = async (itemId) => {
    const previousCart = cart;
    const optimisticItems = cart.items.filter((i) => i._id !== itemId);
    const optimisticCart = {
      ...cart,
      items: optimisticItems,
      itemCount: optimisticItems.reduce((sum, i) => sum + i.quantity, 0),
      pricing: computePricing(optimisticItems),
    };

    // INSTANT UI UPDATE (0ms) - item vanishes immediately
    setCart(optimisticCart);
    notify('Item removed from cart.', 'info');

    if (isAuthenticated) {
      try {
        const res = await cartService.removeFromCart(itemId);
        if (res.success && res.data) {
          setCart(res.data);
        }
      } catch (err) {
        setCart(previousCart);
        notify(err.message || 'Could not remove item.', 'error');
      }
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(optimisticItems));
    }
  };

  // Instant Clear Cart
  const clearCart = async () => {
    localStorage.removeItem(GUEST_CART_KEY);
    setCart({ items: [], itemCount: 0, pricing: { subtotal: 0, shippingFee: 0, total: 0 } });

    if (isAuthenticated) {
      try {
        await cartService.clearCart();
      } catch (err) {
        console.warn('Error clearing remote cart:', err);
      }
    }
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

export default CartContext;
