import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';

// Icons
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { dashboardService } from '../../services/dashboardService';
import { orderSound } from '../../utils/orderSound';
import { useNotification } from '../../contexts/NotificationContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const knownOrdersRef = React.useRef(new Set());

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getSales(7),
      dashboardService.getTopProducts(),
      dashboardService.getRecentOrders(),
    ])
      .then(([statsRes, salesRes, topRes, recentRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (salesRes.success) setSalesData(salesRes.data);
        if (topRes.success) setTopProducts(topRes.data);
        if (recentRes.success && Array.isArray(recentRes.data)) {
          setRecentOrders(recentRes.data);
          recentRes.data.forEach(o => knownOrdersRef.current.add(o._id));
        }
      })
      .catch(err => console.warn('Error loading dashboard metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  // Periodic polling for newly arrived orders
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const recentRes = await dashboardService.getRecentOrders();
        if (recentRes.success && Array.isArray(recentRes.data)) {
          const incoming = recentRes.data;
          const hasNewOrder = incoming.some(o => !knownOrdersRef.current.has(o._id));
          if (hasNewOrder && knownOrdersRef.current.size > 0) {
            orderSound.playNewOrderNotificationSound();
            notify('🔔 New order received!', 'info');
            setRecentOrders(incoming);
            dashboardService.getStats().then(s => s.success && setStats(s.data));
          }
          incoming.forEach(o => knownOrdersRef.current.add(o._id));
        }
      } catch {}
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [notify]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 4 }} />
        <Grid container spacing={3} mb={4}>
          {Array.from(new Array(4)).map((_, i) => (
            <Grid item key={i} xs={12} sm={6} lg={3}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, mb: 4 }} />
      </Box>
    );
  }

  // Find max revenue for bar scaling
  const maxRevenue = Math.max(...(salesData.map(d => d.revenue) || [1]), 100);

  return (
    <Box>
      {/* Dashboard Title & Quick Timestamp */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Analytics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time platform aggregations and revenue metrics
          </Typography>
        </Box>
        <Chip
          label="Live MongoDB Aggregations"
          color="success"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Total Sales */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  Total Gross Sales
                </Typography>
                <Typography variant="h4" fontWeight={900} color="primary.main" my={0.5}>
                  ${stats?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Excludes cancelled purchases
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main' }}>
                <AttachMoneyIcon fontSize="medium" />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Total Orders */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  Total Orders
                </Typography>
                <Typography variant="h4" fontWeight={900} my={0.5}>
                  {stats?.totalOrders || 0}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Typography variant="caption" color="warning.main" fontWeight={700}>
                    {stats?.pendingOrders || 0} Pending
                  </Typography>
                  <Typography variant="caption" color="success.main" fontWeight={700}>
                    &bull; {stats?.completedOrders || 0} Delivered
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'secondary.main' }}>
                <ShoppingCartIcon fontSize="medium" />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Total Customers */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  Registered Customers
                </Typography>
                <Typography variant="h4" fontWeight={900} my={0.5}>
                  {stats?.totalCustomers || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Verified user accounts
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'success.main' }}>
                <PeopleIcon fontSize="medium" />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Low Stock Warning */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  Low Stock Alert
                </Typography>
                <Typography variant="h4" fontWeight={900} color={stats?.lowStockCount > 0 ? 'warning.main' : 'text.primary'} my={0.5}>
                  {stats?.lowStockCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Items with &le; 10 units in stock
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main' }}>
                <WarningAmberIcon fontSize="medium" />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* MUI-Based Sales Chart Visualization */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          mb: 4,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Revenue Trend (Last 7 Days)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Daily sales distribution calculated dynamically from MongoDB aggregations
            </Typography>
          </Box>
          <Chip label="MUI Pure Component Visualization" size="small" variant="outlined" />
        </Stack>

        {/* Bar Chart Area */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 220,
            pt: 4,
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            gap: 2,
          }}
        >
          {salesData.map((item, index) => {
            const heightPercent = maxRevenue > 0 ? Math.max(10, Math.round((item.revenue / maxRevenue) * 100)) : 10;
            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Tooltip title={`$${item.revenue.toFixed(2)} (${item.orders} orders)`} arrow>
                  <Box
                    sx={{
                      width: '60%',
                      maxWidth: 48,
                      height: `${heightPercent}%`,
                      backgroundColor: item.revenue > 0 ? 'primary.main' : 'rgba(226, 232, 240, 0.8)',
                      background: item.revenue > 0 ? 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' : undefined,
                      borderRadius: '8px 8px 0 0',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scaleY(1.04)',
                        filter: 'brightness(1.1)',
                      },
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1}>
                  {item.date ? item.date.slice(5) : ''}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Recent Orders Table */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>
                Recent Orders
              </Typography>
              <Button
                component={RouterLink}
                to="/admin/orders"
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                All Orders
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((ord) => (
                    <TableRow key={ord._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')}>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {ord.orderNumber}
                      </TableCell>
                      <TableCell>
                        {ord.shippingAddress?.fullName || ord.user?.name || 'Customer'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        ${ord.pricing?.total?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ord.fulfillmentStatus}
                          size="small"
                          color={ord.fulfillmentStatus === 'delivered' ? 'success' : ord.fulfillmentStatus === 'cancelled' ? 'error' : 'warning'}
                          sx={{ textTransform: 'capitalize', fontWeight: 700, height: 22 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Selling Products */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>
                Top Performing Products
              </Typography>
              <Button
                component={RouterLink}
                to="/admin/products"
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                Catalog
              </Button>
            </Stack>

            <Stack spacing={2}>
              {topProducts.map((prod) => (
                <Stack key={prod._id} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      component="img"
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=80'}
                      alt={prod.name}
                      sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: { xs: 180, sm: 220 } }}>
                        {prod.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prod.salesCount || 0} units fulfilled &bull; ${prod.price?.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip label={`★ ${prod.averageRating || 5}`} size="small" sx={{ fontWeight: 700 }} />
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
