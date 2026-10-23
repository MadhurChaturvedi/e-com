import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Avatar from '@mui/material/Avatar';

// Icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';

import { ProductCard } from '../../components/products/ProductCard';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { optimizeImageUrl } from '../../utils/imageUrl';

export const ProductDetailsPage = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { notify } = useNotification();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    productService.getProductByIdOrSlug(idOrSlug)
      .then(async (res) => {
        if (res.success && res.data) {
          const prod = res.data;
          setProduct(prod);
          setSelectedImage(0);
          setQuantity(1);
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          // Fetch related products & reviews in parallel
          try {
            const [relRes, revRes] = await Promise.all([
              productService.getRelatedProducts(prod._id),
              reviewService.getProductReviews(prod._id),
            ]);
            if (relRes.success) setRelated(relRes.data);
            if (revRes.success) setReviews(revRes.data);
          } catch (e) {
            console.warn('Error loading related or reviews:', e);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching product details:', err);
      })
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="60%" height={50} />
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="rounded" height={100} sx={{ my: 3, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={50} width="50%" />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="md" sx={{ py: 12, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} mb={2}>Product Not Found</Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          The requested product could not be located or has been archived.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/shop')}>
          Return to Shop
        </Button>
      </Container>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const hasDiscount = product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.stockQuantity <= 0;

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stockQuantity) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariant?._id);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariant?._id);
    navigate('/checkout');
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      notify('Please write a comment for your review.', 'warning');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await reviewService.createReview(product._id, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      if (res.success) {
        notify('Your review was submitted successfully!', 'success');
        setReviews([res.data, ...reviews]);
        setReviewOpen(false);
        setReviewTitle('');
        setReviewComment('');
      }
    } catch (err) {
      notify(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image
      ? [product.image]
      : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80']);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit" underline="hover">
          Home
        </Link>
        <Link component={RouterLink} to="/shop" color="inherit" underline="hover">
          Shop
        </Link>
        {product.categoryId && (
          <Link
            component={RouterLink}
            to={`/shop?category=${product.categoryId.slug}`}
            color="inherit"
            underline="hover"
          >
            {product.categoryId.name}
          </Link>
        )}
        <Typography color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 300 }}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={6}>
        {/* Left: Product Images Gallery */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            {/* Main Stage Image */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                position: 'relative',
                pt: '85%',
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={optimizeImageUrl(images[selectedImage], { width: 900, quality: 80 })}
                alt={product.name}
                fetchpriority="high"
                loading="eager"
                decoding="async"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  p: 2,
                }}
              />
            </Paper>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: idx === selectedImage ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      flexShrink: 0,
                      p: 0.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={optimizeImageUrl(img, { width: 160, quality: 70 })}
                      alt={`Thumbnail ${idx}`}
                      loading="lazy"
                      decoding="async"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>

        {/* Right: Product Details, Stock, Variants, Pricing, Actions */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Brand & SKU */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1}>
                {product.brandId?.name || 'Exclusive Design'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SKU: {product.SKU}
              </Typography>
            </Stack>

            {/* Product Title */}
            <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={1.5}>
              {product.name}
            </Typography>

            {/* Rating & Review Count */}
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
              <Rating value={product.averageRating || 0} precision={0.1} readOnly size="small" />
              <Typography variant="body2" fontWeight={700}>
                {product.averageRating?.toFixed(1) || '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                &bull; {product.reviewCount || 0} verified customer reviews
              </Typography>
            </Stack>

            {/* Pricing Box */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                mb: 3,
              }}
            >
              <Stack direction="row" alignItems="baseline" spacing={2}>
                <Typography variant="h3" fontWeight={900} color="text.primary">
                  ${product.price?.toFixed(2)}
                </Typography>
                {hasDiscount && (
                  <>
                    <Typography variant="h5" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${product.compareAtPrice?.toFixed(2)}
                    </Typography>
                    <Chip label={`Save ${discountPercent}%`} color="error" size="small" sx={{ fontWeight: 800 }} />
                  </>
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Taxes included. Free standard shipping applies on all eligible purchases over $50.
              </Typography>
            </Box>

            {/* Description */}
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 3 }}>
              {product.description}
            </Typography>

            {/* Available Variants */}
            {product.variants && product.variants.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Select Option:
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?._id === v._id;
                    return (
                      <Chip
                        key={v._id}
                        label={`${v.name}: ${v.option}`}
                        onClick={() => setSelectedVariant(v)}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, py: 2, px: 1, borderRadius: 2 }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Stock Availability */}
            <Box sx={{ mb: 3 }}>
              {isOutOfStock ? (
                <Chip label="Currently Out of Stock" color="error" sx={{ fontWeight: 700 }} />
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={product.stockQuantity <= 5 ? `Low Stock: Only ${product.stockQuantity} left` : 'In Stock & Ready to Ship'}
                    color={product.stockQuantity <= 5 ? 'warning' : 'success'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Ships within 24 hours
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Quantity Selector & Actions */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={4}>
              {/* Quantity */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: 2.5,
                  p: 0.5,
                  backgroundColor: '#ffffff',
                }}
              >
                <IconButton
                  size="small"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => handleQuantityChange(-1)}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ px: 2, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton
                  size="small"
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  onClick={() => handleQuantityChange(1)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Add to Cart Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                startIcon={<ShoppingBagOutlinedIcon />}
                sx={{ py: 1.5, borderRadius: 2.5, fontSize: '1rem' }}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              {/* Buy Now Button */}
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                size="large"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                startIcon={<FlashOnIcon />}
                sx={{ py: 1.5, borderRadius: 2.5, fontSize: '1rem' }}
              >
                Buy Now
              </Button>

              {/* Wishlist Button */}
              <IconButton
                onClick={() => toggleWishlist(product)}
                sx={{
                  p: 1.5,
                  border: '1px solid #e2e8f0',
                  borderRadius: 2.5,
                  color: inWishlist ? 'error.main' : 'text.secondary',
                  backgroundColor: '#ffffff',
                  '&:hover': { backgroundColor: '#f8fafc' },
                }}
              >
                {inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Stack>

            {/* Guarantees Box */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                mb: 4,
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <LocalShippingOutlinedIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    <Box component="span" fontWeight={700} color="text.primary">Free Delivery</Box> on orders above $50. Guaranteed arrival tracking.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <SecurityOutlinedIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    <Box component="span" fontWeight={700} color="text.primary">Official Manufacturer Warranty</Box> and 30-day effortless returns.
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Specifications Table */}
            {product.specifications && product.specifications.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={800} mb={2}>
                  Technical Specifications
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Table size="small">
                    <TableBody>
                      {product.specifications.map((spec, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' } }}>
                          <TableCell sx={{ fontWeight: 700, width: '40%', color: 'text.secondary' }}>
                            {spec.name}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {spec.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Customer Reviews Section */}
      <Box sx={{ mt: 10, mb: 8 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
              Customer Reviews ({reviews.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verified customer feedback and product impressions
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<RateReviewOutlinedIcon />}
            onClick={() => {
              if (!isAuthenticated) {
                notify('Please sign in to post a review.', 'info');
                navigate('/login');
              } else {
                setReviewOpen(true);
              }
            }}
          >
            Write a Review
          </Button>
        </Stack>

        {reviews.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              No reviews yet for this product. Be the first to share your thoughts!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {reviews.map((rev) => (
              <Grid item key={rev._id} xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    height: '100%',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {rev.user?.name?.[0] || 'C'}
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>
                          {rev.user?.name || 'Customer'}
                        </Typography>
                        {rev.isVerifiedPurchase && (
                          <Chip
                            icon={<VerifiedIcon style={{ fontSize: 14 }} />}
                            label="Verified Purchase"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>

                  <Rating value={rev.rating} readOnly size="small" sx={{ mb: 1 }} />

                  {rev.title && (
                    <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                      {rev.title}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {rev.comment}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Review Submission Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Write a Review for {product.name}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Overall Rating</Typography>
            <Rating
              value={reviewRating}
              onChange={(e, val) => setReviewRating(val)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            label="Review Headline (Optional)"
            placeholder="e.g. Incredible audio quality and battery"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            required
            label="Your Review Details"
            placeholder="What did you like or dislike about this item? How was performance?"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submittingReview}
            onClick={handleSubmitReview}
          >
            {submittingReview ? 'Submitting...' : 'Post Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Related Products Section */}
      {related.length > 0 && (
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={3}>
            Related Products
          </Typography>
          <Grid container spacing={3}>
            {related.map((prod) => (
              <Grid item key={prod._id} xs={12} sm={6} md={3}>
                <ProductCard product={prod} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};
