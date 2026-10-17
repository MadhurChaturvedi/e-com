import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import Chip from '@mui/material/Chip';

const DEFAULT_ZOOM = 0.75;
const MIN_ZOOM = 0.50;
const MAX_ZOOM = 1.25;
const STEP = 0.05;

export const ZoomController = () => {
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('novastore_zoom');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
        return parsed;
      }
    }
    return DEFAULT_ZOOM;
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Apply zoom on html element
    document.documentElement.style.zoom = zoom.toString();
    localStorage.setItem('novastore_zoom', zoom.toString());
  }, [zoom]);

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, parseFloat((prev - STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, parseFloat((prev + STEP).toFixed(2))));
  };

  const handleReset = () => {
    setZoom(DEFAULT_ZOOM);
  };

  const handleSetPreset = (presetValue) => {
    setZoom(presetValue);
  };

  const percentDisplay = `${Math.round(zoom * 100)}%`;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          px: 1.2,
          py: 0.6,
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Tooltip title={expanded ? 'Minimize zoom controls' : 'Adjust page zoom / scale'}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: '#a5b4fc',
              p: '4px',
              '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <AspectRatioIcon sx={{ fontSize: '1.05rem' }} />
          </IconButton>
        </Tooltip>

        {/* Zoom Out Button */}
        <Tooltip title="Zoom out more (-5%)">
          <span>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              sx={{
                color: '#ffffff',
                p: '4px',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              <ZoomOutIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Percentage Badge */}
        <Typography
          variant="caption"
          onClick={() => setExpanded(!expanded)}
          sx={{
            fontWeight: 800,
            fontSize: '0.78rem',
            color: '#f8fafc',
            minWidth: 42,
            textAlign: 'center',
            letterSpacing: '0.02em',
            fontFamily: 'monospace',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {percentDisplay}
        </Typography>

        {/* Zoom In Button */}
        <Tooltip title="Zoom in (+5%)">
          <span>
            <IconButton
              size="small"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              sx={{
                color: '#ffffff',
                p: '4px',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              <ZoomInIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Extended Preset Options when Expanded */}
        {expanded && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5, pl: 0.8, borderLeft: '1px solid rgba(255, 255, 255, 0.15)' }}>
            {[0.65, 0.70, 0.75, 0.85, 1.0].map((val) => (
              <Chip
                key={val}
                label={`${Math.round(val * 100)}%`}
                size="small"
                onClick={() => handleSetPreset(val)}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: Math.abs(zoom - val) < 0.01 ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: Math.abs(zoom - val) < 0.01 ? '#4338ca' : 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
            ))}

            <Tooltip title="Reset to default (75%)">
              <IconButton
                size="small"
                onClick={handleReset}
                sx={{
                  color: '#94a3b8',
                  p: '3px',
                  '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                }}
              >
                <RestartAltIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ZoomController;
