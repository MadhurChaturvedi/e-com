import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { HeroSlider } from '../../components/home/HeroSlider';
import { ProductCard } from '../../components/products/ProductCard';
import { productService } from '../../services/productService';
import { useNotification } from '../../contexts/NotificationContext';

export const HomePage = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [copied, setCopied] = useState(false);
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

  // Dynamic countdown timer for Flash Deals
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 48, seconds: 25 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    productService.getHomeData()
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch(err => console.warn('Could not fetch home payload:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('WELCOME10');
    setCopied(true);
    notify('Coupon code WELCOME10 copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const renderProductSection = (title, subtitle, icon, products, filterParam) => {
    if (!loading && (!products || products.length === 0)) return null;

    return (
      <Box sx={{ mb: 5.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={1}
          mb={2.5}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(79, 70, 229, 0.08)',
                }}
              >
                {icon}
              </Box>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.25rem', md: '1.45rem' } }}>
                {title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {subtitle}
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to={`/shop?filter=${filterParam}`}
            endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
            sx={{
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'secondary.main',
              px: 1,
              '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.06)' },
            }}
          >
            Explore All
          </Button>
        </Stack>

        <Grid container spacing={2.5}>
          {loading
            ? Array.from(new Array(4)).map((_, i) => (
                <Grid item key={i} xs={6} sm={6} md={3}>
                  <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
                </Grid>
              ))
            : products.slice(0, 4).map((product) => (
                <Grid item key={product._id} xs={6} sm={6} md={3}>
                  <ProductCard product={product} />
                </Grid>
              ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Dynamic Homepage Promotional Slider */}
      <HeroSlider banners={data.banners} loading={loading} />

      <Container maxWidth="xl">
        {/* Trust Value Signals Strip */}
        <Box
          sx={{
            mb: 5,
            mt: -1.5,
            p: { xs: 2, md: 2.2 },
            borderRadius: 3,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'secondary.main' }}>
                  <LocalShippingOutlinedIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" fontSize="0.88rem">Free Shipping</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">On orders over $50</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'success.main' }}>
                  <VerifiedUserOutlinedIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" fontSize="0.88rem">100% Authentic</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">Direct brand guarantee</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(6, 182, 212, 0.08)', color: 'info.main' }}>
                  <LockOutlinedIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" fontSize="0.88rem">Secure Payments</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">256-bit encrypted checkout</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'warning.main' }}>
                  <AutorenewOutlinedIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" fontSize="0.88rem">30-Day Returns</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">Instant hassle-free refunds</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* 2. Popular Categories Section */}
        {data.categories && data.categories.length > 0 && (
          <Box sx={{ mb: 5.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              spacing={1}
              mb={2.5}
            >
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.25rem', md: '1.45rem' } }}>
                  Curated Categories
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Explore our precision-crafted catalog across top lifestyle departments
                </Typography>
              </Box>
              <Button component={RouterLink} to="/shop" endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />} sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'secondary.main' }}>
                All Categories
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {data.categories.map((cat) => (
                <Grid item key={cat._id} xs={6} sm={4} md={2.4}>
                  <Card
                    onClick={() => navigate(`/shop?category=${cat.slug}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      overflow: 'hidden',
                      textAlign: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: 'secondary.light',
                        boxShadow: '0 12px 24px -6px rgba(79, 70, 229, 0.15)',
                        '& .category-img': { transform: 'scale(1.08)' },
                      },
                    }}
                  >
                    <Box sx={{ height: { xs: 90, sm: 110 }, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      <CardMedia
                        component="img"
                        loading="lazy"
                        decoding="async"
                        image={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'}
                        alt={cat.name}
                        className="category-img"
                        sx={{ height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      />
                    </Box>
                    <CardContent sx={{ py: 1.2, px: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800} color="text.primary" noWrap fontSize="0.86rem">
                        {cat.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500} fontSize="0.72rem">
                        Shop Collection &rarr;
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 3. Trending Products */}
        {renderProductSection(
          'Trending Now',
          'The most sought-after products capturing international customer interest',
          <WhatshotIcon sx={{ color: 'error.main', fontSize: '1.25rem' }} />,
          data.trending,
          'trending'
        )}

        {/* 4. Luxury Promotional Banner Strip */}
        <Box
          sx={{
            my: 5.5,
            borderRadius: 3.5,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
            color: '#ffffff',
            p: { xs: 3, md: 4.5 },
            position: 'relative',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Subtle decorative glow circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <Grid container spacing={3.5} alignItems="center">
            <Grid item xs={12} md={7.5}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important', color: '#fbbf24 !important' }} />}
                  label={`LIMITED FLASH PROMO: ${String(timeLeft.hours).padStart(2, '0')}h : ${String(timeLeft.minutes).padStart(2, '0')}m : ${String(timeLeft.seconds).padStart(2, '0')}s`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    backgroundColor: 'rgba(251, 191, 36, 0.18)',
                    color: '#fef08a',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
              </Stack>

              <Typography variant="h4" fontWeight={800} mb={1.2} sx={{ fontSize: { xs: '1.4rem', md: '1.85rem' }, letterSpacing: '-0.025em' }}>
                Instant 10% Off On All Orders
              </Typography>
              <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 520, mb: 2.8, fontSize: '0.92rem', lineHeight: 1.65 }}>
                Upgrade your lifestyle with our premium electronics, designer apparel, and audio essentials. Enter your welcome voucher at checkout.
              </Typography>

              <Button
                component={RouterLink}
                to="/shop"
                variant="contained"
                size="medium"
                color="secondary"
                sx={{
                  px: 3.5,
                  py: 1.2,
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(79, 70, 229, 0.45)',
                }}
              >
                Claim Discount & Shop
              </Button>
            </Grid>

            <Grid item xs={12} md={4.5} sx={{ textAlign: 'center' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.8,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 300,
                }}
              >
                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.7rem' }}>
                  Official Promo Voucher
                </Typography>
                <Typography variant="h4" fontWeight={900} letterSpacing={2} sx={{ color: '#ffffff', my: 0.8, fontSize: '1.75rem' }}>
                  WELCOME10
                </Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1', mb: 1.5, fontSize: '0.75rem' }}>
                  Min order $30 &bull; Verified Active
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCopyCode}
                  startIcon={copied ? <CheckCircleIcon sx={{ color: '#10b981' }} /> : <ContentCopyIcon />}
                  sx={{
                    color: '#ffffff',
                    borderColor: copied ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.6,
                    '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  {copied ? 'Code Copied!' : 'Copy Voucher Code'}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* 5. Featured Products */}
        {renderProductSection(
          'Featured Highlights',
          'Curated top-tier flagship releases personally verified by our product curators',
          <StarIcon sx={{ color: 'warning.main', fontSize: '1.25rem' }} />,
          data.featured,
          'featured'
        )}

        {/* 6. Best Sellers */}
        {renderProductSection(
          'Best Sellers',
          'Proven consumer favorites with hundreds of 5-star customer ratings',
          <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />,
          data.bestSellers,
          'best-sellers'
        )}

        {/* 7. New Arrivals */}
        {renderProductSection(
          'New Arrivals',
          'Freshly added innovations directly from international brand releases',
          <NewReleasesIcon sx={{ color: 'secondary.main', fontSize: '1.25rem' }} />,
          data.newArrivals,
          'new-arrivals'
        )}

        {/* 8. Top Brands Section */}
        {data.brands && data.brands.length > 0 && (
          <Box sx={{ mb: 6, mt: 4 }}>
            <Box textAlign="center" mb={3.5}>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.25rem', md: '1.45rem' } }}>
                Official Brand Partners
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Guaranteed genuine manufacturer warranties and direct after-sales service
              </Typography>
            </Box>

            <Grid container spacing={2.5} justifyContent="center">
              {data.brands.map((b) => (
                <Grid item key={b._id} xs={6} sm={4} md={2.4}>
                  <Card
                    onClick={() => navigate(`/shop?brand=${b.slug}`)}
                    sx={{
                      p: 2.2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 3,
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'secondary.light',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 10px 20px -6px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary" fontSize="0.92rem">
                      {b.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.3, fontSize: '0.72rem' }}>
                      {b.description || 'Verified Partner'}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

