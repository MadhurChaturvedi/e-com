import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// Icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useCart } from '../../contexts/CartContext';
import { optimizeImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { couponService } from '../../services/couponService';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { notify } = useNotification();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const items = cart.items || [];
  const subtotal = cart.pricing?.subtotal || 0;
  const shippingFee = cart.pricing?.shippingFee ?? (subtotal >= 50 || subtotal === 0 ? 0 : 10);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      notify('Please enter a coupon code.', 'warning');
      return;
    }

    try {
      setValidatingCoupon(true);
      const res = await couponService.validateCoupon(couponCode.trim(), subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        notify(res.message || 'Coupon code applied successfully!', 'success');
      }
    } catch (err) {
      notify(err.message || 'Invalid coupon code.', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    notify('Coupon removed.', 'info');
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      notify('Please sign in or create an account to complete checkout.', 'info');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      // Pass applied coupon in session storage or state
      if (appliedCoupon) {
        sessionStorage.setItem('novastore_applied_coupon', JSON.stringify(appliedCoupon));
      }
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            color: 'primary.main',
          }}
        >
          <ShoppingBagOutlinedIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1}>
          Your Cart is Empty
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Looks like you haven't added anything to your cart yet. Discover items from our collection!
        </Typography>
        <Button
          component={RouterLink}
          to="/shop"
          variant="contained"
          size="large"
          sx={{ borderRadius: 2.5, px: 4 }}
        >
          Start Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={4}>
        Shopping Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
      </Typography>

      <Grid container spacing={4}>
        {/* Left: Cart Items Table */}
        <Grid item xs={12} lg={8}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 3.5,
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const p = (typeof item.product === 'object' && item.product) || (typeof item.productId === 'object' && item.productId) || item;
                  const isAvailable = item.isAvailable !== false && p.isActive !== false;
                  const rawImage =
                    (Array.isArray(p.images) && p.images[0]) ||
                    p.image ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    item.image ||
                    '';
                  const displayImage = optimizeImageUrl(rawImage, { width: 140, quality: 75 });
                  const productName = p.name || item.name || 'Product';
                  const unitPrice = p.price ?? item.price ?? 0;

                  return (
                    <TableRow key={item._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Product Thumbnail & Name */}
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            component="img"
                            src={displayImage}
                            alt={productName}
                            loading="lazy"
                            decoding="async"
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 2,
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          />

                          <Box>
                            <Typography
                              component={RouterLink}
                              to={`/product/${p.slug || p._id || item._id}`}
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                color: 'text.primary',
                                textDecoration: 'none',
                                '&:hover': { color: 'primary.main' },
                              }}
                            >
                              {productName}
                            </Typography>
                            {p.SKU && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                SKU: {p.SKU}
                              </Typography>
                            )}
                            {!isAvailable && (
                              <Chip label="Unavailable" color="error" size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Unit Price */}
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          ${unitPrice.toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Quantity Controls */}
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid #cbd5e1',
                            borderRadius: 2,
                            p: 0.25,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ px: 1.5, fontWeight: 700, fontSize: '0.875rem' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            disabled={p.stockQuantity !== undefined && item.quantity >= p.stockQuantity}
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>

                      {/* Line Item Total */}
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={800}>
                          ${((p.price || item.price || 0) * item.quantity).toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Remove Button */}
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
            <Button component={RouterLink} to="/shop" color="inherit">
              &larr; Continue Shopping
            </Button>
            <Button color="error" onClick={clearCart}>
              Clear Cart
            </Button>
          </Stack>
        </Grid>

        {/* Right: Order Summary Card */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              position: 'sticky',
              top: 100,
            }}
          >
            <Typography variant="h5" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={3}>
              Order Summary
            </Typography>

            {/* Coupon Code Input */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Have a Promotional Coupon?
              </Typography>
              {appliedCoupon ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="success.dark">
                        {appliedCoupon.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${appliedCoupon.discountAmount?.toFixed(2)} savings applied
                      </Typography>
                    </Box>
                  </Stack>
                  <Button size="small" color="error" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                </Box>
              ) : (
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    variant="outlined"
                    disabled={validatingCoupon}
                    onClick={handleApplyCoupon}
                    sx={{ borderRadius: 2 }}
                  >
                    Apply
                  </Button>
                </Stack>
              )}
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Cost Breakdown */}
            <Stack spacing={1.5} mb={3}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight={700}>${subtotal.toFixed(2)}</Typography>
              </Stack>

              {appliedCoupon && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Coupon Discount ({appliedCoupon.code})
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    -${discountAmount.toFixed(2)}
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Estimated Shipping</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {shippingFee === 0 ? <Box component="span" sx={{ color: 'success.main' }}>FREE</Box> : `$${shippingFee.toFixed(2)}`}
                </Typography>
              </Stack>

              {subtotal < 50 && (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  Add ${(50 - subtotal).toFixed(2)} more to qualify for Free Shipping!
                </Typography>
              )}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Final Total */}
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={3.5}>
              <Typography variant="h6" fontWeight={800}>Total Amount</Typography>
              <Typography variant="h4" fontWeight={900} color="primary.main">
                ${finalTotal.toFixed(2)}
              </Typography>
            </Stack>

            {/* Checkout Action Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleProceedToCheckout}
              sx={{ py: 1.5, borderRadius: 2.5, fontSize: '1rem', fontWeight: 700 }}
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In & Checkout'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
