import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../../contexts/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin' && from === '/') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 0,
          border: '1px solid #000000',
          backgroundColor: '#ffffff',
          boxShadow: 'none',
        }}
      >
        {/* Brand Header */}
        <Box textAlign="center" mb={3}>
          <Typography
            sx={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.6rem',
              color: '#eb0010',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              mb: 1,
            }}
          >
            NOVA<Box component="span" sx={{ color: '#000000', fontWeight: 300 }}>STORE</Box>
          </Typography>
          <Typography variant="h3" fontWeight={300} textTransform="uppercase" letterSpacing="0.04em" mb={0.5}>
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access your orders, saved items, and account settings
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 0, border: '1px solid #eb0010', backgroundColor: '#ffffff', color: '#eb0010' }}>
            {errorMsg}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.4,
              borderRadius: 0,
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              backgroundColor: '#000000',
              color: '#ffffff',
              mb: 2.5,
              '&:hover': { backgroundColor: '#262626' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          <Stack direction="row" justifyContent="center" spacing={1} mb={3}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?
            </Typography>
            <Typography
              component={RouterLink}
              to="/register"
              variant="body2"
              fontWeight={600}
              color="#000000"
              sx={{ textDecoration: 'underline' }}
            >
              Register here
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2.5, borderColor: '#e6e6e6' }}>
            <Typography variant="caption" sx={{ color: '#737373', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Quick Demo Access
            </Typography>
          </Divider>

          {/* Quick Demo Credentials Buttons */}
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => handleQuickLogin('admin@store.com', 'Admin@123456')}
              sx={{ borderRadius: 0, borderColor: '#000000', color: '#000000', justifyContent: 'flex-start' }}
            >
              Fill Admin: admin@store.com
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => handleQuickLogin('john@example.com', 'Customer@123456')}
              sx={{ borderRadius: 0, borderColor: '#000000', color: '#000000', justifyContent: 'flex-start' }}
            >
              Fill Customer: john@example.com
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};
