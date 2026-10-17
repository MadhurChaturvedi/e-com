import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { bannerService } from '../../services/bannerService';

const fallbackBanner = {
  title: 'Next-Gen Living. Engineered to Perfection.',
  subtitle: 'Discover ultra-premium electronics, minimalist lifestyle essentials, and iconic designer gear with fast express delivery.',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=85',
  ctaLabel: 'Explore Collection',
  destinationUrl: '/shop',
};

export const HeroSlider = ({ banners: propBanners = null, loading: propLoading = false }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState(propBanners || []);
  const [loading, setLoading] = useState(!propBanners && !propLoading);

  // Carousel Track State
  // When multiple banners exist, we clone edges: [last, ...banners, first]
  const [trackIndex, setTrackIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const isAnimatingRef = useRef(false);
  const autoplayTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Touch Swipe Refs
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);

  // Synchronize incoming propBanners
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
      const fetchBanners = async () => {
        try {
          setLoading(true);
          const res = await bannerService.getActiveBanners();
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setBanners(res.data);
          } else {
            setBanners([fallbackBanner]);
          }
        } catch (err) {
          console.warn('Failed to fetch active banners:', err);
          setBanners([fallbackBanner]);
        } finally {
          setLoading(false);
        }
      };

      fetchBanners();
    }
  }, [propBanners]);

  const hasMultiple = banners.length > 1;

  // Build slides with clones for seamless infinite looping
  const slides = hasMultiple
    ? [banners[banners.length - 1], ...banners, banners[0]]
    : banners.length === 1
    ? banners
    : [fallbackBanner];

  // Active Real Index for dots (0-based relative to original banners)
  const realCurrentIndex = hasMultiple
    ? (trackIndex - 1 + banners.length) % banners.length
    : 0;

  // Slide Next (Right-to-Left slide motion)
  const handleNext = useCallback(() => {
    if (!hasMultiple || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev + 1);

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 750);
  }, [hasMultiple]);

  // Slide Prev (Left-to-Right slide motion)
  const handlePrev = useCallback(() => {
    if (!hasMultiple || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev - 1);

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 750);
  }, [hasMultiple]);

  // Autoplay Effect (Slides Right-to-Left every 6s, pauses on hover)
  useEffect(() => {
    if (!hasMultiple || isHovered) return;

    autoplayTimerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [hasMultiple, isHovered, handleNext]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Transition End Handler for Seamless Infinite Loop Wrap
  const handleTransitionEnd = () => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    if (!hasMultiple) {
      isAnimatingRef.current = false;
      return;
    }

    // Wrapped past the last slide -> reset silently to first real slide (index 1)
    if (trackIndex >= slides.length - 1) {
      setIsTransitioning(false);
      setTrackIndex(1);
    }
    // Wrapped before the first slide -> reset silently to last real slide (index banners.length)
    else if (trackIndex <= 0) {
      setIsTransitioning(false);
      setTrackIndex(banners.length);
    }

    isAnimatingRef.current = false;
  };

  // Re-enable CSS transition after a silent teleport reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Dot Navigation Click
  const handleDotClick = (targetRealIndex) => {
    if (isAnimatingRef.current || !hasMultiple) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setTrackIndex(targetRealIndex + 1);
  };

  // Touch Swipe Handlers for Mobile & Trackpad
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchDeltaXRef.current < -50) {
      handleNext(); // Swipe Left -> Slide Right to Left
    } else if (touchDeltaXRef.current > 50) {
      handlePrev(); // Swipe Right -> Slide Left to Right
    }
  };

  const handleCtaClick = (destination) => {
    if (!destination) return;
    if (destination.startsWith('http://') || destination.startsWith('https://')) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    } else {
      navigate(destination);
    }
  };

  if (loading || propLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <Skeleton
          variant="rounded"
          height={440}
          sx={{ borderRadius: 4, width: '100%' }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1.5, md: 2 }, mb: { xs: 3, md: 4 } }}>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          minHeight: { xs: 360, sm: 400, md: 440 },
          boxShadow: '0 20px 50px -15px rgba(15, 23, 42, 0.22)',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Horizontal Sliding Track (Moves Left-to-Right & Right-to-Left) */}
        <Box
          onTransitionEnd={handleTransitionEnd}
          sx={{
            display: 'flex',
            width: `${slides.length * 100}%`,
            height: '100%',
            transform: `translateX(-${(trackIndex * 100) / slides.length}%)`,
            transition: isTransitioning
              ? 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)'
              : 'none',
            willChange: 'transform',
          }}
        >
          {slides.map((slide, sIdx) => {
            const isSlideActive = hasMultiple
              ? trackIndex === sIdx
              : true;

            return (
              <Box
                key={sIdx}
                sx={{
                  width: `${100 / slides.length}%`,
                  flexShrink: 0,
                  position: 'relative',
                  minHeight: { xs: 360, sm: 400, md: 440 },
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Background Image with Subtle Parallax Zoom */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: { xs: '65% center', md: 'center' },
                    filter: 'brightness(0.9)',
                    transform: isSlideActive ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                {/* Glass Gradient Dark Overlay */}
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

                {/* Slide Text Content */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    py: { xs: 4, md: 5 },
                    px: { xs: 3, sm: 5, md: 7 },
                    maxWidth: { xs: '100%', md: '580px' },
                    transform: isSlideActive ? 'translateY(0)' : 'translateY(8px)',
                    opacity: isSlideActive ? 1 : 0.85,
                    transition: 'all 0.5s ease',
                  }}
                >
                  {/* Top Pill Badges */}
                  <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                    <Chip
                      icon={<SparklesIcon sx={{ fontSize: '0.9rem !important', color: '#6366f1 !important' }} />}
                      label="SPECIAL FEATURED DROP"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.22)',
                        color: '#a5b4fc',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        letterSpacing: '0.06em',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
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
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {slide.title}
                  </Typography>

                  {/* Subtitle */}
                  {slide.subtitle && (
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
                      {slide.subtitle}
                    </Typography>
                  )}

                  {/* CTA & Catalog Buttons */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button
                      variant="contained"
                      size="medium"
                      color="secondary"
                      endIcon={<ArrowForwardOutlinedIcon />}
                      onClick={() => handleCtaClick(slide.destinationUrl)}
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
                      {slide.ctaLabel || 'Explore Catalog'}
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
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        },
                      }}
                    >
                      View Trending
                    </Button>
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Previous Button (Slides Left-to-Right) */}
        {hasMultiple && (
          <IconButton
            onClick={handlePrev}
            aria-label="Previous Slide"
            sx={{
              position: 'absolute',
              top: '50%',
              left: { xs: 12, md: 24 },
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              width: { xs: 38, md: 46 },
              height: { xs: 38, md: 46 },
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                backgroundColor: '#4f46e5',
                borderColor: '#4f46e5',
                transform: 'translateY(-50%) scale(1.08)',
              },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, ml: '4px' }} />
          </IconButton>
        )}

        {/* Next Button (Slides Right-to-Left) */}
        {hasMultiple && (
          <IconButton
            onClick={handleNext}
            aria-label="Next Slide"
            sx={{
              position: 'absolute',
              top: '50%',
              right: { xs: 12, md: 24 },
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              width: { xs: 38, md: 46 },
              height: { xs: 38, md: 46 },
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                backgroundColor: '#4f46e5',
                borderColor: '#4f46e5',
                transform: 'translateY(-50%) scale(1.08)',
              },
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }} />
          </IconButton>
        )}

        {/* Dot Pagination Indicators with Active Slide Pill Expansion */}
        {hasMultiple && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.5,
              py: 0.8,
              borderRadius: 999,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {banners.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => handleDotClick(idx)}
                sx={{
                  width: idx === realCurrentIndex ? 30 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    idx === realCurrentIndex ? '#6366f1' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: '#ffffff',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HeroSlider;
