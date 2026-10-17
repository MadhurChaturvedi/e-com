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
import StorefrontIcon from '@mui/icons-material/Storefront';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../../contexts/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

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
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Brand Header */}
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              mx: 'auto',
              mb: 1.5,
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
            }}
          >
            <StorefrontIcon />
          </Box>
          <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your orders, cart, and profile
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
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
            sx={{ py: 1.4, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', mb: 2.5 }}
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
              fontWeight={700}
              color="primary.main"
              sx={{ textDecoration: 'none' }}
            >
              Register here
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              DEMO QUICK LOGIN
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
              sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
            >
              Fill Admin: admin@store.com
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => handleQuickLogin('john@example.com', 'Customer@123456')}
              sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
            >
              Fill Customer: john@example.com
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};
