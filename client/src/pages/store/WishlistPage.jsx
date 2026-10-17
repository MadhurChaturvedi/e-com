import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';

export const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, moveItemToCart } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1.5}>
          Sign In to View Wishlist
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Sign in or create an account to save your favorite products and sync them across all your devices.
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained" size="large" sx={{ borderRadius: 2.5 }}>
          Sign In Now
        </Button>
      </Container>
    );
  }

  if (wishlist.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            color: 'error.main',
          }}
        >
          <FavoriteIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1}>
          Your Wishlist is Empty
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          You haven't saved any products to your wishlist yet. Explore our curated collections!
        </Typography>
        <Button component={RouterLink} to="/shop" variant="contained" size="large" sx={{ borderRadius: 2.5 }}>
          Explore Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={4}>
        Saved Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
      </Typography>

      <Grid container spacing={3}>
        {wishlist.map((product) => {
          if (!product) return null;
          const isOutOfStock = product.stockQuantity <= 0;
          return (
            <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={() => toggleWishlist(product)}
                  color="error"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    zIndex: 2,
                    '&:hover': { backgroundColor: '#ffffff' },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>

                <Box
                  sx={{
                    pt: '75%',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                  }}
                  onClick={() => navigate(`/product/${product.slug || product._id}`)}
                >
                  <CardMedia
                    component="img"
                    image={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'}
                    alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    {product.brandId?.name || 'Exclusive'}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => navigate(`/product/${product.slug || product._id}`)}
                  >
                    {product.name}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" mt={1}>
                    <Typography variant="h6" fontWeight={800}>
                      ${product.price?.toFixed(2)}
                    </Typography>
                    {isOutOfStock ? (
                      <Chip label="Out of Stock" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ) : (
                      <Chip label="In Stock" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={isOutOfStock}
                    startIcon={<ShoppingBagOutlinedIcon />}
                    onClick={() => moveItemToCart(product)}
                    sx={{ borderRadius: 2 }}
                  >
                    {isOutOfStock ? 'Unavailable' : 'Move to Cart'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};
