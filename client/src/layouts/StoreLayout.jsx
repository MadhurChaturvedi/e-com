import React, { useState, useEffect, useRef } from 'react';
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
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';

export const StoreLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, itemCount, updateQuantity, removeFromCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);

  // Live Instant Search State
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    categoryService.getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data.filter(c => !c.parentCategory));
      }
    }).catch(() => {});
  }, []);

  // Debounced Instant Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productService.getProducts({ search: searchQuery.trim(), limit: 4 });
        if (res.success) {
          const list = res.data?.products || (Array.isArray(res.data) ? res.data : []);
          setSearchResults(list);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.warn('Live search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleAccountMenuOpen = (e) => {
    setAccountAnchorEl(e.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountAnchorEl(null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectSearchResult = (product) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/product/${product.slug || product._id}`);
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
    <Box className="store-shell" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top Announcement Bar */}
      <Box
        sx={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          py: 0.55,
          px: 2,
          fontSize: '0.76rem',
          textAlign: 'center',
          fontWeight: 600,
          letterSpacing: '0.02em',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        Free Express Delivery on orders over $50 &bull; Use voucher{' '}
        <Box component="span" sx={{ color: '#818cf8', fontWeight: 800 }}>
          WELCOME10
        </Box>{' '}
        for 10% off your purchase.
      </Box>

      {/* Main Header AppBar */}
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 58, md: 64 }, gap: { xs: 1.5, md: 3 } }}>
            {/* Mobile Hamburger */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>

            {/* Brand Logo & Name */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                textDecoration: 'none',
                color: 'inherit',
                mr: { xs: 0, lg: 2 },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 3px 10px rgba(79, 70, 229, 0.28)',
                }}
              >
                <StorefrontIcon sx={{ fontSize: '1.15rem' }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  letterSpacing: '-0.035em',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Nova<Box component="span" sx={{ color: '#4f46e5' }}>Store</Box>
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}
            >
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{
                  fontWeight: location.pathname === '/' ? 800 : 600,
                  color: location.pathname === '/' ? '#4f46e5' : 'text.primary',
                  borderRadius: 2,
                }}
              >
                Home
              </Button>
              <Button
                component={RouterLink}
                to="/shop"
                color="inherit"
                sx={{
                  fontWeight: location.pathname === '/shop' ? 800 : 600,
                  color: location.pathname === '/shop' ? '#4f46e5' : 'text.primary',
                  borderRadius: 2,
                }}
              >
                Catalog
              </Button>
              <Button
                component={RouterLink}
                to="/shop?filter=featured"
                color="inherit"
                sx={{ fontWeight: 600, color: 'text.primary', borderRadius: 2 }}
              >
                Featured
              </Button>
              <Button
                component={RouterLink}
                to="/shop?filter=trending"
                color="inherit"
                sx={{ fontWeight: 600, color: 'text.primary', borderRadius: 2 }}
              >
                Trending
              </Button>
            </Stack>

            {/* Live Search Bar with Instant Suggestions */}
            <ClickAwayListener onClickAway={() => setShowSearchDropdown(false)}>
              <Box
                component="form"
                onSubmit={handleSearchSubmit}
                sx={{
                  position: 'relative',
                  flexGrow: 1,
                  maxWidth: { xs: '100%', sm: 440 },
                  mx: { xs: 0, md: 'auto' },
                  display: { xs: 'none', md: 'block' },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: '3px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2.5,
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease',
                    '&:focus-within': {
                      borderColor: '#4f46e5',
                      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12)',
                      backgroundColor: '#ffffff',
                    },
                  }}
                >
                  <InputBase
                    sx={{ ml: 1, flex: 1, fontSize: '0.88rem' }}
                    placeholder="Search electronics, audio, apparel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
                  />
                  {searchLoading ? (
                    <CircularProgress size={18} sx={{ color: 'secondary.main', mr: 1 }} />
                  ) : (
                    <IconButton type="submit" sx={{ p: '6px', color: 'secondary.main' }}>
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>

                {/* Instant Search Dropdown Results */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      zIndex: 1400,
                      borderRadius: 3,
                      p: 1.5,
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                      Suggested Products ({searchResults.length})
                    </Typography>
                    <List sx={{ p: 0, mt: 0.5 }}>
                      {searchResults.map((item) => (
                        <ListItem
                          key={item._id}
                          disablePadding
                          sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 0.5,
                            '&:hover': { backgroundColor: '#f8fafc' },
                          }}
                        >
                          <ListItemButton onClick={() => handleSelectSearchResult(item)} sx={{ py: 0.8, px: 1 }}>
                            <Box
                              component="img"
                              src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                              alt={item.name}
                              sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', mr: 1.5 }}
                            />
                            <ListItemText
                              primary={item.name}
                              secondary={`$${item.price?.toFixed(2)}`}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 700, noWrap: true }}
                              secondaryTypographyProps={{ variant: 'caption', fontWeight: 700, color: 'secondary.main' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      fullWidth
                      size="small"
                      onClick={handleSearchSubmit}
                      sx={{ mt: 0.5, fontWeight: 700, textTransform: 'none', color: 'secondary.main' }}
                    >
                      View all results for "{searchQuery}" &rarr;
                    </Button>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>

            {/* Action Icons: Wishlist, Cart Drawer Trigger, Profile */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
              {/* Wishlist Icon */}
              <IconButton
                component={RouterLink}
                to="/wishlist"
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  transition: 'color 0.2s ease',
                  '&:hover': { color: '#ef4444' },
                }}
              >
                <Badge badgeContent={wishlistCount} color="error" max={99}>
                  <FavoriteBorderIcon fontSize="small" />
                </Badge>
              </IconButton>

              {/* Cart Drawer Trigger Button */}
              <IconButton
                onClick={() => setCartDrawerOpen(true)}
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  transition: 'color 0.2s ease',
                  '&:hover': { color: 'secondary.main' },
                }}
              >
                <Badge badgeContent={itemCount} color="primary" max={99}>
                  <ShoppingBagOutlinedIcon fontSize="small" />
                </Badge>
              </IconButton>

              {/* Profile / Account Menu */}
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={handleAccountMenuOpen}
                    color="inherit"
                    startIcon={<PersonOutlineOutlinedIcon />}
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      display: { xs: 'none', sm: 'inline-flex' },
                      borderRadius: 2,
                    }}
                  >
                    {user?.name?.split(' ')[0] || 'Account'}
                  </Button>

                  <IconButton
                    onClick={handleAccountMenuOpen}
                    color="inherit"
                    sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                  >
                    <PersonOutlineOutlinedIcon />
                  </IconButton>

                  <Menu
                    anchorEl={accountAnchorEl}
                    open={Boolean(accountAnchorEl)}
                    onClose={handleAccountMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 4,
                      sx: { minWidth: 220, mt: 1.5, borderRadius: 3, p: 0.5 },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
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
                          <DashboardOutlinedIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Admin Dashboard" primaryTypographyProps={{ fontWeight: 700 }} />
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
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon>
                        <LogoutOutlinedIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary="Sign Out" />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    px: { xs: 2, sm: 2.5 },
                    minWidth: 'max-content',
                    fontWeight: 700,
                  }}
                >
                  Sign In
                </Button>
              )}
            </Stack>
          </Toolbar>

          {/* Mobile Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ display: { xs: 'block', md: 'none' }, pb: 1.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                px: 1.2,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 2,
                border: '1px solid rgba(226, 232, 240, 0.9)',
                backgroundColor: '#f8fafc',
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1, fontSize: '0.88rem' }}
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <IconButton type="submit" sx={{ p: '6px', color: 'secondary.main' }}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Box>

          {/* Sub-header Categories Bar (Desktop) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              py: 0.9,
              borderTop: '1px solid rgba(226, 232, 240, 0.7)',
              overflowX: 'auto',
            }}
          >
            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">
              Departments:
            </Typography>
            {categories.map((cat) => (
              <Button
                key={cat._id}
                component={RouterLink}
                to={`/shop?category=${cat.slug}`}
                size="small"
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 0.4,
                  px: 1.2,
                  '&:hover': { color: 'secondary.main', backgroundColor: 'rgba(79, 70, 229, 0.06)' },
                }}
              >
                {cat.name}
              </Button>
            ))}
          </Box>
        </Container>
      </AppBar>

      {/* Slide-over Mini-Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Cart Drawer Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Shopping Bag
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </Typography>
          </Box>
          <IconButton onClick={() => setCartDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Free Shipping Progress Meter */}
        <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <LocalShippingOutlinedIcon sx={{ fontSize: '1.1rem', color: progressToFreeShipping >= 100 ? '#10b981' : '#4f46e5' }} />
            <Typography variant="caption" fontWeight={700}>
              {progressToFreeShipping >= 100
                ? '🎉 Congratulations! You unlocked Free Shipping!'
                : `Add $${amountNeededForFreeShipping.toFixed(2)} more to unlock Free Express Shipping`}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressToFreeShipping}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: progressToFreeShipping >= 100 ? '#10b981' : '#4f46e5',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Items List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
          {cart.items && cart.items.length > 0 ? (
            <Stack spacing={2}>
              {cart.items.map((item, index) => {
                const prod = item.productId || item;
                const itemId = item._id || prod._id;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                    }}
                  >
                    <Box
                      component="img"
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}
                      alt={prod.name}
                      sx={{ width: 68, height: 68, borderRadius: 2, objectFit: 'cover' }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
                        {prod.name}
                      </Typography>
                      <Typography variant="caption" fontWeight={800} color="secondary.main">
                        ${(item.price || prod.price)?.toFixed(2)}
                      </Typography>

                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 1.5,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            sx={{ p: '2px' }}
                          >
                            <RemoveIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                          <Typography variant="caption" fontWeight={700} sx={{ px: 1 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            sx={{ p: '2px' }}
                          >
                            <AddIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(itemId)}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, ml: 'auto' }}
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
              <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Explore our catalog to find your favorite products.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/shop');
                }}
                sx={{ borderRadius: 2 }}
              >
                Start Shopping
              </Button>
            </Box>
          )}
        </Box>

        {/* Cart Drawer Checkout Footer */}
        {cart.items && cart.items.length > 0 && (
          <Box sx={{ pt: 2, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                ${currentSubtotal.toFixed(2)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Taxes and shipping calculated at checkout.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => {
                setCartDrawerOpen(false);
                navigate('/checkout');
              }}
              sx={{
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
                mb: 1.5,
              }}
            >
              Checkout Now &rarr;
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={() => {
                setCartDrawerOpen(false);
                navigate('/cart');
              }}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              View Full Cart
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Mobile Nav Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 290, p: 2.5 } }}
      >
        <Typography variant="h5" fontWeight={800} color="#0f172a" mb={2}>
          Nova<Box component="span" sx={{ color: '#4f46e5' }}>Store</Box>
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/shop" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Shop All" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/wishlist" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Wishlist" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/cart" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Shopping Cart" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </ListItem>
          {isAdmin && (
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/admin" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Admin Dashboard" sx={{ color: 'secondary.main', fontWeight: 800 }} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" fontWeight={800} color="text.secondary" px={2} textTransform="uppercase">
          Departments
        </Typography>
        <List>
          {categories.map((c) => (
            <ListItem key={c._id} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={`/shop?category=${c.slug}`}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={c.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Page Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Store Features Banner */}
      <Box sx={{ backgroundColor: '#ffffff', py: 6, borderTop: '1px solid rgba(226, 232, 240, 0.8)', mt: 8 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 4,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'secondary.main' }}>
                <LocalShippingOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>Free Express Shipping</Typography>
                <Typography variant="caption" color="text.secondary">On all international orders over $50</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'success.main' }}>
                <VerifiedUserOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>Authentic Guarantee</Typography>
                <Typography variant="caption" color="text.secondary">100% verified genuine brand warranty</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(6, 182, 212, 0.08)', color: 'info.main' }}>
                <ShieldOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>30-Day Easy Returns</Typography>
                <Typography variant="caption" color="text.secondary">Zero-hassle instant store refund</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'warning.main' }}>
                <SupportAgentOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>24/7 Dedicated Support</Typography>
                <Typography variant="caption" color="text.secondary">Live chat and email customer assistance</Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Global Luxury Footer */}
      <Box sx={{ backgroundColor: '#0f172a', color: '#f8fafc', pt: 8, pb: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1.5fr' },
              gap: 4,
              mb: 6,
            }}
          >
            {/* Col 1: Store Brand */}
            <Box>
              <Typography variant="h5" fontWeight={800} color="#ffffff" mb={1.5}>
                Nova<Box component="span" sx={{ color: '#818cf8' }}>Store</Box>
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.7, maxWidth: 360, mb: 2 }}>
                Your premier destination for high-performance electronics, modern lifestyle essentials, and authentic designer hardware.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Customer Care: support@novastore.com &bull; +1 (800) 555-0199
              </Typography>
            </Box>

            {/* Col 2: Navigation Links */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#ffffff" mb={2}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Home
                </Typography>
                <Typography component={RouterLink} to="/shop" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Product Catalog
                </Typography>
                <Typography component={RouterLink} to="/cart" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Shopping Bag
                </Typography>
                <Typography component={RouterLink} to="/wishlist" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  My Wishlist
                </Typography>
              </Stack>
            </Box>

            {/* Col 3: Customer Account */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#ffffff" mb={2}>
                Customer Support
              </Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/account/profile" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  User Account
                </Typography>
                <Typography component={RouterLink} to="/account/orders" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Track Orders
                </Typography>
                <Typography component={RouterLink} to="/account/addresses" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Shipping Addresses
                </Typography>
                <Typography component={RouterLink} to="/login" variant="body2" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                  Sign In / Register
                </Typography>
              </Stack>
            </Box>

            {/* Col 4: Newsletter */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#ffffff" mb={1}>
                Exclusive VIP Drops
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Subscribe to get direct notifications on flash discounts, restocks, and secret member codes.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <InputBase
                  placeholder="Enter your email"
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    flex: 1,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
                <Button variant="contained" color="secondary" sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Join
                </Button>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              &copy; {new Date().getFullYear()} NovaStore Full-Stack Platform. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="COD Available" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }} />
              <Chip label="Stripe / Card Ready" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }} />
              <Chip label="256-Bit Encrypted" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }} />
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

