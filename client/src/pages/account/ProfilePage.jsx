import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockResetIcon from '@mui/icons-material/LockReset';

import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { authService } from '../../services/authService';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { notify } = useNotification();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({ name, phone });
      if (res.success) {
        await refreshUser();
        notify('Profile updated successfully!', 'success');
      }
    } catch (err) {
      notify(err.message || 'Error updating profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        notify('Password updated successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} fontFamily="'Outfit', sans-serif" mb={4}>
        My Account & Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Personal Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
              <PersonOutlineIcon color="primary" />
              <Typography variant="h5" fontWeight={800}>
                Personal Information
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleUpdateProfile}>
              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                disabled
                label="Email Address"
                value={user?.email || ''}
                helperText="Email cannot be modified directly"
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                label="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={savingProfile}
                sx={{ borderRadius: 2.5, px: 3 }}
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
              <LockResetIcon color="secondary" />
              <Typography variant="h5" fontWeight={800}>
                Security & Password
              </Typography>
            </Stack>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                required
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                required
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                required
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="outlined"
                color="secondary"
                disabled={savingPassword}
                sx={{ borderRadius: 2.5, px: 3 }}
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
