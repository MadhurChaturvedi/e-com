import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { optimizeImageUrl, getOptimizedSrcSet } from '../../utils/imageUrl';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const inWishlist = isInWishlist(product._id);
  const hasDiscount = product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const handleCardClick = () => {
    navigate(`/product/${product.slug || product._id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const rawImage =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    (typeof product.images === 'string' ? product.images : '') ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=420&q=75';
  const displayImage = optimizeImageUrl(rawImage, { width: 420, quality: 75 });
  const imageSrcSet = getOptimizedSrcSet(rawImage, [280, 420, 600], { quality: 75 });

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        backgroundColor: 'background.paper',
        borderRadius: 3.5,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 30px -10px rgba(15, 23, 42, 0.12)',
          borderColor: 'primary.light',
          '& .product-image': {
            transform: 'scale(1.06)',
          },
          '& .quick-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Top Badges */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.8,
          zIndex: 2,
        }}
      >
        {hasDiscount && (
          <Chip
            label={`-${discountPercent}%`}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.72rem',
              height: 24,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            }}
          />
        )}
        {product.isTrending && (
          <Chip
            label="TRENDING"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              height: 22,
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          />
        )}
      </Box>

      {/* Wishlist Button */}
      <Tooltip title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}>
        <IconButton
          onClick={handleToggleWishlist}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            color: inWishlist ? '#ef4444' : 'text.secondary',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#ffffff',
              transform: 'scale(1.12)',
              color: '#ef4444',
            },
          }}
          size="small"
        >
          {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      {/* Image container */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '82%',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
        }}
      >
        <CardMedia
          component="img"
          image={displayImage}
          srcSet={imageSrcSet}
          sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 280px"
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="product-image"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Floating Quick Action Overlay */}
        <Box
          className="quick-actions"
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            gap: 1,
            opacity: 0,
            transform: 'translateY(8px)',
            transition: 'all 0.25s ease',
            zIndex: 2,
          }}
        >
          <Tooltip title="View Details">
            <IconButton
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: 'text.primary',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
                '&:hover': { backgroundColor: '#ffffff', color: 'primary.main' },
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.2 }}>
        {/* Brand & Stock Status */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.7rem',
            }}
          >
            {product.brandId?.name || product.categoryId?.name || 'Exclusive'}
          </Typography>

          {isOutOfStock ? (
            <Chip label="Sold Out" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }} />
          ) : isLowStock ? (
            <Chip label={`Only ${product.stockQuantity} left`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#d97706' }} />
          ) : (
            <Chip label="In Stock" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#16a34a' }} />
          )}
        </Stack>

        {/* Product Name */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.35,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.7em',
            fontSize: '0.96rem',
            color: 'text.primary',
            transition: 'color 0.2s ease',
            '&:hover': { color: 'secondary.main' },
          }}
        >
          {product.name}
        </Typography>

        {/* Rating */}
        <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
          <Rating
            value={product.averageRating || 5}
            precision={0.1}
            size="small"
            readOnly
            sx={{ fontSize: '0.95rem' }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize="0.75rem">
            ({product.reviewCount || 24})
          </Typography>
        </Stack>

        {/* Price & Compare Price */}
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            ${product.price?.toFixed(2)}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              sx={{
                textDecoration: 'line-through',
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              ${product.compareAtPrice?.toFixed(2)}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color={isOutOfStock ? 'inherit' : 'primary'}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          startIcon={<ShoppingBagOutlinedIcon />}
          sx={{
            py: 1.1,
            fontSize: '0.86rem',
            borderRadius: 2.5,
            fontWeight: 700,
          }}
        >
          {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
};

