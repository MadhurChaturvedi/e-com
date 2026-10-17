import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { couponService } from '../../services/couponService';
import { useNotification } from '../../contexts/NotificationContext';

export const CouponsPage = () => {
  const { notify } = useNotification();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    isActive: true,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponService.getAllCoupons();
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err) {
      notify(err.message || 'Error loading coupons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '10',
      minOrderAmount: '30',
      maxDiscountAmount: '50',
      usageLimit: '100',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c._id);
    setFormData({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      minOrderAmount: c.minOrderAmount ? c.minOrderAmount.toString() : '0',
      maxDiscountAmount: c.maxDiscountAmount ? c.maxDiscountAmount.toString() : '',
      usageLimit: c.usageLimit ? c.usageLimit.toString() : '',
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      notify('Code and discount value are required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount || 0),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isActive: formData.isActive,
      };

      if (editingId) {
        await couponService.updateCoupon(editingId, payload);
        notify('Coupon updated successfully.', 'success');
      } else {
        await couponService.createCoupon(payload);
        notify('Coupon created successfully.', 'success');
      }
      setDialogOpen(false);
      loadCoupons();
    } catch (err) {
      notify(err.message || 'Error saving coupon.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c) => {
    try {
      const updated = !c.isActive;
      await couponService.updateCoupon(c._id, { isActive: updated });
      notify(`Coupon ${updated ? 'activated' : 'disabled'}.`, 'success');
      setCoupons(prev => prev.map(item => item._id === c._id ? { ...item, isActive: updated } : item));
    } catch (err) {
      notify(err.message || 'Failed to update coupon status.', 'error');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await couponService.deleteCoupon(c._id);
      notify('Coupon deleted.', 'info');
      loadCoupons();
    } catch (err) {
      notify(err.message || 'Failed to delete coupon.', 'error');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Promotional Coupons & Discounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage percentage and fixed value promotion codes with usage controls
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: 2.5 }}>
          Create Coupon
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Discount Value</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Min Order</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Usage</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c._id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    {c.code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.description || 'Promotional Discount'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.discountType === 'percentage' ? 'Percentage %' : 'Fixed $'}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                  {c.maxDiscountAmount && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Max: ${c.maxDiscountAmount}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  ${c.minOrderAmount || 0}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${c.usedCount || 0} / ${c.usageLimit || '∞'}`}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={c.isActive}
                    size="small"
                    color="success"
                    onChange={() => handleToggleActive(c)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(c)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(c)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? 'Edit Coupon' : 'Create Promotional Coupon'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Coupon Code (e.g. SAVE20)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={formData.discountType}
                    label="Discount Type"
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed Dollar ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label={formData.discountType === 'percentage' ? 'Discount % (e.g. 10)' : 'Discount $ (e.g. 20)'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Order ($)"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Discount Cap ($) (Optional)"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Usage Limit Count"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Coupon'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
