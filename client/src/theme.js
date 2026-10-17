import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#0f172a',       // Deep Obsidian Slate
        light: '#1e293b',
        dark: '#020617',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#4f46e5',       // Royal Electric Indigo
        light: '#6366f1',
        dark: '#4338ca',
        contrastText: '#ffffff',
      },
      accent: {
        main: '#06b6d4',
        rose: '#f43f5e',
        emerald: '#10b981',
        amber: '#f59e0b',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      background: {
        default: isDark ? '#0b0f19' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      h1: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        letterSpacing: '-0.035em',
        lineHeight: 1.15,
      },
      h2: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.2,
      },
      h3: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.25,
      },
      h4: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.3,
      },
      h5: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.55,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
      caption: {
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      '0 2px 4px -1px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
      '0 20px 25px -5px rgba(15, 23, 42, 0.07), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      '0 25px 50px -12px rgba(15, 23, 42, 0.16)',
      ...Array(18).fill('none'),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            padding: '9px 20px',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          containedPrimary: {
            backgroundColor: '#0f172a',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1e293b',
            },
          },
          containedSecondary: {
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#4338ca',
            },
          },
          outlined: {
            borderColor: 'rgba(226, 232, 240, 0.9)',
            '&:hover': {
              borderColor: '#0f172a',
              backgroundColor: 'rgba(15, 23, 42, 0.03)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 2px 10px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.9)',
              },
              '&:hover fieldset': {
                borderColor: '#4f46e5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4f46e5',
                borderWidth: 1.5,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 14,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: isDark ? '#f8fafc' : '#0f172a',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
    },
  });
};

