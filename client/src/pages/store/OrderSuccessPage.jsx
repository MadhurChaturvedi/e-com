import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

import { orderService } from '../../services/orderService';

export const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    if (!order && orderId) {
      orderService.getOrderById(orderId)
        .then(res => {
          if (res.success) setOrder(res.data);
        })
        .catch(err => console.warn('Could not fetch order:', err))
        .finally(() => setLoading(false));
    }
  }, [order, orderId]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 6 },
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 56 }} />
        </Box>

        <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1.5}>
          Order Confirmed!
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4} maxWidth={500} mx="auto">
          Thank you for your purchase. We have received your order and our fulfillment team is preparing it for shipment.
        </Typography>

        {order && (
          <Box
            sx={{
              p: 3,
              backgroundColor: '#f8fafc',
              borderRadius: 3,
              textAlign: 'left',
              maxWidth: 580,
              mx: 'auto',
              mb: 4,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                Order Identifier
              </Typography>
              <Chip label={order.fulfillmentStatus?.toUpperCase() || 'PENDING'} color="primary" size="small" sx={{ fontWeight: 800 }} />
            </Stack>

            <Typography variant="h5" fontWeight={800} color="primary.main" mb={2}>
              {order.orderNumber}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1} mb={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Recipient:</Typography>
                <Typography variant="body2" fontWeight={600}>{order.shippingAddress?.fullName}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Destination:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                <Typography variant="body2" fontWeight={600}>{order.payment?.method?.toUpperCase()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Total Paid:</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                  ${order.pricing?.total?.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={RouterLink}
            to={`/account/orders/${order?._id || orderId}`}
            variant="contained"
            size="large"
            startIcon={<ReceiptLongOutlinedIcon />}
            sx={{ borderRadius: 2.5, px: 3 }}
          >
            View Order Status
          </Button>
          <Button
            component={RouterLink}
            to="/shop"
            variant="outlined"
            size="large"
            startIcon={<StorefrontOutlinedIcon />}
            sx={{ borderRadius: 2.5, px: 3 }}
          >
            Continue Shopping
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
