import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { bannerService } from '../../services/bannerService';

const fallbackBanner = {
  title: 'Next-Gen Living. Engineered to Perfection.',
  subtitle: 'Discover ultra-premium electronics, minimalist lifestyle essentials, and iconic designer gear with fast express delivery.',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=85',
  ctaLabel: 'Explore Collection',
  destinationUrl: '/shop',
};

export const HeroSlider = ({ banners: propBanners = null }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState(propBanners || []);
  const [loading, setLoading] = useState(!propBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (propBanners) {
      setBanners(propBanners);
      setLoading(false);
      return;
    }

    const fetchBanners = async () => {
      try {
        setLoading(true);
        const res = await bannerService.getActiveBanners();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBanners(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch active banners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [propBanners]);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handleCtaClick = (destination) => {
    if (!destination) return;
    if (destination.startsWith('http://') || destination.startsWith('https://')) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    } else {
      navigate(destination);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <Skeleton
          variant="rounded"
          height={500}
          sx={{ borderRadius: 4, width: '100%' }}
        />
      </Container>
    );
  }

  const current = banners[currentIndex] || fallbackBanner;

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1.5, md: 2 }, mb: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          minHeight: { xs: 360, sm: 400, md: 440 },
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 20px 50px -15px rgba(15, 23, 42, 0.22)',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${current.image})`,
            backgroundSize: 'cover',
            backgroundPosition: { xs: '65% center', md: 'center' },
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'brightness(0.9)',
          }}
        />

        {/* Sophisticated Dark Glass Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: {
              xs: 'linear-gradient(0deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.75) 55%, rgba(15, 23, 42, 0.2) 100%)',
              md: 'linear-gradient(90deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.82) 48%, rgba(15, 23, 42, 0.25) 100%)',
            },
          }}
        />

        {/* Content Box */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: { xs: 4, md: 5 },
            px: { xs: 3, sm: 5, md: 6 },
            maxWidth: { xs: '100%', md: '560px' },
          }}
        >
          {/* Top Pill Badge */}
          <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
            <Chip
              icon={<SparklesIcon sx={{ fontSize: '0.9rem !important', color: '#6366f1 !important' }} />}
              label="SPECIAL FEATURED DROP"
              size="small"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.18)',
                color: '#a5b4fc',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                backdropFilter: 'blur(8px)',
                py: 0.3,
              }}
            />
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: '0.85rem !important', color: '#10b981 !important' }} />}
              label="100% Genuine"
              size="small"
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                fontWeight: 700,
                fontSize: '0.68rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Stack>

          {/* Heading */}
          <Typography
            variant="h1"
            sx={{
              color: '#ffffff',
              fontSize: { xs: '1.9rem', sm: '2.5rem', md: '2.9rem' },
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              mb: 1.5,
            }}
          >
            {current.title}
          </Typography>

          {/* Subtitle */}
          {current.subtitle && (
            <Typography
              variant="body1"
              sx={{
                color: '#cbd5e1',
                fontSize: { xs: '0.88rem', sm: '0.98rem' },
                lineHeight: 1.55,
                mb: 3,
                maxWidth: 480,
              }}
            >
              {current.subtitle}
            </Typography>
          )}

          {/* CTA & Trust badges */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button
              variant="contained"
              size="medium"
              color="secondary"
              endIcon={<ArrowForwardOutlinedIcon />}
              onClick={() => handleCtaClick(current.destinationUrl)}
              sx={{
                px: 3.2,
                py: 1.2,
                fontSize: '0.92rem',
                borderRadius: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.5)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -4px rgba(79, 70, 229, 0.65)',
                },
              }}
            >
              {current.ctaLabel || 'Explore Catalog'}
            </Button>

            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate('/shop')}
              sx={{
                px: 2.8,
                py: 1.2,
                fontSize: '0.9rem',
                borderRadius: 2,
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              View Trending
            </Button>
          </Stack>
        </Box>

        {/* Prev / Next Manual Arrows */}
        {banners.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                top: { xs: 'auto', md: '50%' },
                left: { xs: 'auto', md: 20 },
                bottom: { xs: 16, md: 'auto' },
                right: { xs: 72, md: 'auto' },
                transform: { xs: 'none', md: 'translateY(-50%)' },
                zIndex: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                width: 44,
                height: 44,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                top: { xs: 'auto', md: '50%' },
                right: 20,
                bottom: { xs: 16, md: 'auto' },
                transform: { xs: 'none', md: 'translateY(-50%)' },
                zIndex: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                width: 44,
                height: 44,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Dot Pagination Indicators */}
        {banners.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              gap: 1.2,
            }}
          >
            {banners.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => handleDotClick(idx)}
                sx={{
                  width: idx === currentIndex ? 34 : 10,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: idx === currentIndex ? '#6366f1' : 'rgba(255, 255, 255, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.35s ease',
                  '&:hover': { backgroundColor: '#ffffff' },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

