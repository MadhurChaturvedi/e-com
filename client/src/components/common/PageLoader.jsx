import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export const PageLoader = ({ message = 'Loading NovaStore...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        py: 8,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          mb: 2.5,
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          size={52}
          thickness={4}
          sx={{ color: 'rgba(79, 70, 229, 0.12)' }}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          size={52}
          thickness={4}
          sx={{
            color: 'primary.main',
            animationDuration: '850ms',
            position: 'absolute',
            left: 0,
            [`& .MuiCircularProgress-circle`]: {
              strokeLinecap: 'round',
            },
          }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.78rem',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default PageLoader;
