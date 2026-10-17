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

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { brandService } from '../../services/brandService';
import { useNotification } from '../../contexts/NotificationContext';

export const BrandsPage = () => {
  const { notify } = useNotification();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    websiteUrl: '',
    displayOrder: 0,
    isActive: true,
  });

  const loadBrands = async () => {
    try {
      setLoading(true);
      const res = await brandService.getBrands();
      if (res.success && Array.isArray(res.data)) {
        setBrands(res.data);
      }
    } catch (err) {
      notify(err.message || 'Error loading brands.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
      description: '',
      websiteUrl: 'https://',
      displayOrder: brands.length + 1,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingId(b._id);
    setFormData({
      name: b.name,
      logo: b.logo || '',
      description: b.description || '',
      websiteUrl: b.websiteUrl || '',
      displayOrder: b.displayOrder || 0,
      isActive: b.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      notify('Brand name is required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        logo: formData.logo,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        displayOrder: Number(formData.displayOrder),
        isActive: formData.isActive,
      };

      if (editingId) {
        await brandService.updateBrand(editingId, payload);
        notify('Brand updated successfully.', 'success');
      } else {
        await brandService.createBrand(payload);
        notify('Brand created successfully.', 'success');
      }
      setDialogOpen(false);
      loadBrands();
    } catch (err) {
      notify(err.message || 'Error saving brand.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete brand "${b.name}"?`)) return;
    try {
      await brandService.deleteBrand(b._id);
      notify('Brand deleted.', 'info');
      loadBrands();
    } catch (err) {
      notify(err.message || 'Cannot delete brand with associated products.', 'error');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Brands & Manufacturers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage product manufacturers, authentic brand labels, and logos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: 2.5 }}>
          Add Brand
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Logo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Brand Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Official Website</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Display Order</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((b) => (
              <TableRow key={b._id} hover>
                <TableCell>
                  <Box
                    component="img"
                    src={b.logo || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=60&q=80'}
                    alt={b.name}
                    sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{b.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{b.slug}</TableCell>
                <TableCell>
                  {b.websiteUrl ? (
                    <Typography component="a" href={b.websiteUrl} target="_blank" variant="body2" color="primary.main">
                      {b.websiteUrl}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="center">{b.displayOrder}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={b.isActive ? 'Active' : 'Disabled'}
                    size="small"
                    color={b.isActive ? 'success' : 'default'}
                    sx={{ fontWeight: 700 }}
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
          {editingId ? 'Edit Brand' : 'Add Brand'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Brand Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Logo URL"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website URL"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Brand'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
