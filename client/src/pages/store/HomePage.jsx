import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import { HeroSlider } from '../../components/home/HeroSlider';
import { ProductCard } from '../../components/products/ProductCard';
import { productService } from '../../services/productService';
import { useNotification } from '../../contexts/NotificationContext';
import { optimizeImageUrl, getOptimizedSrcSet } from '../../utils/imageUrl';

/**
 * Editorial Homepage
 * Implements DESIGN.md:
 * - Photography-first restrained visual language
 * - Stark monochrome palette with flat print-like materiality (no shadows, no gradients)
 * - Zero border-radius across all buttons, cards, and containers
 * - 4-column product grids on desktop
 * - Uppercase section titles with generous whitespace
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [data, setData] = useState({
    banners: [],
    categories: [],
    brands: [],
    trending: [],
    featured: [],
    bestSellers: [],
    newArrivals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getHomeData()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => console.warn('Could not fetch home payload:', err))
      .finally(() => setLoading(false));
  }, []);

  const renderProductSection = (title, subtitle, products, filterParam) => {
    if (!loading && (!products || products.length === 0)) return null;

    return (
      <Box sx={{ my: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mb: 3,
            borderBottom: '1px solid #000000',
            pb: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 300,
                fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#000000',
                lineHeight: 1,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: '#737373', fontSize: '0.8125rem', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Button
            component={RouterLink}
            to={`/shop?filter=${filterParam}`}
            sx={{
              color: '#000000',
              fontWeight: 500,
              fontSize: '0.8125rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              p: 0,
              minWidth: 'auto',
              '&:hover': { backgroundColor: 'transparent', color: '#737373' },
            }}
          >
            View All
          </Button>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {loading
            ? Array.from(new Array(4)).map((_, i) => (
                <Grid item key={i} xs={6} sm={6} md={4} lg={3}>
                  <Skeleton variant="rectangular" height={360} sx={{ backgroundColor: '#e6e6e6', borderRadius: 0 }} />
                  <Skeleton variant="text" sx={{ mt: 1, width: '70%' }} />
                  <Skeleton variant="text" sx={{ width: '40%' }} />
                </Grid>
              ))
            : products.slice(0, 4).map((product) => (
                <Grid item key={product._id} xs={6} sm={6} md={4} lg={3}>
                  <ProductCard product={product} />
                </Grid>
              ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: '#ffffff', pb: 8 }}>
      {/* 1. Campaign Hero */}
      <HeroSlider banners={data.banners} loading={loading} />

      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
        {/* 2. Curated Categories Strip */}
        {data.categories && data.categories.length > 0 && (
          <Box sx={{ my: { xs: 4, md: 7 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: 3,
                borderBottom: '1px solid #000000',
                pb: 1.5,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#000000',
                  lineHeight: 1,
                }}
              >
                Categories
              </Typography>
              <Button
                component={RouterLink}
                to="/shop"
                sx={{
                  color: '#000000',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent', color: '#737373' },
                }}
              >
                Shop All
              </Button>
            </Box>

            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
              {data.categories.slice(0, 5).map((cat) => (
                <Grid item key={cat._id} xs={6} sm={4} md={2.4}>
                  <Box
                    onClick={() => navigate(`/shop?category=${cat.slug}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 0,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        paddingTop: '120%',
                        backgroundColor: '#e6e6e6',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 0,
                      }}
                    >
                      <Box
                        component="img"
                        loading="lazy"
                        decoding="async"
                        image={optimizeImageUrl(cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', { width: 360, quality: 75 })}
                        src={optimizeImageUrl(cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', { width: 360, quality: 75 })}
                        srcSet={getOptimizedSrcSet(cat.image, [200, 360, 500], { quality: 75 })}
                        sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 20vw"
                        alt={cat.name}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'opacity 0.2s ease',
                          '&:hover': { opacity: 0.9 },
                        }}
                      />
                    </Box>
                    <Box sx={{ pt: 1, textAlign: 'left' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 400,
                          fontSize: '0.875rem',
                          color: '#000000',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {cat.name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 3. Trending Now Section (4 Columns on Desktop) */}
        {renderProductSection(
          'Trending Now',
          'Selected styles from our current seasonal lookbook',
          data.trending,
          'trending'
        )}

        {/* 4. Editorial Flat Campaign Feature Banner (Monochrome, No Gradients/Shadows) */}
        <Box
          sx={{
            my: { xs: 6, md: 9 },
            backgroundColor: '#000000',
            color: '#ffffff',
            p: { xs: 4, sm: 6, md: 8 },
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Box sx={{ maxWidth: '680px' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#737373',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 600,
                display: 'block',
                mb: 1.5,
              }}
            >
              Exclusive Promotion
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                lineHeight: 1.05,
                mb: 2,
                color: '#ffffff',
              }}
            >
              10% Off Your Next Order
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#a3a3a3',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                mb: 3.5,
              }}
            >
              Sign up today or use code WELCOME10 at checkout to unlock savings across all newly added items and wardrobe essentials.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={RouterLink}
                to="/shop"
                variant="contained"
                sx={{
                  borderRadius: 0,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  px: 4,
                  py: 1.3,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  letterSpacing: '0.04em',
                  '&:hover': {
                    backgroundColor: '#e6e6e6',
                  },
                }}
              >
                Shop Now
              </Button>

              <Button
                onClick={() => {
                  navigator.clipboard?.writeText('WELCOME10');
                  notify('Promo code WELCOME10 copied!', 'info');
                }}
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  px: 4,
                  py: 1.3,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  letterSpacing: '0.04em',
                  '&:hover': {
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    borderColor: '#ffffff',
                  },
                }}
              >
                Copy Code: WELCOME10
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* 5. Campaign Featured Products (4 Columns on Desktop) */}
        {renderProductSection(
          'Campaign Essentials',
          'Iconic staples and modern textures crafted for daily wear',
          data.featured,
          'featured'
        )}

        {/* 6. Editorial Value Pillars (Store locator, Delivery, Guarantee) */}
        <Box
          sx={{
            my: { xs: 6, md: 8 },
            py: 4,
            borderTop: '1px solid #e6e6e6',
            borderBottom: '1px solid #e6e6e6',
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <LocalShippingOutlinedIcon sx={{ fontSize: '1.3rem', color: '#000000', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                    Free Delivery Over $50
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                    Complimentary standard shipping on all qualifying orders
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <PlaceOutlinedIcon sx={{ fontSize: '1.3rem', color: '#000000', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                    Store Locator
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                    Find participating locations and check in-store stock
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <AutorenewOutlinedIcon sx={{ fontSize: '1.3rem', color: '#000000', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                    30-Day Returns
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                    Simple returns and exchanges in store and online
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <VerifiedUserOutlinedIcon sx={{ fontSize: '1.3rem', color: '#000000', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                    Quality Assured
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                    Designed with sustainable materials and verified standards
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};
