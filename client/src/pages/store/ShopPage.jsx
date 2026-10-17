import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { ProductCard } from '../../components/products/ProductCard';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { useDebounce } from '../../hooks/useDebounce';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Filter States from URL or defaults
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentRating = searchParams.get('rating') || '';
  const currentFilter = searchParams.get('filter') || ''; // 'trending' | 'featured'
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 3000;

  const [priceRange, setPriceRange] = useState([minPriceParam, maxPriceParam]);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Load filters metadata
  useEffect(() => {
    Promise.all([
      categoryService.getCategories(),
      brandService.getBrands(),
    ]).then(([catRes, brandRes]) => {
      if (catRes.success) setCategories(catRes.data);
      if (brandRes.success) setBrands(brandRes.data);
    }).catch(err => console.warn('Could not load filters metadata:', err));
  }, []);

  // Sync state if URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
    setPriceRange([minPriceParam, maxPriceParam]);
  }, [currentSearch, minPriceParam, maxPriceParam]);

  // Debounced live search auto-sync (prevents database spam on every letter typed)
  useEffect(() => {
    const trimmed = debouncedSearchInput.trim();
    if (trimmed !== currentSearch.trim()) {
      const newParams = new URLSearchParams(searchParams);
      if (trimmed) {
        newParams.set('search', trimmed);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1');
      setSearchParams(newParams);
    }
  }, [debouncedSearchInput]);

  // Fetch products from backend API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sort: currentSort,
      };

      if (currentCategory) params.category = currentCategory;
      if (currentBrand) params.brand = currentBrand;
      if (currentSearch) params.search = currentSearch;
      if (currentInStock) params.inStock = 'true';
      if (currentRating) params.rating = currentRating;
      if (minPriceParam > 0) params.minPrice = minPriceParam;
      if (maxPriceParam < 3000) params.maxPrice = maxPriceParam;
      if (currentFilter === 'trending') params.isTrending = 'true';
      if (currentFilter === 'featured') params.isFeatured = 'true';

      const res = await productService.getProducts(params);
      if (res.success) {
        setProducts(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentSort,
    currentCategory,
    currentBrand,
    currentSearch,
    currentInStock,
    currentRating,
    minPriceParam,
    maxPriceParam,
    currentFilter,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('minPrice', priceRange[0]);
    newParams.set('maxPrice', priceRange[1]);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setSearchInput('');
    setPriceRange([0, 3000]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif">
          Explore Products
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse authentic items with verified specifications and immediate dispatch
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Sidebar Filter Panel */}
        <Grid item xs={12} md={3}>
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
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterListIcon fontSize="small" color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Filters
                </Typography>
              </Stack>
              <Button
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleResetFilters}
                sx={{ fontSize: '0.75rem' }}
              >
                Reset
              </Button>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Categories Filter */}
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              Categories
            </Typography>
            <RadioGroup
              value={currentCategory}
              onChange={(e) => updateParam('category', e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value=""
                control={<Radio size="small" />}
                label={<Typography variant="body2">All Categories</Typography>}
              />
              {categories.map((c) => (
                <FormControlLabel
                  key={c._id}
                  value={c.slug}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">{c.name}</Typography>}
                />
              ))}
            </RadioGroup>

            <Divider sx={{ mb: 2.5 }} />

            {/* Brands Filter */}
            {brands.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  Brands
                </Typography>
                <RadioGroup
                  value={currentBrand}
                  onChange={(e) => updateParam('brand', e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value=""
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">All Brands</Typography>}
                  />
                  {brands.map((b) => (
                    <FormControlLabel
                      key={b._id}
                      value={b.slug}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">{b.name}</Typography>}
                    />
                  ))}
                </RadioGroup>
                <Divider sx={{ mb: 2.5 }} />
              </>
            )}

            {/* Price Range Filter */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Price Range ($)
            </Typography>
            <Slider
              value={priceRange}
              onChange={(e, val) => setPriceRange(val)}
              valueLabelDisplay="auto"
              min={0}
              max={3000}
              step={20}
              sx={{ color: 'primary.main', mb: 1 }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                ${priceRange[0]}
              </Typography>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                ${priceRange[1]}
              </Typography>
            </Stack>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handlePriceApply}
              sx={{ borderRadius: 2, mb: 2.5 }}
            >
              Apply Price
            </Button>

            <Divider sx={{ mb: 2.5 }} />

            {/* In Stock & Availability Filter */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Availability
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={currentInStock}
                  onChange={(e) => updateParam('inStock', e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">In Stock Only</Typography>}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2.5 }} />

            {/* Rating Filter */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Minimum Customer Rating
            </Typography>
            <RadioGroup
              value={currentRating}
              onChange={(e) => updateParam('rating', e.target.value)}
            >
              <FormControlLabel value="" control={<Radio size="small" />} label={<Typography variant="body2">Any Rating</Typography>} />
              <FormControlLabel value="4" control={<Radio size="small" />} label={<Typography variant="body2">4★ and above</Typography>} />
              <FormControlLabel value="3" control={<Radio size="small" />} label={<Typography variant="body2">3★ and above</Typography>} />
            </RadioGroup>
          </Paper>
        </Grid>

        {/* Right Main Product Area */}
        <Grid item xs={12} md={9}>
          {/* Controls Bar: Search, Result Count, Sort */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
            }}
          >
            {/* Inline Search */}
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 360 } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search products in view..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Results count & Sort */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>
                Showing {products.length} of {pagination.total} items
              </Typography>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={currentSort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="newest">Sort: Newest</MenuItem>
                  <MenuItem value="price-asc">Price: Low to High</MenuItem>
                  <MenuItem value="price-desc">Price: High to Low</MenuItem>
                  <MenuItem value="rating">Highest Rated</MenuItem>
                  <MenuItem value="popular">Best Selling</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Active Filter Chips */}
          {(currentCategory || currentBrand || currentSearch || currentInStock || currentRating || currentFilter) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
              {currentCategory && (
                <Chip
                  label={`Category: ${currentCategory}`}
                  onDelete={() => updateParam('category', '')}
                  size="small"
                  color="primary"
                />
              )}
              {currentBrand && (
                <Chip
                  label={`Brand: ${currentBrand}`}
                  onDelete={() => updateParam('brand', '')}
                  size="small"
                  color="primary"
                />
              )}
              {currentSearch && (
                <Chip
                  label={`Search: "${currentSearch}"`}
                  onDelete={() => updateParam('search', '')}
                  size="small"
                />
              )}
              {currentInStock && (
                <Chip
                  label="In Stock Only"
                  onDelete={() => updateParam('inStock', false)}
                  size="small"
                />
              )}
              {currentRating && (
                <Chip
                  label={`Rating >= ${currentRating}★`}
                  onDelete={() => updateParam('rating', '')}
                  size="small"
                />
              )}
            </Stack>
          )}

          {/* Product Grid */}
          {loading ? (
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, i) => (
                <Grid item key={i} xs={12} sm={6} lg={4}>
                  <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : products.length === 0 ? (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                borderRadius: 4,
                border: '1px dashed #cbd5e1',
                backgroundColor: '#ffffff',
              }}
            >
              <Typography variant="h5" fontWeight={700} mb={1}>
                No Products Found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3} maxWidth={400} mx="auto">
                No items match your active filters. Try broadening your criteria or reset filters to see all available inventory.
              </Typography>
              <Button variant="contained" onClick={handleResetFilters}>
                Reset All Filters
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item key={product._id} xs={12} sm={6} lg={4}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={currentPage}
                    onChange={(e, val) => updateParam('page', val)}
                    color="primary"
                    shape="rounded"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
