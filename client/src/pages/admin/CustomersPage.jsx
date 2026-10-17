import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';

import { dashboardService } from '../../services/dashboardService';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

export const CustomersPage = () => {
  const { notify } = useNotification();

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getCustomers({ search: debouncedSearch });
      if (res.success && res.data) {
        setCustomers(res.data.customers || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      notify(err.message || 'Error loading customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch]);

  const handleToggleStatus = async (customer) => {
    try {
      const res = await dashboardService.toggleCustomerStatus(customer._id);
      if (res.success) {
        notify(res.message, 'success');
        setCustomers(prev =>
          prev.map(c => c._id === customer._id ? { ...c, isActive: !c.isActive } : c)
        );
      }
    } catch (err) {
      notify(err.message || 'Failed to toggle customer status.', 'error');
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
          Customer Accounts ({total})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor customer activity, lifetime expenditure, and account standing
        </Typography>
      </Box>

      {/* Search Input */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <TextField
          size="small"
          placeholder="Search by customer name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 420 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3.5, backgroundColor: '#ffffff' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Orders Placed</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Lifetime Spend</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Joined Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Active Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c._id} hover>
                <TableCell sx={{ fontWeight: 700 }}>
                  {c.name}
                </TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone || '-'}</TableCell>
                <TableCell align="center">
                  <Chip label={`${c.orderCount || 0} orders`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ${(c.totalSpent || 0).toFixed(2)}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.825rem', color: 'text.secondary' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={c.isActive}
                    size="small"
                    color="success"
                    onChange={() => handleToggleStatus(c)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
