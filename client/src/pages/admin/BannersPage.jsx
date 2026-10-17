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
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { bannerService } from '../../services/bannerService';
import { useNotification } from '../../contexts/NotificationContext';

export const BannersPage = () => {
  const { notify } = useNotification();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    ctaLabel: 'Shop Now',
    destinationUrl: '/shop',
    displayOrder: 0,
    isActive: true,
  });

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await bannerService.getAllBanners();
      if (res.success && Array.isArray(res.data)) {
        setBanners(res.data);
      }
    } catch (err) {
      notify(err.message || 'Error loading banners.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'Shop Now',
      destinationUrl: '/shop',
      displayOrder: banners.length + 1,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingId(b._id);
    setFormData({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image || '',
      ctaLabel: b.ctaLabel || 'Shop Now',
      destinationUrl: b.destinationUrl || '/shop',
      displayOrder: b.displayOrder || 0,
      isActive: b.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image || !formData.destinationUrl) {
      notify('Title, image, and destination URL are required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      if (editingId) {
        await bannerService.updateBanner(editingId, payload);
        notify('Banner updated successfully.', 'success');
      } else {
        await bannerService.createBanner(payload);
        notify('Banner created successfully.', 'success');
      }
      setDialogOpen(false);
      loadBanners();
    } catch (err) {
      notify(err.message || 'Failed to save banner.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (b) => {
    try {
      const updated = !b.isActive;
      await bannerService.updateBanner(b._id, { isActive: updated });
      notify(`Banner ${updated ? 'activated' : 'deactivated'}.`, 'success');
      setBanners(prev => prev.map(item => item._id === b._id ? { ...item, isActive: updated } : item));
    } catch (err) {
      notify(err.message || 'Failed to update banner status.', 'error');
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete promotional banner "${b.title}"?`)) return;
    try {
      await bannerService.deleteBanner(b._id);
      notify('Banner deleted.', 'info');
      loadBanners();
    } catch (err) {
      notify(err.message || 'Failed to delete banner.', 'error');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Promotional Sliders & Banners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure dynamic homepage hero carousels and campaign banners
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: 2.5 }}>
          Create Banner
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Banner Preview</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Headline & Subtitle</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CTA Button</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Destination URL</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Order</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.map((b) => (
              <TableRow key={b._id} hover>
                <TableCell>
                  <Box
                    component="img"
                    src={b.image}
                    alt={b.title}
                    sx={{ width: 120, height: 64, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {b.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 300 }}>
                    {b.subtitle}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={b.ctaLabel || 'Shop Now'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                  {b.destinationUrl}
                </TableCell>
                <TableCell align="center">{b.displayOrder}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={b.isActive}
                    size="small"
                    color="success"
                    onChange={() => handleToggleActive(b)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(b)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(b)}>
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
          {editingId ? 'Edit Banner' : 'Create Banner'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Banner Headline"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subtitle / Description"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Desktop Image URL"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  helperText="Recommended dimension: 1600x600px high-resolution"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Call to Action (CTA) Text"
                  value={formData.ctaLabel}
                  onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Destination Link"
                  value={formData.destinationUrl}
                  onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Display Order"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Banner'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
