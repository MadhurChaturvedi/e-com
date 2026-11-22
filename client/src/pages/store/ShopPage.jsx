import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Slider from '@mui/material/Slider';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';

import { ProductCard } from '../../components/products/ProductCard';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Editorial Shop & Category Page
 * Implements DESIGN.md:
 * - Page Title: uppercase, left-aligned, {typography.section-display}, 3rem top, 4rem bottom margin
 * - Filter Pills: horizontal row of sharp rectangular buttons (zero border-radius, 1px black border,
 *   inverted black fill with white text when active)
 * - 4-column product grid on desktop with equal width items
 * - Clean flat materiality: zero border-radius, no elevation shadows
 */
export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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

  // Debounced search sync
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

  // Fetch products
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
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('minPrice', priceRange[0]);
    newParams.set('maxPrice', priceRange[1]);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);
  const pageTitle = activeCategoryObj
    ? activeCategoryObj.name
    : currentFilter === 'trending'
    ? 'Trending Now'
    : currentFilter === 'featured'
    ? 'Campaign Essentials'
    : currentSearch
    ? `Search: "${currentSearch}"`
    : 'View All';

  return (
    <Box sx={{ width: '100%', backgroundColor: '#ffffff', minHeight: '80vh' }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
        {/* 1. Page Title as defined in DESIGN.md:
            Single heading element, uppercase, left-aligned, section-display typography,
            3rem top margin, 1.5rem sides, 3.5rem bottom margin */}
        <Box sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 300,
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1,
              color: '#000000',
              mb: 1,
            }}
          >
            {pageTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#737373', fontSize: '0.8125rem' }}>
            {pagination.total} products available
          </Typography>
        </Box>

        {/* 2. Filter Pills as defined in DESIGN.md:
            Horizontal scrollable row of button-like elements with sharp rectangular corners (borderRadius: 0),
            1px black border in default state, active state inverts with black fill and white text */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            py: 1.5,
            mb: 4,
            borderBottom: '1px solid #e6e6e6',
            borderTop: '1px solid #e6e6e6',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* "ALL" Pill */}
          <Box
            component="button"
            onClick={() => updateParam('category', '')}
            sx={{
              borderRadius: 0,
              border: '1px solid #000000',
              backgroundColor: !currentCategory ? '#000000' : '#ffffff',
              color: !currentCategory ? '#ffffff' : '#000000',
              px: 2,
              py: 0.9,
              fontSize: '0.875rem', // typography.label
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              '&:hover': {
                backgroundColor: !currentCategory ? '#262626' : '#e6e6e6',
              },
            }}
          >
            All Items
          </Box>

          {/* Trending Pill */}
          <Box
            component="button"
            onClick={() => updateParam('filter', currentFilter === 'trending' ? '' : 'trending')}
            sx={{
              borderRadius: 0,
              border: '1px solid #000000',
              backgroundColor: currentFilter === 'trending' ? '#000000' : '#ffffff',
              color: currentFilter === 'trending' ? '#ffffff' : '#000000',
              px: 2,
              py: 0.9,
              fontSize: '0.875rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: currentFilter === 'trending' ? '#262626' : '#e6e6e6',
              },
            }}
          >
            Trending
          </Box>

          {/* Category Filter Pills */}
          {categories.map((c) => {
            const isActive = currentCategory === c.slug;
            return (
              <Box
                key={c._id}
                component="button"
                onClick={() => updateParam('category', isActive ? '' : c.slug)}
                sx={{
                  borderRadius: 0,
                  border: '1px solid #000000',
                  backgroundColor: isActive ? '#000000' : '#ffffff',
                  color: isActive ? '#ffffff' : '#000000',
                  px: 2,
                  py: 0.9,
                  fontSize: '0.875rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: isActive ? '#262626' : '#e6e6e6',
                  },
                }}
              >
                {c.name}
              </Box>
            );
          })}
        </Box>

        {/* 3. Filter Controls & Sorting Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
          }}
        >
          {/* Toggle Filter Panel & Search */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon sx={{ fontSize: '1rem' }} />}
              onClick={() => setFilterDrawerOpen((prev) => !prev)}
              sx={{
                borderRadius: 0,
                border: '1px solid #000000',
                color: '#000000',
                fontSize: '0.8125rem',
                py: 0.8,
                px: 2,
              }}
            >
              {filterDrawerOpen ? 'Hide Filters' : 'Filter & Sort'}
            </Button>

            {/* Quick in-stock toggle */}
            <Box
              component="button"
              onClick={() => updateParam('inStock', !currentInStock)}
              sx={{
                borderRadius: 0,
                border: '1px solid #000000',
                backgroundColor: currentInStock ? '#000000' : '#ffffff',
                color: currentInStock ? '#ffffff' : '#000000',
                px: 1.5,
                py: 0.8,
                fontSize: '0.8125rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              In Stock Only
            </Box>
          </Stack>

          {/* Sorting Dropdown */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 0,
                  fontSize: '0.8125rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000000' },
                }}
              >
                <MenuItem value="newest">Sort: Newest</MenuItem>
                <MenuItem value="price-asc">Price: Low to High</MenuItem>
                <MenuItem value="price-desc">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="popular">Best Selling</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Collapsible Secondary Filter Bar (Price, Brands) */}
        {filterDrawerOpen && (
          <Box
            sx={{
              p: 3,
              mb: 4,
              border: '1px solid #000000',
              backgroundColor: '#ffffff',
              borderRadius: 0,
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 4 }}>
              {/* Price Range */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1.5 }}>
                  Price Range (${priceRange[0]} - ${priceRange[1]})
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, val) => setPriceRange(val)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={3000}
                  step={20}
                  sx={{ color: '#000000', mb: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePriceApply}
                  sx={{ borderRadius: 0, fontSize: '0.75rem', mt: 1 }}
                >
                  Apply Price
                </Button>
              </Box>

              {/* Brands */}
              {brands.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1.5 }}>
                    Brand
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {brands.map((b) => {
                      const isSelected = currentBrand === b.slug;
                      return (
                        <Box
                          key={b._id}
                          component="button"
                          onClick={() => updateParam('brand', isSelected ? '' : b.slug)}
                          sx={{
                            borderRadius: 0,
                            border: '1px solid #000000',
                            backgroundColor: isSelected ? '#000000' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#000000',
                            px: 1.5,
                            py: 0.6,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                          }}
                        >
                          {b.name}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* 4. Product Grid: 4 columns on desktop as specified in DESIGN.md
            "Product grids default to four columns on desktop, with each card occupying equal width." */}
        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {Array.from(new Array(8)).map((_, i) => (
              <Grid item key={i} xs={6} sm={6} md={4} lg={3}>
                <Skeleton variant="rectangular" height={360} sx={{ backgroundColor: '#e6e6e6', borderRadius: 0 }} />
                <Skeleton variant="text" sx={{ mt: 1, width: '70%' }} />
                <Skeleton variant="text" sx={{ width: '40%' }} />
              </Grid>
            ))}
          </Grid>
        ) : products.length === 0 ? (
          <Box sx={{ py: 12, textAlign: 'center', border: '1px solid #e6e6e6' }}>
            <Typography variant="h5" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
              No Products Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#737373', mb: 3 }}>
              Try clearing some filters or browse another category.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setSearchParams({})}
              sx={{ borderRadius: 0 }}
            >
              Clear All Filters
            </Button>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {products.map((product) => (
              <Grid item key={product._id} xs={6} sm={6} md={4} lg={3}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* 5. Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={(e, page) => updateParam('page', page)}
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 0,
                  border: '1px solid #000000',
                  color: '#000000',
                  '&.Mui-selected': {
                    backgroundColor: '#000000',
                    color: '#ffffff',
                  },
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};
