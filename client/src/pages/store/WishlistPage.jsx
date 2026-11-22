import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProductCard } from '../../components/products/ProductCard';

export const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={300} textTransform="uppercase" letterSpacing="0.04em" mb={1.5}>
          Sign In to View Saved Items
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Sign in or register an account to save your favorite products and sync them across all your devices.
        </Typography>
        <Button
          component={RouterLink}
          to="/login"
          variant="contained"
          size="large"
          sx={{ borderRadius: 0, backgroundColor: '#000000', color: '#ffffff', px: 4 }}
        >
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
            width: 72,
            height: 72,
            borderRadius: 0,
            backgroundColor: '#e6e6e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            color: '#000000',
          }}
        >
          <FavoriteIcon sx={{ fontSize: 36, color: '#000000' }} />
        </Box>
        <Typography variant="h3" fontWeight={300} textTransform="uppercase" letterSpacing="0.04em" mb={1}>
          No Saved Items
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          You haven't saved any items to your wishlist yet. Explore our current collections.
        </Typography>
        <Button
          component={RouterLink}
          to="/shop"
          variant="contained"
          size="large"
          sx={{ borderRadius: 0, backgroundColor: '#000000', color: '#ffffff', px: 4 }}
        >
          Explore Collection
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" disableGutters sx={{ py: 5, px: { xs: 2, md: 3 } }}>
      <Typography variant="h2" fontWeight={300} textTransform="uppercase" letterSpacing="0.04em" mb={4}>
        Saved Items ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
      </Typography>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {wishlist.map((product) => {
          if (!product) return null;
          return (
            <Grid item key={product._id} xs={6} sm={6} md={4} lg={3}>
              <ProductCard product={product} />
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};
