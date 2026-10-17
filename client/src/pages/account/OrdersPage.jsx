import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { orderService } from '../../services/orderService';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setOrders(res.data);
        }
      })
      .catch(err => console.warn('Could not load orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'secondary';
      case 'cancelled': return 'error';
      case 'pending':
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 4 }} />
        <Stack spacing={3}>
          {Array.from(new Array(3)).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1}>
        My Order History
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Track shipments, view detailed invoice receipts, and manage recent purchases
      </Typography>

      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 4,
            border: '1px dashed #cbd5e1',
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 70, 229, 0.08)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1}>
            No Orders Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            You haven't placed any purchases with NovaStore yet.
          </Typography>
          <Button component={RouterLink} to="/shop" variant="contained">
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {orders.map((order) => (
            <Paper
              key={order._id}
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3.5,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.light',
                  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
                },
              }}
            >
              {/* Order Header */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
                mb={2}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                    {order.orderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={order.fulfillmentStatus?.toUpperCase()}
                    color={getStatusColor(order.fulfillmentStatus)}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    label={`Payment: ${order.payment?.status?.toUpperCase()}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Order Items Preview */}
              <Stack spacing={1.5} mb={2.5}>
                {order.items?.map((item, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        component="img"
                        src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=80&q=80'}
                        alt={item.name}
                        sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: { xs: 200, sm: 400 } }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quantity: {item.quantity} &bull; ${item.price?.toFixed(2)} each
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Order Footer */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
              >
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="h6" fontWeight={900} color="text.primary">
                    ${order.pricing?.total?.toFixed(2)}
                  </Typography>
                </Stack>

                <Button
                  component={RouterLink}
                  to={`/account/orders/${order._id}`}
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIosIcon sx={{ fontSize: '0.75rem !important' }} />}
                  sx={{ borderRadius: 2 }}
                >
                  View Order Details & Tracking
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
};
