import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { bannerService } from '../../services/bannerService';
import { optimizeImageUrl, getOptimizedSrcSet } from '../../utils/imageUrl';

const fallbackBanner = {
  title: 'Autumn / Winter Collection',
  subtitle: 'Contemporary tailoring, refined silhouettes, and essential wardrobe foundations crafted for effortless modern living.',
  image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=75',
  secondaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=75',
  ctaLabel: 'Shop Collection',
  destinationUrl: '/shop',
};

/**
 * Editorial Campaign Hero
 * Implements DESIGN.md:
 * - Anatomy: Asymmetric layout with large editorial image left, secondary image right, serif headline above
 * - Surface: White background, images on neutral gray (#E6E6E6)
 * - Typography: Headline uses {typography.hero-display} (Playfair Display / Hm Sergel Headline),
 *   description uses {typography.body}
 * - Flat materiality: zero border-radius, no drop shadows or heavy gradient overlays
 */
export const HeroSlider = ({ banners: propBanners = null, loading: propLoading = false }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState(propBanners || []);
  const [loading, setLoading] = useState(!propBanners && !propLoading);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (Array.isArray(propBanners)) {
      if (propBanners.length > 0) {
        setBanners(propBanners);
      } else if (!propLoading) {
        setBanners([fallbackBanner]);
      }
      setLoading(Boolean(propLoading));
      return;
    }

    if (propBanners === null) {
      bannerService.getActiveBanners()
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setBanners(res.data);
          } else {
            setBanners([fallbackBanner]);
          }
        })
        .catch(() => setBanners([fallbackBanner]))
        .finally(() => setLoading(false));
    }
  }, [propBanners, propLoading]);

  const activeBanner = banners[currentIndex] || fallbackBanner;

  const handleCtaClick = () => {
    const dest = activeBanner.destinationUrl || '/shop';
    if (dest.startsWith('http')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
    } else {
      navigate(dest);
    }
  };

  if (loading || propLoading) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 }, my: 4 }}>
        <Skeleton variant="rectangular" height={500} sx={{ backgroundColor: '#e6e6e6', borderRadius: 0 }} />
      </Container>
    );
  }

  const primaryImage = optimizeImageUrl(activeBanner.image || fallbackBanner.image, { width: 1400, quality: 75 });
  const primarySrcSet = getOptimizedSrcSet(activeBanner.image || fallbackBanner.image, [600, 1000, 1400], { quality: 75 });
  const secondaryImage = optimizeImageUrl(
    activeBanner.secondaryImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=75',
    { width: 800, quality: 75 }
  );

  return (
    <Box sx={{ width: '100%', backgroundColor: '#ffffff', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
        {/* Editorial Headline & Description Above Photography as defined in DESIGN.md */}
        <Box sx={{ maxWidth: '820px', mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#000000',
              display: 'block',
              mb: 1,
            }}
          >
            Campaign 2026 / 2027
          </Typography>

          {/* hero-display serif headline */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: "'Playfair Display', 'Hm Sergel Headline', Didot, Georgia, serif",
              fontWeight: 400,
              fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4rem' },
              lineHeight: 1.06,
              color: '#000000',
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            {activeBanner.title || fallbackBanner.title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#737373',
              fontSize: { xs: '0.875rem', md: '1rem' },
              lineHeight: 1.5,
              maxWidth: '640px',
              mb: 3,
            }}
          >
            {activeBanner.subtitle || fallbackBanner.subtitle}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={handleCtaClick}
              sx={{
                borderRadius: 0,
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '1px solid #000000',
                px: 3.5,
                py: 1.3,
                fontSize: '0.875rem',
                letterSpacing: '0.06em',
                fontWeight: 500,
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: '#262626',
                },
              }}
            >
              {activeBanner.ctaLabel || 'Explore Collection'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/shop')}
              sx={{
                borderRadius: 0,
                borderColor: '#000000',
                color: '#000000',
                px: 3.5,
                py: 1.3,
                fontSize: '0.875rem',
                letterSpacing: '0.06em',
                fontWeight: 500,
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: '#000000',
                  color: '#ffffff',
                },
              }}
            >
              Shop All
            </Button>
          </Stack>
        </Box>

        {/* Asymmetric Two-Column Photography Layout: Large Image Left, Secondary Image Right */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2.2fr 1fr' },
            gap: 2,
            width: '100%',
          }}
        >
          {/* Primary Editorial Image Container on Neutral Gray #E6E6E6 */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: { xs: '65%', md: '56%' },
              backgroundColor: '#e6e6e6',
              overflow: 'hidden',
              borderRadius: 0,
            }}
          >
            <Box
              component="img"
              src={primaryImage}
              srcSet={primarySrcSet}
              sizes="(max-width: 960px) 100vw, 70vw"
              alt={activeBanner.title || 'Campaign Photography'}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
              }}
            />
          </Box>

          {/* Secondary Editorial Still Life Container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: { xs: '50%', md: '100%' },
              backgroundColor: '#e6e6e6',
              overflow: 'hidden',
              borderRadius: 0,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Box
              component="img"
              src={secondaryImage}
              alt="Editorial Details"
              loading="lazy"
              decoding="async"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
              }}
            />
          </Box>
        </Box>

        {/* Slide Indicators if multiple active banners */}
        {banners.length > 1 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-start' }}>
            {banners.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrentIndex(i)}
                sx={{
                  width: currentIndex === i ? 28 : 10,
                  height: 2,
                  backgroundColor: currentIndex === i ? '#000000' : '#d4d4d4',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};
