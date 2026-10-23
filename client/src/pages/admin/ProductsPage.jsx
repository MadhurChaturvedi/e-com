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
import Switch from '@mui/material/Switch';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

export const ProductsPage = () => {
  const { notify } = useNotification();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    SKU: '',
    price: '',
    compareAtPrice: '',
    stockQuantity: '',
    imagesText: '',
    isTrending: false,
    isFeatured: false,
    isActive: true,
  });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        productService.getProducts({ page, limit: 10, search: debouncedSearch, includeInactive: 'true' }),
        categoryService.getCategories(),
        brandService.getBrands(),
      ]);

      if (prodRes.success) {
        setProducts(prodRes.data);
        if (prodRes.pagination) setPagination(prodRes.pagination);
      }
      if (catRes.success) setCategories(catRes.data);
      if (brandRes.success) setBrands(brandRes.data);
    } catch (err) {
      notify(err.message || 'Error loading products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [debouncedSearch]);

  const getCategorySampleImage = (categoryName) => {
    const lower = (categoryName || '').toLowerCase();
    if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('apparel')) {
      return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('shoe') || lower.includes('footwear')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('computer') || lower.includes('laptop') || lower.includes('tech')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('phone') || lower.includes('mobile')) {
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('home') || lower.includes('furni') || lower.includes('decor')) {
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('watch') || lower.includes('jewel') || lower.includes('access')) {
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      categoryId: categories[0]?._id || '',
      brandId: brands[0]?._id || '',
      SKU: `SKU-${Date.now().toString().slice(-6)}`,
      price: '',
      compareAtPrice: '',
      stockQuantity: '10',
      imagesText: '',
      isTrending: false,
      isFeatured: false,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p._id);
    setFormData({
      name: p.name,
      description: p.description,
      categoryId: p.categoryId?._id || p.categoryId || '',
      brandId: p.brandId?._id || p.brandId || '',
      SKU: p.SKU,
      price: p.price.toString(),
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : '',
      stockQuantity: p.stockQuantity.toString(),
      imagesText: p.images?.join('\n') || '',
      isTrending: Boolean(p.isTrending),
      isFeatured: Boolean(p.isFeatured),
      isActive: Boolean(p.isActive),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price || !formData.SKU) {
      notify('Please fill out all required product fields.', 'warning');
      return;
    }

    const imagesArray = formData.imagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const categoryObj = categories.find((c) => c._id === formData.categoryId);
    const categoryName = categoryObj?.name || '';
    const fallbackImage = getCategorySampleImage(categoryName);

    const payload = {
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      brandId: formData.brandId || null,
      SKU: formData.SKU,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : 0,
      stockQuantity: Number(formData.stockQuantity),
      images: imagesArray.length > 0 ? imagesArray : [fallbackImage],
      isTrending: formData.isTrending,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await productService.updateProduct(editingId, payload);
        notify('Product updated successfully.', 'success');
      } else {
        await productService.createProduct(payload);
        notify('New product created successfully.', 'success');
      }
      setDialogOpen(false);
      loadData(pagination.page);
    } catch (err) {
      notify(err.message || 'Error saving product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (p, field) => {
    try {
      const updatedValue = !p[field];
      await productService.updateProductStatus(p._id, { [field]: updatedValue });
      notify(`Updated ${field} for "${p.name}".`, 'success');
      setProducts(prev =>
        prev.map(item => item._id === p._id ? { ...item, [field]: updatedValue } : item)
      );
    } catch (err) {
      notify(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to delete product "${p.name}"?`)) return;
    try {
      await productService.deleteProduct(p._id);
      notify('Product deleted.', 'info');
      loadData(pagination.page);
    } catch (err) {
      notify(err.message || 'Error deleting product.', 'error');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Product Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage catalogue items, pricing, inventory stock, and promotions
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: 2.5 }}>
          Create Product
        </Button>
      </Stack>

      {/* Search & Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <TextField
          size="small"
          placeholder="Search by name, SKU, or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Flags</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      component="img"
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=80'}
                      alt={p.name}
                      sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.brandId?.name || 'Exclusive'}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {p.SKU}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.categoryId?.name || 'Unassigned'} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    ${p.price?.toFixed(2)}
                  </Typography>
                  {p.compareAtPrice > p.price && (
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${p.compareAtPrice?.toFixed(2)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${p.stockQuantity} units`}
                    size="small"
                    color={p.stockQuantity === 0 ? 'error' : p.stockQuantity <= 5 ? 'warning' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title={p.isTrending ? 'Trending: Click to toggle' : 'Not Trending'}>
                      <IconButton
                        size="small"
                        color={p.isTrending ? 'primary' : 'default'}
                        onClick={() => handleToggleStatus(p, 'isTrending')}
                      >
                        <WhatshotIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={p.isFeatured ? 'Featured: Click to toggle' : 'Not Featured'}>
                      <IconButton
                        size="small"
                        color={p.isFeatured ? 'warning' : 'default'}
                        onClick={() => handleToggleStatus(p, 'isFeatured')}
                      >
                        <StarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={p.isActive}
                    size="small"
                    color="success"
                    onChange={() => handleToggleStatus(p, 'isActive')}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(p)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
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
            onChange={(e, val) => loadData(val)}
            color="primary"
          />
        </Box>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? 'Edit Product' : 'Create New Product'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  required
                  label="Product Title"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="SKU Identifier"
                  value={formData.SKU}
                  onChange={(e) => setFormData({ ...formData, SKU: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Brand (Optional)</InputLabel>
                  <Select
                    value={formData.brandId}
                    label="Brand (Optional)"
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  >
                    <MenuItem value="">None / Store Brand</MenuItem>
                    {brands.map((b) => (
                      <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Current Price ($)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Original / Compare Price ($)"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Stock Inventory Quantity"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Product Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Image URLs (One URL per line)"
                  value={formData.imagesText}
                  onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  helperText="Enter distinct image URLs (one per line), or pick a preset below, or leave blank to auto-assign from selected category."
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8, mt: 1 }}>
                  <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', fontWeight: 600 }}>
                    Quick presets:
                  </Typography>
                  <Chip
                    size="small"
                    label="✨ Auto Category"
                    onClick={() => {
                      const categoryObj = categories.find((c) => c._id === formData.categoryId);
                      setFormData({ ...formData, imagesText: getCategorySampleImage(categoryObj?.name) });
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="👟 Shoes"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="💻 Laptop"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="📱 Smartphone"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="🎧 Headphones"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="⌚ Watch"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="👕 Apparel"
                    onClick={() => setFormData({ ...formData, imagesText: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80' })}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isTrending}
                        onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                      />
                    }
                    label="Trending Flag"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      />
                    }
                    label="Featured Flag"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Active in Public Store"
                  />
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
