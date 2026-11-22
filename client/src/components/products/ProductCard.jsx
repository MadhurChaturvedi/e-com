import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { optimizeImageUrl, getOptimizedSrcSet } from '../../utils/imageUrl';

/**
 * Editorial Fashion Product Card
 * Implements DESIGN.md:
 * - Surface: Light gray (#E6E6E6) background filling image area
 * - Typography: Product name uses label (0.875rem, light/normal), price uses body-small (0.8125rem)
 * - Composition: Image fills card top, text sits flush left below with minimal vertical padding
 * - Overlaid circular wishlist heart button
 * - Rectilinear materiality: zero border-radius, no elevation shadows
 */
export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  const inWishlist = isInWishlist(product._id);
  const hasDiscount = product.compareAtPrice > product.price;
  const isOutOfStock = product.stockQuantity <= 0;

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
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=75';

  const displayImage = optimizeImageUrl(rawImage, { width: 500, quality: 75 });
  const imageSrcSet = getOptimizedSrcSet(rawImage, [300, 500, 700], { quality: 75 });

  return (
    <Box
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        backgroundColor: '#ffffff',
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      {/* Image Container with neutral gray #E6E6E6 background */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '133%', // 3:4 portrait aspect ratio (fashion editorial standard)
          backgroundColor: '#e6e6e6',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        <Box
          component="img"
          src={displayImage}
          srcSet={imageSrcSet}
          sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
          alt={product.name}
          loading="lazy"
          decoding="async"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
            opacity: isOutOfStock ? 0.6 : 1,
          }}
        />

        {/* Wishlist Heart Icon: Circular hit area as specified in DESIGN.md */}
        <Tooltip title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}>
          <IconButton
            onClick={handleToggleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              width: 34,
              height: 34,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              color: inWishlist ? '#eb0010' : '#000000',
              boxShadow: 'none',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#ffffff',
                color: '#eb0010',
              },
            }}
          >
            {inWishlist ? (
              <FavoriteIcon sx={{ fontSize: '1.05rem', color: '#eb0010' }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: '1.05rem', color: '#000000' }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Sold Out Badge */}
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: '#ffffff',
              py: 0.75,
              textAlign: 'center',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Sold Out
          </Box>
        )}

        {/* Hover Quick Add Action */}
        {!isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
              transition: 'all 0.2s ease',
              zIndex: 3,
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddToCart}
              sx={{
                borderRadius: 0,
                backgroundColor: '#000000',
                color: '#ffffff',
                py: 1.2,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                fontWeight: 500,
                textTransform: 'uppercase',
                border: 'none',
                '&:hover': {
                  backgroundColor: '#262626',
                },
              }}
            >
              Add to Bag
            </Button>
          </Box>
        )}
      </Box>

      {/* Product Information below image, flush left with minimal padding */}
      <Box sx={{ pt: 1.2, pb: 1.5, textAlign: 'left' }}>
        {/* Product Name (label token: 0.875rem, light/normal weight) */}
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.25,
            color: '#000000',
            mb: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {product.name}
        </Typography>

        {/* Price (body-small token: 0.8125rem, 400 weight) */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: hasDiscount ? '#eb0010' : '#000000',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            ${product.price?.toFixed(2)}
          </Typography>

          {hasDiscount && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: '#737373',
                textDecoration: 'line-through',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              ${product.compareAtPrice?.toFixed(2)}
            </Typography>
          )}
        </Box>

        {/* Minimalist Color Swatch Mockup (1px black border) */}
        <Box sx={{ display: 'flex', gap: 0.6, mt: 0.8 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              backgroundColor: '#000000',
              border: '1px solid #000000',
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 10,
              backgroundColor: '#e6e6e6',
              border: '1px solid #737373',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
