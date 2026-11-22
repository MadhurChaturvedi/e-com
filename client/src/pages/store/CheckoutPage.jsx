import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { orderSound } from '../../utils/orderSound';
import { optimizeImageUrl } from '../../utils/imageUrl';

const STEPS = ['Shipping Address', 'Payment Method', 'Review & Place Order'];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, refreshCart } = useCart();
  const { user, refreshUser } = useAuth();
  const { notify } = useNotification();

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Address state
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: user?.phone || '',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'card'

  // Coupon from cart
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    const savedCoupon = sessionStorage.getItem('novastore_applied_coupon');
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (e) {}
    }
  }, []);

  const items = cart.items || [];
  const subtotal = cart.pricing?.subtotal || 0;
  const shippingFee = cart.pricing?.shippingFee ?? (subtotal >= 50 ? 0 : 10);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Default address setup
  const userAddresses = user?.addresses || [];

  const handleAddNewAddressSubmit = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city || !newAddress.postalCode || !newAddress.phone) {
      notify('Please fill out all required address fields.', 'warning');
      return;
    }

    try {
      await authService.addAddress(newAddress);
      await refreshUser();
      setIsAddingNewAddress(false);
      setSelectedAddressIndex(userAddresses.length); // newly added will be at end
      notify('Address saved successfully!', 'success');
    } catch (err) {
      notify(err.message || 'Error saving address.', 'error');
    }
  };

  const getChosenShippingAddress = () => {
    if (userAddresses.length > 0 && !isAddingNewAddress) {
      return userAddresses[selectedAddressIndex] || userAddresses[0];
    }
    return newAddress;
  };

  const handleNextStep = () => {
    const address = getChosenShippingAddress();
    if (activeStep === 0) {
      if (!address.fullName || !address.addressLine1 || !address.city || !address.phone) {
        notify('Please select or specify a valid shipping address.', 'warning');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePlaceOrder = async () => {
    const shippingAddress = getChosenShippingAddress();

    try {
      setSubmitting(true);
      const payload = {
        shippingAddress: {
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state || 'CA',
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || 'United States',
          phone: shippingAddress.phone,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      };

      const res = await orderService.createOrder(payload);
      if (res.success && res.data) {
        orderSound.playOrderPlacedSound();
        sessionStorage.removeItem('novastore_applied_coupon');
        await clearCart();
        notify('Order placed successfully! Thank you for your purchase.', 'success');
        navigate(`/order-success/${res.data.orderNumber || res.data._id}`, {
          state: { order: res.data },
        });
      }
    } catch (err) {
      notify(err.message || 'Failed to place order. Please review your cart.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} mb={2}>No Items in Cart</Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Your shopping cart is empty. Please add items before proceeding to checkout.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/shop')}>
          Return to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Typography variant="h2" fontWeight={300} textTransform="uppercase" letterSpacing="0.04em" mb={4}>
        Checkout
      </Typography>

      {/* Stepper Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 0, border: '1px solid #000000' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={4}>
        {/* Main Step Content */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #000000', backgroundColor: '#ffffff' }}>
            {/* Step 0: Shipping Address */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h5" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" mb={3}>
                  1. Delivery Destination
                </Typography>

                {userAddresses.length > 0 && !isAddingNewAddress ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>
                      Choose from your saved addresses:
                    </Typography>
                    <Grid container spacing={2} mb={3}>
                      {userAddresses.map((addr, index) => (
                        <Grid item xs={12} sm={6} key={addr._id || index}>
                          <Card
                            onClick={() => setSelectedAddressIndex(index)}
                            sx={{
                              cursor: 'pointer',
                              border: selectedAddressIndex === index ? '2px solid #000000' : '1px solid #e6e6e6',
                              backgroundColor: selectedAddressIndex === index ? '#ffffff' : '#ffffff',
                              p: 2,
                              borderRadius: 0,
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {addr.fullName}
                              </Typography>
                              {addr.isDefault && (
                                <Chip label="Default" size="small" sx={{ height: 20, fontSize: '0.65rem', borderRadius: 0, backgroundColor: '#000000', color: '#ffffff' }} />
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {addr.addressLine1} {addr.addressLine2}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {addr.city}, {addr.state} {addr.postalCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              Phone: {addr.phone}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Button
                      startIcon={<AddLocationAltOutlinedIcon />}
                      onClick={() => setIsAddingNewAddress(true)}
                      sx={{ mb: 3 }}
                    >
                      Use a Different Delivery Address
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleAddNewAddressSubmit}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>
                      Enter Delivery Details:
                    </Typography>
                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Recipient Full Name"
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Phone Number"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          required
                          label="Street Address Line 1"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Apartment, Suite, Unit (Optional)"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          required
                          label="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          required
                          label="State / Province"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          required
                          label="Postal / ZIP Code"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        />
                      </Grid>
                    </Grid>

                    {userAddresses.length > 0 && (
                      <Button onClick={() => setIsAddingNewAddress(false)} sx={{ mr: 2 }}>
                        Cancel (Use Saved Address)
                      </Button>
                    )}
                  </Box>
                )}

                <Stack direction="row" justifyContent="flex-end" mt={4}>
                  <Button variant="contained" size="large" onClick={handleNextStep} sx={{ px: 4, borderRadius: 0, backgroundColor: '#000000', color: '#ffffff' }}>
                    Continue to Payment
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Step 1: Payment Method */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" mb={3}>
                  2. Payment Method
                </Typography>

                <Alert severity="info" sx={{ mb: 3, borderRadius: 0, backgroundColor: '#e6e6e6', color: '#000000', border: '1px solid #000000' }}>
                  <strong>Development Mode Active:</strong> Cash on Delivery (COD) and Online Card payments are enabled for demo transactions with instant signature validation.
                </Alert>

                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {/* Option 1: COD */}
                  <Card
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 0,
                      border: paymentMethod === 'cod' ? '2px solid #000000' : '1px solid #e6e6e6',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <FormControlLabel
                      value="cod"
                      control={<Radio sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }} />}
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocalAtmIcon sx={{ color: '#000000' }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                              Cash on Delivery (COD)
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Pay upon package delivery at your doorstep.
                          </Typography>
                        </Box>
                      }
                    />
                  </Card>

                  {/* Option 2: Card Payment */}
                  <Card
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 0,
                      border: paymentMethod === 'card' ? '2px solid #000000' : '1px solid #e6e6e6',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <FormControlLabel
                      value="card"
                      control={<Radio sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }} />}
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CreditCardIcon sx={{ color: '#000000' }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                              Credit / Debit Card (Simulated Gateway)
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Simulated secure 256-bit encrypted checkout transaction.
                          </Typography>
                        </Box>
                      }
                    />
                  </Card>
                </RadioGroup>

                <Stack direction="row" justifyContent="space-between" mt={4}>
                  <Button onClick={handleBackStep} sx={{ borderRadius: 0, color: '#000000' }}>
                    &larr; Back to Shipping
                  </Button>
                  <Button variant="contained" size="large" onClick={handleNextStep} sx={{ px: 4, borderRadius: 0, backgroundColor: '#000000', color: '#ffffff' }}>
                    Review Order
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Step 2: Review & Place Order */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h5" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" mb={3}>
                  3. Review & Confirm Order
                </Typography>

                {/* Delivery address summary */}
                <Box sx={{ p: 2.5, backgroundColor: '#e6e6e6', borderRadius: 0, mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#000000" textTransform="uppercase" mb={0.5}>
                    Delivering To:
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {getChosenShippingAddress().fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getChosenShippingAddress().addressLine1} {getChosenShippingAddress().addressLine2}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getChosenShippingAddress().city}, {getChosenShippingAddress().state} {getChosenShippingAddress().postalCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contact: {getChosenShippingAddress().phone}
                  </Typography>
                </Box>

                {/* Payment method summary */}
                <Box sx={{ p: 2.5, backgroundColor: '#e6e6e6', borderRadius: 0, mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#000000" textTransform="uppercase" mb={0.5}>
                    Payment:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {paymentMethod === 'cod' ? 'Cash on Delivery (Pay upon arrival)' : 'Credit / Debit Card (Development Gateway Verified)'}
                  </Typography>
                </Box>

                {/* Items snapshot */}
                <Typography variant="subtitle2" fontWeight={700} textTransform="uppercase" mb={1.5}>
                  Ordered Items ({items.length}):
                </Typography>
                <Stack spacing={2} mb={3}>
                  {items.map((i) => {
                    const p = (typeof i.product === 'object' && i.product) || (typeof i.productId === 'object' && i.productId) || i;
                    const rawImage =
                      (Array.isArray(p.images) && p.images[0]) ||
                      p.image ||
                      (Array.isArray(i.images) && i.images[0]) ||
                      i.image ||
                      '';
                    const displayImage = optimizeImageUrl(rawImage, { width: 100, quality: 75 });
                    const productName = p.name || i.name || 'Product';
                    const unitPrice = p.price ?? i.price ?? 0;

                    return (
                      <Stack key={i._id} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            component="img"
                            src={displayImage}
                            alt={productName}
                            loading="lazy"
                            decoding="async"
                            sx={{ width: 48, height: 64, borderRadius: 0, backgroundColor: '#e6e6e6', objectFit: 'cover', flexShrink: 0 }}
                          />

                          <Box>
                            <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 300 }}>
                              {productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {i.quantity} &times; ${unitPrice.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" fontWeight={700}>
                          ${(unitPrice * i.quantity).toFixed(2)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" justifyContent="space-between" mt={4}>
                  <Button onClick={handleBackStep} disabled={submitting} sx={{ borderRadius: 0, color: '#000000' }}>
                    &larr; Back to Payment
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    onClick={handlePlaceOrder}
                    sx={{
                      px: 5,
                      py: 1.5,
                      borderRadius: 0,
                      fontSize: '0.875rem',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                    }}
                  >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : `Place Order &bull; $${finalTotal.toFixed(2)}`}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Sticky Summary Box */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 0, border: '1px solid #000000', backgroundColor: '#ffffff', position: 'sticky', top: 100 }}>
            <Typography variant="h6" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" mb={2}>
              Order Summary
            </Typography>

            <Stack spacing={1.5} mb={2.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Items Subtotal</Typography>
                <Typography variant="body2" fontWeight={700}>${subtotal.toFixed(2)}</Typography>
              </Stack>
              {appliedCoupon && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Coupon ({appliedCoupon.code})</Typography>
                  <Typography variant="body2" fontWeight={700}>-${discountAmount.toFixed(2)}</Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Shipping Fee</Typography>
                <Typography variant="body2" fontWeight={700}>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={3}>
              <Typography variant="subtitle1" fontWeight={700} textTransform="uppercase">Total To Pay</Typography>
              <Typography variant="h4" fontWeight={900} color="#000000">${finalTotal.toFixed(2)}</Typography>
            </Stack>

            <Typography variant="caption" color="text.secondary" display="block">
              &bull; Verified inventory reservation on placement
              <br />
              &bull; 30-day effortless returns policy
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
