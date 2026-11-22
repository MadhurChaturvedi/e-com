import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { categoryService } from '../services/categoryService';
import { MegaSearchDropdown } from '../components/common/MegaSearchDropdown';
import { orderSound } from '../utils/orderSound';
import { optimizeImageUrl } from '../utils/imageUrl';
import { api } from '../services/api';

/**
 * Editorial Store Layout
 * Implements DESIGN.md:
 * - Store locator bar: full-width #E6E6E6 band with location icon, descriptive text, underlined link
 * - Navigation header: white background, persistent red logotype anchor (#EB0010),
 *   horizontal category links ({typography.navigation}), utility icons clustered on far right
 * - Flat rectilinear materiality: zero border-radius, no elevation shadows
 */
export const StoreLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, itemCount, updateQuantity, removeFromCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(orderSound.isMuted());
  const [cacheStatus, setCacheStatus] = useState({
    mode: 'redis',
    redisConnected: true,
  });

  useEffect(() => {
    api
      .get('/health', { skipCache: true })
      .then((data) => {
        if (data?.cache) {
          setCacheStatus(data.cache);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return orderSound.onMuteChange((muted) => setIsSoundMuted(muted));
  }, []);

  const handleToggleSound = () => {
    const next = orderSound.toggleMute();
    setIsSoundMuted(next);
  };

  useEffect(() => {
    categoryService.getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data.filter(c => !c.parentCategory));
      }
    }).catch(() => {});
  }, []);

  const handleAccountMenuOpen = (e) => {
    setAccountAnchorEl(e.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountAnchorEl(null);
  };

  const handleLogout = async () => {
    handleAccountMenuClose();
    await logout();
    navigate('/');
  };

  const freeShippingThreshold = 50;
  const currentSubtotal = cart?.pricing?.subtotal || 0;
  const progressToFreeShipping = Math.min(100, (currentSubtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - currentSubtotal);

  return (
    <Box className="store-shell" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* 1. Store Locator Bar (Full-width #E6E6E6 surface band as defined in DESIGN.md) */}
      <Box
        sx={{
          backgroundColor: '#e6e6e6',
          color: '#000000',
          py: 0.8,
          px: { xs: 2, md: 3 },
          fontSize: '0.8125rem', // body-small token
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          borderBottom: '1px solid #d4d4d4',
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.8125rem' }}>
            <PlaceOutlinedIcon sx={{ fontSize: '1rem', color: '#000000' }} />
            <span>Find a store near you &bull; Free delivery on orders over $50</span>
            <Box
              component={RouterLink}
              to="/shop"
              sx={{
                color: '#000000',
                textDecoration: 'underline',
                fontWeight: 600,
                ml: 0.5,
                '&:hover': { color: '#737373' },
              }}
            >
              Shop now
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
            <Box component="span" sx={{ color: '#737373', fontSize: '0.75rem' }}>
              Customer Service &bull; Newsletter
            </Box>
            <Tooltip title="Redis Cache Engine Status">
              <Chip
                size="small"
                label={cacheStatus?.mode === 'redis' ? '⚡ Redis Active' : '⚡ Cache Ready'}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  borderRadius: 0,
                  border: '1px solid #000000',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              />
            </Tooltip>
          </Box>
        </Container>
      </Box>

      {/* 2. Main Navigation Header (White background, no shadow, red brand logotype) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          color: '#000000',
          borderBottom: '1px solid #e6e6e6',
          boxShadow: 'none',
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 60, md: 72 }, justifyContent: 'space-between' }}>
            {/* Left: Mobile Menu & Red Brand Logotype */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { md: 'none' }, color: '#000000', p: 0.5 }}
                aria-label="open mobile navigation"
              >
                <MenuIcon />
              </IconButton>

              {/* Red Logotype Anchor as defined in DESIGN.md */}
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                    fontWeight: 900,
                    fontSize: { xs: '1.5rem', md: '1.85rem' },
                    letterSpacing: '-0.04em',
                    color: '#eb0010', // Red logotype persistent anchor
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  NOVA
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                    fontWeight: 300,
                    fontSize: { xs: '1.5rem', md: '1.85rem' },
                    letterSpacing: '0.02em',
                    color: '#000000',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    ml: 0.5,
                  }}
                >
                  STORE
                </Typography>
              </Box>
            </Box>

            {/* Center: Category Links in single horizontal row (typography.navigation: 0.875rem, uppercase) */}
            <Stack
              direction="row"
              spacing={3}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                mx: 'auto',
              }}
            >
              <Box
                component={RouterLink}
                to="/shop"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === '/shop' && !location.search ? 700 : 400,
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textDecoration: location.pathname === '/shop' && !location.search ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                  '&:hover': { color: '#737373' },
                }}
              >
                All Products
              </Box>

              <Box
                component={RouterLink}
                to="/shop?filter=trending"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: location.search.includes('trending') ? 700 : 400,
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textDecoration: location.search.includes('trending') ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                  '&:hover': { color: '#737373' },
                }}
              >
                Trending
              </Box>

              <Box
                component={RouterLink}
                to="/shop?filter=featured"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: location.search.includes('featured') ? 700 : 400,
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textDecoration: location.search.includes('featured') ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                  '&:hover': { color: '#737373' },
                }}
              >
                Campaign
              </Box>

              {categories.slice(0, 4).map((cat) => (
                <Box
                  key={cat._id}
                  component={RouterLink}
                  to={`/shop?category=${cat.slug}`}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: location.search.includes(cat.slug) ? 700 : 400,
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textDecoration: location.search.includes(cat.slug) ? 'underline' : 'none',
                    textUnderlineOffset: '6px',
                    '&:hover': { color: '#737373' },
                  }}
                >
                  {cat.name}
                </Box>
              ))}
            </Stack>

            {/* Right: Utility Icons clustered at far right (Search, Sound, Account, Wishlist, Cart) */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Search Toggle */}
              <IconButton
                onClick={() => setSearchOpen((prev) => !prev)}
                color="inherit"
                size="small"
                aria-label="search catalog"
                sx={{ color: '#000000', p: 0.8 }}
              >
                <SearchIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>

              {/* Order Sound Chime Toggle */}
              <Tooltip title={isSoundMuted ? 'Order chime: Muted' : 'Order chime: Active'}>
                <IconButton
                  onClick={handleToggleSound}
                  color="inherit"
                  size="small"
                  aria-label="toggle order sound chime"
                  sx={{ color: isSoundMuted ? '#737373' : '#000000', p: 0.8 }}
                >
                  {isSoundMuted ? (
                    <VolumeOffOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                  ) : (
                    <VolumeUpOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Account / User Menu */}
              {isAuthenticated ? (
                <>
                  <IconButton
                    onClick={handleAccountMenuOpen}
                    color="inherit"
                    size="small"
                    aria-label="account menu"
                    sx={{ color: '#000000', p: 0.8 }}
                  >
                    <PersonOutlineOutlinedIcon sx={{ fontSize: '1.35rem' }} />
                  </IconButton>

                  <Menu
                    anchorEl={accountAnchorEl}
                    open={Boolean(accountAnchorEl)}
                    onClose={handleAccountMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      sx: { minWidth: 220, mt: 1, borderRadius: 0, border: '1px solid #000000', p: 0.5 },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />

                    {isAdmin && (
                      <MenuItem
                        onClick={() => {
                          handleAccountMenuClose();
                          navigate('/admin');
                        }}
                      >
                        <ListItemIcon>
                          <DashboardOutlinedIcon fontSize="small" sx={{ color: '#000000' }} />
                        </ListItemIcon>
                        <ListItemText primary="Admin Console" primaryTypographyProps={{ fontWeight: 700 }} />
                      </MenuItem>
                    )}

                    <MenuItem
                      onClick={() => {
                        handleAccountMenuClose();
                        navigate('/account/profile');
                      }}
                    >
                      <ListItemIcon>
                        <PersonOutlineOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="My Profile" />
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        handleAccountMenuClose();
                        navigate('/account/orders');
                      }}
                    >
                      <ListItemIcon>
                        <ReceiptLongOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Order History" />
                    </MenuItem>

                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleLogout} sx={{ color: '#eb0010' }}>
                      <ListItemIcon>
                        <LogoutOutlinedIcon fontSize="small" sx={{ color: '#eb0010' }} />
                      </ListItemIcon>
                      <ListItemText primary="Sign Out" />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton
                  component={RouterLink}
                  to="/login"
                  color="inherit"
                  size="small"
                  aria-label="sign in"
                  sx={{ color: '#000000', p: 0.8 }}
                >
                  <PersonOutlineOutlinedIcon sx={{ fontSize: '1.35rem' }} />
                </IconButton>
              )}

              {/* Wishlist Icon */}
              <IconButton
                component={RouterLink}
                to="/wishlist"
                color="inherit"
                size="small"
                aria-label="wishlist"
                sx={{ color: '#000000', p: 0.8 }}
              >
                <Badge
                  badgeContent={wishlistCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#eb0010',
                      color: '#ffffff',
                      borderRadius: 0,
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                  max={99}
                >
                  <FavoriteBorderIcon sx={{ fontSize: '1.3rem' }} />
                </Badge>
              </IconButton>

              {/* Cart Drawer Trigger */}
              <IconButton
                onClick={() => setCartDrawerOpen(true)}
                color="inherit"
                size="small"
                aria-label="shopping cart"
                sx={{ color: '#000000', p: 0.8 }}
              >
                <Badge
                  badgeContent={itemCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      borderRadius: 0,
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                  max={99}
                >
                  <ShoppingBagOutlinedIcon sx={{ fontSize: '1.3rem' }} />
                </Badge>
              </IconButton>
            </Stack>
          </Toolbar>

          {/* Collapsible Search Dropdown */}
          {searchOpen && (
            <Box sx={{ pb: 2, pt: 1, borderTop: '1px solid #e6e6e6' }}>
              <MegaSearchDropdown fullWidthMobile />
            </Box>
          )}
        </Container>
      </AppBar>

      {/* Slide-over Mini-Cart Drawer (Rectilinear, #E6E6E6 thumbnails, flat zero-border-radius) */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            boxShadow: 'none',
            borderLeft: '1px solid #000000',
          },
        }}
      >
        {/* Cart Drawer Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Shopping Bag
            </Typography>
            <Typography variant="caption" sx={{ color: '#737373' }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Typography>
          </Box>
          <IconButton onClick={() => setCartDrawerOpen(false)} size="small" sx={{ borderRadius: 0 }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Free Shipping Progress Meter */}
        <Box sx={{ mb: 2.5, p: 2, backgroundColor: '#e6e6e6', borderRadius: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#000000' }}>
            {progressToFreeShipping >= 100
              ? 'Free standard shipping unlocked!'
              : `Add $${amountNeededForFreeShipping.toFixed(2)} more for Free Standard Delivery`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressToFreeShipping}
            sx={{
              height: 4,
              borderRadius: 0,
              backgroundColor: '#ffffff',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#000000',
                borderRadius: 0,
              },
            }}
          />
        </Box>

        {/* Items List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
          {cart.items && cart.items.length > 0 ? (
            <Stack spacing={2}>
              {cart.items.map((item, index) => {
                const prod = (typeof item.product === 'object' && item.product) || (typeof item.productId === 'object' && item.productId) || item;
                const itemId = item._id || prod._id || `cart-item-${index}`;
                const prodName = prod.name || item.name || 'Product';
                const prodPrice = prod.price ?? item.price ?? 0;
                const rawImage =
                  (Array.isArray(prod.images) && prod.images[0]) ||
                  prod.image ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  item.image ||
                  '';
                const displayImage = optimizeImageUrl(rawImage, { width: 160, quality: 75 });

                return (
                  <Box
                    key={itemId || index}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e6e6e6',
                    }}
                  >
                    <Box
                      component="img"
                      src={displayImage}
                      alt={prodName}
                      loading="lazy"
                      decoding="async"
                      sx={{
                        width: 72,
                        height: 96,
                        borderRadius: 0,
                        backgroundColor: '#e6e6e6',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        component={RouterLink}
                        to={`/product/${prod.slug || prod._id || itemId}`}
                        onClick={() => setCartDrawerOpen(false)}
                        variant="subtitle1"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#000000',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          '&:hover': { color: '#737373' },
                        }}
                      >
                        {prodName}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', color: '#000000', mt: 0.5 }}>
                        ${prodPrice.toFixed(2)}
                      </Typography>

                      <Stack direction="row" alignItems="center" spacing={1} mt="auto">
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 0,
                            border: '1px solid #000000',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            sx={{ p: '2px', borderRadius: 0 }}
                          >
                            <RemoveIcon sx={{ fontSize: '0.75rem' }} />
                          </IconButton>
                          <Typography variant="caption" sx={{ px: 1, fontWeight: 600 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            sx={{ p: '2px', borderRadius: 0 }}
                          >
                            <AddIcon sx={{ fontSize: '0.75rem' }} />
                          </IconButton>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(itemId)}
                          sx={{ color: '#737373', '&:hover': { color: '#eb0010' }, ml: 'auto', borderRadius: 0 }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Box textAlign="center" py={8}>
              <ShoppingBagOutlinedIcon sx={{ fontSize: 44, color: '#737373', mb: 1.5 }} />
              <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Bag is Empty
              </Typography>
              <Typography variant="body2" sx={{ color: '#737373', mb: 3 }}>
                Discover our latest collections and wardrobe essentials.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/shop');
                }}
                sx={{ borderRadius: 0 }}
              >
                Shop Now
              </Button>
            </Box>
          )}
        </Box>

        {/* Cart Drawer Checkout Footer */}
        {cart.items && cart.items.length > 0 && (
          <Box sx={{ pt: 2, borderTop: '1px solid #e6e6e6' }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" sx={{ color: '#737373' }}>
                Subtotal
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                ${currentSubtotal.toFixed(2)}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#737373', display: 'block', mb: 2 }}>
              Delivery and taxes calculated at checkout.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => {
                setCartDrawerOpen(false);
                navigate('/checkout');
              }}
              sx={{
                py: 1.4,
                borderRadius: 0,
                backgroundColor: '#000000',
                color: '#ffffff',
                mb: 1,
              }}
            >
              Continue to Checkout
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={() => {
                setCartDrawerOpen(false);
                navigate('/cart');
              }}
              sx={{ borderRadius: 0 }}
            >
              View Shopping Bag
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Mobile Nav Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 300, p: 3, borderRadius: 0 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography
            sx={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.4rem',
              color: '#eb0010',
              textTransform: 'uppercase',
            }}
          >
            NOVA<Box component="span" sx={{ color: '#000000', fontWeight: 300 }}>STORE</Box>
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Home" primaryTypographyProps={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/shop" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Shop All" primaryTypographyProps={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/shop?filter=trending" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Trending" primaryTypographyProps={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/wishlist" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Wishlist" primaryTypographyProps={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/cart" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Shopping Bag" primaryTypographyProps={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} />
            </ListItemButton>
          </ListItem>
          {isAdmin && (
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/admin" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Admin Console" primaryTypographyProps={{ color: '#eb0010', fontWeight: 700, textTransform: 'uppercase' }} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" sx={{ color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', px: 2 }}>
          Categories
        </Typography>
        <List disablePadding sx={{ mt: 1 }}>
          {categories.map((c) => (
            <ListItem key={c._id} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={`/shop?category=${c.slug}`}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={c.name} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Page Outlet */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Editorial Minimalist Footer as defined in DESIGN.md */}
      <Box
        component="footer"
        sx={{
          backgroundColor: '#ffffff',
          color: '#000000',
          pt: 8,
          pb: 4,
          borderTop: '1px solid #000000',
          mt: 8,
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1.5fr' },
              gap: 4,
              mb: 6,
            }}
          >
            {/* Col 1: Brand & Editorial Statement */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.4rem',
                    color: '#eb0010',
                    textTransform: 'uppercase',
                  }}
                >
                  NOVA<Box component="span" sx={{ color: '#000000', fontWeight: 300 }}>STORE</Box>
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#737373', maxWidth: 360, mb: 2, lineHeight: 1.6 }}>
                Fashion and quality at the best price in a sustainable way. Discover the latest collections with global express shipping.
              </Typography>
              <Typography variant="caption" sx={{ color: '#737373', display: 'block' }}>
                Store locator bar &bull; Customer Care &bull; Verified Authenticity
              </Typography>
            </Box>

            {/* Col 2: Shop Links */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 2 }}>
                Shop
              </Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/shop" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  All Products
                </Typography>
                <Typography component={RouterLink} to="/shop?filter=trending" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Trending Now
                </Typography>
                <Typography component={RouterLink} to="/shop?filter=featured" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Campaign Specials
                </Typography>
                <Typography component={RouterLink} to="/cart" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Shopping Bag
                </Typography>
              </Stack>
            </Box>

            {/* Col 3: Customer Care */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 2 }}>
                Customer Service
              </Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/account/profile" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  My Account
                </Typography>
                <Typography component={RouterLink} to="/account/orders" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Order Status
                </Typography>
                <Typography component={RouterLink} to="/account/addresses" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Delivery Addresses
                </Typography>
                <Typography component={RouterLink} to="/wishlist" variant="body2" sx={{ color: '#000000', '&:hover': { textDecoration: 'underline' } }}>
                  Saved Items
                </Typography>
              </Stack>
            </Box>

            {/* Col 4: Newsletter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                Become a Member
              </Typography>
              <Typography variant="body2" sx={{ color: '#737373', mb: 2 }}>
                Join now and get 10% off your second purchase with secret member benefits.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <InputBase
                  placeholder="Enter your email"
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    backgroundColor: '#ffffff',
                    border: '1px solid #000000',
                    borderRadius: 0,
                    color: '#000000',
                    fontSize: '0.8125rem',
                    flex: 1,
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    px: 2,
                    fontSize: '0.75rem',
                  }}
                >
                  Join
                </Button>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#e6e6e6', mb: 3 }} />

          {/* Legal Copy & Footer Credits (typography.legal-copy: 0.75rem, light 300 weight) */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem', fontWeight: 300 }}>
              The content of this site is copyright-protected and is the property of NovaStore. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ color: '#737373', fontSize: '0.75rem' }}>
              <span>Privacy Policy</span>
              <span>&bull;</span>
              <span>Terms of Use</span>
              <span>&bull;</span>
              <span>Cookie Settings</span>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
