import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NorthWestIcon from '@mui/icons-material/NorthWest';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

import { productService } from '../../services/productService';

const HISTORY_STORAGE_KEY = 'novastore_search_history';
const AI_MODE_STORAGE_KEY = 'novastore_search_ai_mode';

const DEFAULT_HISTORY = [
  'Sony WH-1000XM5 headphones',
  'Apple MacBook Pro M3',
  'Nike Air Max sneakers',
  'Bose QuietComfort earbuds',
  'Minimalist Desk Lamp',
];

const TRENDING_SEARCHES = [
  { label: 'Sony ANC', query: 'Sony' },
  { label: 'MacBook M3 Max', query: 'MacBook' },
  { label: 'Nike Urban', query: 'Nike' },
  { label: 'Bose Ultra', query: 'Bose' },
  { label: 'Walnut Lamp', query: 'Lamp' },
];

const AI_PROMPTS = [
  { text: 'Best noise-cancelling headphones for flights & focus', query: 'Sony WH-1000XM5' },
  { text: 'High-performance laptop for coding and workstation tasks', query: 'MacBook Pro' },
  { text: 'Comfortable street sneakers with all-day cushion', query: 'Nike Air Max' },
  { text: 'Groundbreaking spatial audio wireless earbuds', query: 'Bose QuietComfort' },
];

export const MegaSearchDropdown = ({ fullWidthMobile = false, onCloseMobile = null }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // AI Mode toggle
  const [aiMode, setAiMode] = useState(() => {
    return localStorage.getItem(AI_MODE_STORAGE_KEY) === 'true';
  });

  // Search History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_HISTORY;
  });

  // Client-side in-memory query cache & abort controller
  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);

  // Persist AI Mode
  const toggleAiMode = (e) => {
    e.stopPropagation();
    const nextVal = !aiMode;
    setAiMode(nextVal);
    localStorage.setItem(AI_MODE_STORAGE_KEY, nextVal.toString());
  };

  // Add search term to history
  const saveToHistory = useCallback((term) => {
    if (!term || term.trim().length < 2) return;
    const clean = term.trim();
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Remove single history item
  const removeHistoryItem = (e, itemToRemove) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Clear all history
  const clearAllHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {}
  };

  // Debounced live product search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (cacheRef.current.has(cacheKey)) {
      setResults(cacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (abortRef.current) abortRef.current.abort();

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await productService.getProducts(
          { search: trimmed, limit: 5 },
          { signal: controller.signal }
        );
        if (res.success) {
          const list = res.data?.products || (Array.isArray(res.data) ? res.data : []);
          if (cacheRef.current.size > 50) {
            const firstKey = cacheRef.current.keys().next().value;
            cacheRef.current.delete(firstKey);
          }
          cacheRef.current.set(cacheKey, list);
          setResults(list);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.warn('Mega search error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 380);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  const handleExecuteSearch = (searchTerm) => {
    const term = searchTerm || query;
    if (!term || !term.trim()) return;
    saveToHistory(term);
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    navigate(`/shop?search=${encodeURIComponent(term.trim())}`);
  };

  const handleSelectProduct = (product) => {
    saveToHistory(product.name);
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    navigate(`/product/${product.slug || product._id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  const isTyping = query.trim().length >= 2;

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: fullWidthMobile ? '100%' : { xs: '100%', md: 480, lg: 520 },
          mx: fullWidthMobile ? 0 : { xs: 0, md: 'auto' },
          zIndex: 1400,
        }}
      >
        {/* Main Search Input Capsule (Google-style with AI Pill) */}
        <Paper
          elevation={isOpen ? 8 : 0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.8,
            py: 0.8,
            borderRadius: isOpen ? '24px 24px 0 0' : '999px',
            border: '1px solid',
            borderColor: isOpen ? '#4f46e5' : 'rgba(226, 232, 240, 0.9)',
            backgroundColor: '#ffffff',
            boxShadow: isOpen
              ? '0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 0 0 3px rgba(79, 70, 229, 0.12)'
              : '0 2px 6px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            zIndex: 1401,
          }}
        >
          {/* Left Search / Plus Icon */}
          <SearchIcon
            sx={{
              color: isOpen ? '#4f46e5' : '#64748b',
              fontSize: '1.25rem',
              mr: 1.2,
              transition: 'color 0.2s ease',
            }}
          />

          {/* Text Input */}
          <InputBase
            inputRef={inputRef}
            placeholder={aiMode ? 'Ask NovaStore AI or search products...' : 'Search products, electronics, apparel...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            sx={{
              flex: 1,
              fontSize: '0.92rem',
              fontWeight: 500,
              color: '#0f172a',
              '& input': {
                py: 0.3,
                '&::placeholder': {
                  color: aiMode ? '#6366f1' : '#94a3b8',
                  opacity: 0.85,
                  fontWeight: 500,
                },
              },
            }}
          />

          {/* Clear button if text entered */}
          {query && (
            <IconButton
              size="small"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              sx={{ p: '3px', color: '#94a3b8', mr: 0.5, '&:hover': { color: '#0f172a' } }}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}

          {/* Loading Spinner */}
          {loading && (
            <CircularProgress size={18} sx={{ color: '#4f46e5', mr: 1 }} />
          )}

          {/* Google-style AI Mode Pill Chip */}
          <Tooltip title={aiMode ? 'AI Search Mode Enabled' : 'Enable AI Intelligent Search'}>
            <Chip
              icon={
                <AutoAwesomeIcon
                  sx={{
                    fontSize: '0.95rem !important',
                    color: aiMode ? '#ffffff !important' : '#4f46e5 !important',
                    animation: aiMode ? 'pulse 2s infinite' : 'none',
                  }}
                />
              }
              label="AI Mode"
              size="small"
              onClick={toggleAiMode}
              sx={{
                borderRadius: 999,
                fontWeight: 800,
                fontSize: '0.74rem',
                letterSpacing: '0.02em',
                px: 0.8,
                height: 28,
                cursor: 'pointer',
                background: aiMode
                  ? 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'
                  : 'rgba(79, 70, 229, 0.08)',
                color: aiMode ? '#ffffff' : '#4f46e5',
                border: '1px solid',
                borderColor: aiMode ? 'transparent' : 'rgba(79, 70, 229, 0.25)',
                boxShadow: aiMode ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  background: aiMode
                    ? 'linear-gradient(135deg, #4338ca 0%, #0891b2 100%)'
                    : 'rgba(79, 70, 229, 0.15)',
                  transform: 'scale(1.03)',
                },
              }}
            />
          </Tooltip>
        </Paper>

        {/* Mega Dropdown Panel (Exact Google-style Card with Rounded Bottom) */}
        <Fade in={isOpen} timeout={180}>
          <Paper
            elevation={12}
            sx={{
              display: isOpen ? 'block' : 'none',
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: '-1px', // Seamless connection to top input
              backgroundColor: '#ffffff',
              borderRadius: '0 0 24px 24px',
              border: '1px solid #4f46e5',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.22)',
              overflow: 'hidden',
              zIndex: 1400,
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
          >
            {/* AI Mode Active Banner */}
            {aiMode && (
              <Box
                sx={{
                  px: 2.2,
                  py: 1.2,
                  background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  borderBottom: '1px solid rgba(79, 70, 229, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SparklesIcon sx={{ fontSize: '1rem', color: '#4f46e5' }} />
                  <Typography variant="caption" fontWeight={800} color="secondary.main" letterSpacing="0.02em">
                    AI SMART RECOMMENDATION ACTIVE
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Natural language discovery
                </Typography>
              </Box>
            )}

            {/* STATE 1: Empty or Not Typing Yet -> Shows Recent History & Trending (Screenshot Match) */}
            {!isTyping && (
              <Box sx={{ py: 1.5 }}>
                {/* Section Header: Recent Searches */}
                {history.length > 0 && (
                  <Box>
                    <Box sx={{ px: 2.2, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                        Recent Searches
                      </Typography>
                      <Button
                        size="small"
                        onClick={clearAllHistory}
                        sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary', p: 0, minWidth: 'auto', textTransform: 'none' }}
                      >
                        Clear History
                      </Button>
                    </Box>

                    {/* History Items (Google Style with Clock Icon & Remove Button) */}
                    <List disablePadding>
                      {history.map((item, idx) => (
                        <ListItem
                          key={idx}
                          disablePadding
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => removeHistoryItem(e, item)}
                              sx={{
                                color: '#94a3b8',
                                mr: 1,
                                opacity: { xs: 1, sm: 0.5 },
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 1, color: '#ef4444' },
                              }}
                            >
                              <CloseIcon sx={{ fontSize: '0.95rem' }} />
                            </IconButton>
                          }
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                              '& .history-arrow': { opacity: 1 },
                            },
                          }}
                        >
                          <ListItemButton
                            onClick={() => handleExecuteSearch(item)}
                            sx={{ py: 1.1, px: 2.2 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36, color: '#64748b' }}>
                              <HistoryIcon sx={{ fontSize: '1.2rem' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                color: '#0f172a',
                              }}
                            />
                            <NorthWestIcon
                              className="history-arrow"
                              sx={{
                                fontSize: '0.9rem',
                                color: '#94a3b8',
                                opacity: 0,
                                transition: 'opacity 0.2s ease',
                                mr: 2,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* AI Prompts Section (Visible when AI Mode is ON) */}
                {aiMode && (
                  <Box sx={{ px: 2.2, pt: 1.5, pb: 1, mt: history.length > 0 ? 1 : 0, borderTop: history.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <Typography variant="caption" fontWeight={800} color="secondary.main" textTransform="uppercase" letterSpacing="0.05em" display="block" mb={1}>
                      ✨ Suggested AI Inquiries
                    </Typography>
                    <Stack spacing={0.8}>
                      {AI_PROMPTS.map((prompt, pIdx) => (
                        <Paper
                          key={pIdx}
                          elevation={0}
                          onClick={() => handleExecuteSearch(prompt.query)}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(79, 70, 229, 0.04)',
                            border: '1px solid rgba(79, 70, 229, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(79, 70, 229, 0.09)',
                              transform: 'translateX(3px)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AutoAwesomeIcon sx={{ fontSize: '0.95rem', color: '#4f46e5' }} />
                            <Typography variant="body2" fontWeight={600} color="#1e1b4b">
                              {prompt.text}
                            </Typography>
                          </Stack>
                          <ArrowForwardIcon sx={{ fontSize: '0.9rem', color: '#4f46e5' }} />
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Trending Popular Searches */}
                <Box sx={{ px: 2.2, pt: 1.5, pb: 0.5, borderTop: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" display="block" mb={1}>
                    🔥 Popular In NovaStore
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.8}>
                    {TRENDING_SEARCHES.map((t, idx) => (
                      <Chip
                        key={idx}
                        icon={<TrendingUpIcon sx={{ fontSize: '0.85rem !important', color: '#4f46e5 !important' }} />}
                        label={t.label}
                        size="small"
                        onClick={() => handleExecuteSearch(t.query)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            '& .MuiChip-icon': { color: '#ffffff !important' },
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}

            {/* STATE 2: User is Typing -> Shows Live Matching Products & Suggestions */}
            {isTyping && (
              <Box sx={{ py: 1.5 }}>
                {/* Instant Search Bar Header */}
                <Box sx={{ px: 2.2, py: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                    Matching Products ({results.length})
                  </Typography>
                  <Typography variant="caption" color="secondary.main" fontWeight={700}>
                    Press Enter to view all
                  </Typography>
                </Box>

                {/* Products List */}
                {results.length > 0 ? (
                  <List disablePadding>
                    {results.map((product) => (
                      <ListItem
                        key={product._id}
                        disablePadding
                        sx={{
                          '&:hover': { backgroundColor: '#f8fafc' },
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleSelectProduct(product)}
                          sx={{ py: 1.2, px: 2.2 }}
                        >
                          <Box
                            component="img"
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}
                            alt={product.name}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              objectFit: 'cover',
                              mr: 1.8,
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                            }}
                          />
                          <ListItemText
                            primary={product.name}
                            secondary={
                              <Stack direction="row" spacing={1.5} alignItems="center" mt={0.3}>
                                <Typography variant="caption" fontWeight={800} color="secondary.main">
                                  ${product.price?.toFixed(2)}
                                </Typography>
                                {product.compareAtPrice > product.price && (
                                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                                    ${product.compareAtPrice?.toFixed(2)}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  &bull; {product.brandId?.name || product.categoryId?.name || 'In Stock'}
                                </Typography>
                              </Stack>
                            }
                            primaryTypographyProps={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: '#0f172a',
                              noWrap: true,
                            }}
                          />
                          <Chip
                            label="View"
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(79, 70, 229, 0.08)',
                              color: '#4f46e5',
                              borderRadius: 1.5,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : !loading ? (
                  <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                    <SearchIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      No matching products found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Try checking for typos or searching with broader terms
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleExecuteSearch()}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Search all catalog for "{query}"
                    </Button>
                  </Box>
                ) : null}

                {/* Footer Action */}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ px: 2, pt: 0.5 }}>
                  <Button
                    fullWidth
                    onClick={() => handleExecuteSearch()}
                    startIcon={<SearchIcon fontSize="small" />}
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{
                      justifyContent: 'space-between',
                      borderRadius: 2,
                      fontWeight: 800,
                      py: 1,
                      textTransform: 'none',
                      color: '#4f46e5',
                      backgroundColor: 'rgba(79, 70, 229, 0.05)',
                      '&:hover': {
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                      },
                    }}
                  >
                    View all matching results for "{query}"
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Fade>
      </Box>
    </ClickAwayListener>
  );
};

export default MegaSearchDropdown;
