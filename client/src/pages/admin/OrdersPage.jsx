import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';

import { orderService } from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const OrdersPage = () => {
  const { notify } = useNotification();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const res = await orderService.getAllOrders(params);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      notify(err.message || 'Error loading orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [debouncedSearch, statusFilter]);

  const handleOpenStatusModal = (ord) => {
    setSelectedOrder(ord);
    setNewStatus(ord.fulfillmentStatus);
    setStatusNote('');
    setCarrier(ord.trackingInfo?.carrier || '');
    setTrackingNumber(ord.trackingInfo?.trackingNumber || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      const res = await orderService.updateOrderStatus(selectedOrder._id, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus}`,
        trackingCarrier: carrier,
        trackingNumber: trackingNumber,
      });

      if (res.success) {
        notify(`Order ${selectedOrder.orderNumber} updated to ${newStatus}.`, 'success');
        setSelectedOrder(null);
        loadOrders(pagination.page);
      }
    } catch (err) {
      notify(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      delivered: 'success',
      shipped: 'info',
      processing: 'secondary',
      pending: 'warning',
      cancelled: 'error',
    };
    return (
      <Chip
        label={status?.toUpperCase()}
        color={colors[status] || 'default'}
        size="small"
        sx={{ fontWeight: 800 }}
      />
    );
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
          Order Processing & Fulfillment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Process customer orders, assign couriers, and update delivery timelines
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by order #, recipient, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 420 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Fulfillment Status</InputLabel>
            <Select
              value={statusFilter}
              label="Fulfillment Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st} sx={{ textTransform: 'capitalize' }}>{st}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer / Recipient</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((ord) => (
              <TableRow key={ord._id} hover>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {ord.orderNumber}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {ord.shippingAddress?.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ord.shippingAddress?.city}, {ord.shippingAddress?.state} &bull; {ord.shippingAddress?.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {ord.items?.length} items
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                  ${ord.pricing?.total?.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${ord.payment?.method?.toUpperCase()} &bull; ${ord.payment?.status}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  {getStatusChip(ord.fulfillmentStatus)}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  {new Date(ord.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenStatusModal(ord)}
                    sx={{ borderRadius: 2 }}
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(e, val) => loadOrders(val)}
            color="primary"
          />
        </Box>
      )}

      {/* Status Transition Dialog */}
      <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Manage Order {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Fulfillment State Transition
          </Typography>
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>Order Status</InputLabel>
            <Select
              value={newStatus}
              label="Order Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st} sx={{ textTransform: 'capitalize' }}>{st}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Courier Carrier (e.g. FedEx, BlueDart, DHL)"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Shipment Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Timeline Update Note"
            placeholder="Add a remark for the customer and audit log..."
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
          <Button variant="contained" disabled={updating} onClick={handleUpdateStatus}>
            {updating ? 'Updating...' : 'Save Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
