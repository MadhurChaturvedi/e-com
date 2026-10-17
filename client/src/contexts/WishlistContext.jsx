import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useNotification } from './NotificationContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await wishlistService.getWishlist();
      if (res.success && Array.isArray(res.data)) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.warn('Could not load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      return wishlist.some(item => (item._id || item) === productId);
    },
    [wishlist]
  );

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      notify('Please sign in to save items to your wishlist.', 'info');
      return;
    }

    const productId = product._id;
    const exists = isInWishlist(productId);

    try {
      if (exists) {
        const res = await wishlistService.removeFromWishlist(productId);
        if (res.success) {
          setWishlist(res.data);
          notify(`Removed "${product.name}" from wishlist.`, 'info');
        }
      } else {
        const res = await wishlistService.addToWishlist(productId);
        if (res.success) {
          setWishlist(res.data);
          notify(`Saved "${product.name}" to wishlist.`, 'success');
        }
      }
    } catch (err) {
      notify(err.message || 'Error updating wishlist.', 'error');
    }
  };

  const moveItemToCart = async (product) => {
    try {
      await addToCart(product, 1);
      await wishlistService.removeFromWishlist(product._id);
      setWishlist(prev => prev.filter(p => p._id !== product._id));
      notify(`Moved "${product.name}" to your cart.`, 'success');
    } catch (err) {
      notify(err.message || 'Error moving item to cart.', 'error');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        moveItemToCart,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
