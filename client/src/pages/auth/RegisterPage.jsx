import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join NovaStore for fast ordering and personalized recommendations
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 0, border: '1px solid #eb0010', backgroundColor: '#ffffff', color: '#eb0010' }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

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
            helperText="Minimum 6 characters"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              backgroundColor: '#000000',
              color: '#ffffff',
              mb: 2.5,
              '&:hover': { backgroundColor: '#333333' }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>

          <Stack direction="row" justifyContent="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Already registered?
            </Typography>
            <Typography
              component={RouterLink}
              to="/login"
              variant="body2"
              fontWeight={600}
              color="text.primary"
              sx={{ textDecoration: 'underline' }}
            >
              Sign In
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};
