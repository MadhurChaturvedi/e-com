import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import { settingsService } from '../../services/dashboardService';
import { useNotification } from '../../contexts/NotificationContext';

export const SettingsPage = () => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: 'NovaStore',
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    shipping: {
      freeShippingThreshold: 50,
      standardShippingFee: 10,
    },
    paymentMethods: {
      cod: true,
      card: true,
      upi: true,
      netbanking: true,
    },
    announcement: {
      enabled: true,
      message: '',
    },
  });

  useEffect(() => {
    settingsService.getAdminSettings()
      .then(res => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(err => console.warn('Could not load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingsService.updateAdminSettings(settings);
      if (res.success) {
        notify('Store settings updated successfully!', 'success');
      }
    } catch (err) {
      notify(err.message || 'Error updating settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} fontFamily="'Outfit', sans-serif">
          Store Configuration & Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure branding, contact details, shipping parameters, and active payment channels
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSave}>
        {/* Section 1: Store Identity */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
          <Typography variant="h6" fontWeight={800} mb={3}>
            1. Store Identity & Contact
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Store Name"
                value={settings.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Store Tagline"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Support Email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Support Phone"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Headquarters Physical Address"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Shipping Rules */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
          <Typography variant="h6" fontWeight={800} mb={3}>
            2. Shipping Rates & Thresholds
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Free Shipping Minimum Threshold ($)"
                value={settings.shipping?.freeShippingThreshold ?? 50}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) },
                  })
                }
                helperText="Orders at or above this subtotal qualify for free shipping"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Standard Delivery Fee ($)"
                value={settings.shipping?.standardShippingFee ?? 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, standardShippingFee: Number(e.target.value) },
                  })
                }
                helperText="Charged for orders below the free shipping threshold"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Payment Methods & Announcement */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 4 }}>
          <Typography variant="h6" fontWeight={800} mb={3}>
            3. Payment Gateways & Top Announcement
          </Typography>

          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Enabled Payment Methods:
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.paymentMethods?.cod ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, cod: e.target.checked },
                    })
                  }
                />
              }
              label="Cash on Delivery (COD)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.paymentMethods?.card ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, card: e.target.checked },
                    })
                  }
                />
              }
              label="Credit / Debit Card (Stripe)"
            />
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Header Announcement Message:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.announcement?.enabled ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcement: { ...settings.announcement, enabled: e.target.checked },
                      })
                    }
                  />
                }
                label="Display announcement banner on top of storefront"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Announcement Banner Text"
                value={settings.announcement?.message || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, message: e.target.value },
                  })
                }
              />
            </Grid>
          </Grid>
        </Paper>

        <Stack direction="row" justifyContent="flex-end" mb={6}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{ px: 5, py: 1.5, borderRadius: 2.5, fontWeight: 700 }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
