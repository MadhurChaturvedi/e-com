import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';

// Icons
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { orderService } from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';

export const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setLoading(true);
    orderService.getOrderById(id)
      .then(res => {
        if (res.success && res.data) {
          setOrder(res.data);
        }
      })
      .catch(err => {
        console.warn('Error fetching order details:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await orderService.cancelOrder(order._id, cancelReason);
      if (res.success && res.data) {
        setOrder(res.data);
        setCancelOpen(false);
        notify('Order cancelled successfully. Restocked inventory.', 'info');
      }
    } catch (err) {
      notify(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const isEligibleForCancellation =
    order &&
    order.fulfillmentStatus !== 'delivered' &&
    order.fulfillmentStatus !== 'shipped' &&
    order.fulfillmentStatus !== 'cancelled';

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} mb={2}>Order Not Found</Typography>
        <Button component={RouterLink} to="/account/orders" variant="contained">
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Top Navigation Back */}
      <Button
        component={RouterLink}
        to="/account/orders"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Back to Order History
      </Button>

      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          mb: 4,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
              Order Information
            </Typography>
            <Typography variant="h4" fontWeight={800} color="primary.main">
              {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={order.fulfillmentStatus?.toUpperCase()}
              color={
                order.fulfillmentStatus === 'delivered' ? 'success' :
                order.fulfillmentStatus === 'shipped' ? 'info' :
                order.fulfillmentStatus === 'cancelled' ? 'error' : 'warning'
              }
              sx={{ fontWeight: 800, px: 1 }}
            />
            {isEligibleForCancellation && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Cancel Order
              </Button>
            )}
          </Stack>
        </Stack>

        {order.fulfillmentStatus === 'cancelled' && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            This order was cancelled. {order.cancellationReason && `Reason: "${order.cancellationReason}"`}
          </Alert>
        )}

        {order.trackingInfo?.trackingNumber && (
          <Alert severity="info" icon={<LocalShippingOutlinedIcon />} sx={{ mt: 2, borderRadius: 2 }}>
            <strong>Tracking Carrier:</strong> {order.trackingInfo.carrier || 'Standard Courier'} &bull; <strong>Tracking Number:</strong> {order.trackingInfo.trackingNumber}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={4}>
        {/* Left: Ordered Items & Timeline */}
        <Grid item xs={12} lg={8}>
          {/* Order Items Table Card */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
            <Typography variant="h6" fontWeight={800} mb={3}>
              Ordered Items ({order.items?.length})
            </Typography>

            <Stack spacing={2.5}>
              {order.items?.map((item, idx) => (
                <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2.5} alignItems="center">
                    <Box
                      component="img"
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                      alt={item.name}
                      sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {item.name}
                      </Typography>
                      {item.sku && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          SKU: {item.sku}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        ${item.price?.toFixed(2)} &times; {item.quantity}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="subtitle1" fontWeight={800}>
                    ${item.total?.toFixed(2)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Timeline History */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} mb={3}>
              Order Status Timeline
            </Typography>

            <Stack spacing={2}>
              {order.timeline?.map((step, idx) => (
                <Stack key={idx} direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700} textTransform="capitalize">
                        {step.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(step.timestamp).toLocaleString()}
                      </Typography>
                    </Stack>
                    {step.note && (
                      <Typography variant="body2" color="text.secondary">
                        {step.note}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Right: Shipping Address & Financial Summary */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
            <Typography variant="h6" fontWeight={800} mb={2}>
              Shipping Details
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {order.shippingAddress?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress?.country}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Contact: {order.shippingAddress?.phone}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} mb={2.5}>
              Payment Summary
            </Typography>

            <Stack spacing={1.5} mb={2.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Items Subtotal</Typography>
                <Typography variant="body2" fontWeight={700}>${order.pricing?.subtotal?.toFixed(2)}</Typography>
              </Stack>
              {order.pricing?.discount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Coupon Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    -${order.pricing.discount.toFixed(2)}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Shipping Charge</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {order.pricing?.shippingCharge === 0 ? 'FREE' : `$${order.pricing?.shippingCharge?.toFixed(2)}`}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={2}>
              <Typography variant="subtitle1" fontWeight={800}>Total Amount</Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                ${order.pricing?.total?.toFixed(2)}
              </Typography>
            </Stack>

            <Chip
              label={`Payment Method: ${order.payment?.method?.toUpperCase()}`}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Cancellation Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Order Cancellation</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? Reserved inventory will be released immediately.
          </Typography>
          <TextField
            fullWidth
            required
            label="Reason for cancellation"
            placeholder="e.g. Changed my mind, found another product"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelOpen(false)}>Never Mind</Button>
          <Button
            variant="contained"
            color="error"
            disabled={cancelling}
            onClick={handleCancelOrder}
          >
            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
