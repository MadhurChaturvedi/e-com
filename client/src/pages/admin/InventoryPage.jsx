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
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { dashboardService } from '../../services/dashboardService';
import { productService } from '../../services/productService';
import { useNotification } from '../../contexts/NotificationContext';

export const InventoryPage = () => {
  const { notify } = useNotification();

  const [lowStock, setLowStock] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick adjust stock dialog
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lowRes, histRes] = await Promise.all([
        dashboardService.getLowStock(),
        dashboardService.getInventoryHistory(),
      ]);
      if (lowRes.success) setLowStock(lowRes.data);
      if (histRes.success) setHistory(histRes.data);
    } catch (err) {
      notify(err.message || 'Error loading inventory data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (p) => {
    setAdjustProduct(p);
    setNewStock(p.stockQuantity.toString());
  };

  const handleSaveStock = async () => {
    if (!adjustProduct) return;
    try {
      setAdjusting(true);
      await productService.updateProduct(adjustProduct._id, {
        stockQuantity: Number(newStock),
      });
      notify(`Updated stock for ${adjustProduct.name} to ${newStock} units.`, 'success');
      setAdjustProduct(null);
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to adjust stock.', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
          Inventory Control & Audit History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track real-time stock levels, low-quantity alerts, and inventory ledger transactions
        </Typography>
      </Box>

      {/* Low Stock Alerts Section */}
      <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h6" fontWeight={800}>
            Urgent Low-Stock Alerts ({lowStock.length})
          </Typography>
        </Stack>

        {lowStock.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            All warehouse inventory quantities are currently healthy. No items below warning threshold (10 units).
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Current Units</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Quick Restock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStock.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{p.SKU}</TableCell>
                    <TableCell>{p.categoryId?.name || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${p.stockQuantity} units remaining`}
                        color={p.stockQuantity === 0 ? 'error' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenAdjust(p)}
                        sx={{ borderRadius: 2 }}
                      >
                        Adjust Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Inventory Transactions Audit Ledger */}
      <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Typography variant="h6" fontWeight={800} mb={1}>
          Inventory Transaction Audit History
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
          Complete audit trail of stock deductions on sales, restocks, and order cancellations
        </Typography>

        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No stock modification transactions logged yet. Place an order or adjust stock to see ledger records.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Transaction Type</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Delta</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Prev &rarr; New</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason / Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx._id} hover>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {tx.product?.name || 'Archived Product'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type?.toUpperCase()}
                        size="small"
                        color={tx.type === 'sale' ? 'primary' : tx.type === 'cancellation' ? 'warning' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: tx.quantityChanged < 0 ? 'error.main' : 'success.main' }}>
                      {tx.quantityChanged > 0 ? `+${tx.quantityChanged}` : tx.quantityChanged}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
                      {tx.previousStock} &rarr; {tx.newStock}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {tx.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Adjust Stock Dialog */}
      <Dialog open={Boolean(adjustProduct)} onClose={() => setAdjustProduct(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Adjust Stock Quantity</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Product: <strong>{adjustProduct?.name}</strong>
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="New Total Stock Quantity"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjustProduct(null)}>Cancel</Button>
          <Button variant="contained" disabled={adjusting} onClick={handleSaveStock}>
            {adjusting ? 'Saving...' : 'Update Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
