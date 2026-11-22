import { createTheme } from '@mui/material/styles';

/**
 * Editorial Fashion Design System Theme
 * Inspired by H&M (www2.hm.com) digital storefront design specifications (DESIGN.md)
 * 
 * Strict binary palette: ink (#000000), canvas (#FFFFFF), surface (#E6E6E6), border (#000000), error/accent (#EB0010)
 * Flat rectilinear materiality: zero border-radius across all components, no drop shadows.
 * Typographic system: Editorial serif for campaign display, clean airy sans-serif for interface.
 */
export const createAppTheme = (mode = 'light') => {
  return createTheme({
    palette: {
      mode: 'light', // Strict editorial fashion aesthetic
      primary: {
        main: '#000000',       // ink
        light: '#262626',
        dark: '#000000',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#737373',       // muted-ink
        light: '#a3a3a3',
        dark: '#525252',
        contrastText: '#ffffff',
      },
      surface: {
        main: '#e6e6e6',       // product card background, structural bands
        contrastText: '#000000',
      },
      error: {
        main: '#eb0010',       // brand red accent & critical alerts
        light: '#ff3344',
        dark: '#b3000c',
      },
      warning: {
        main: '#737373',
        light: '#a3a3a3',
        dark: '#525252',
      },
      info: {
        main: '#0000ee',       // traditional hyperlink action color
        light: '#3333ff',
        dark: '#0000b3',
      },
      success: {
        main: '#000000',
        light: '#262626',
        dark: '#000000',
      },
      background: {
        default: '#ffffff',    // canvas
        paper: '#ffffff',
      },
      text: {
        primary: '#000000',    // ink
        secondary: '#737373',  // muted-ink
      },
      divider: '#e6e6e6',
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
      // hero-display: editorial display moments
      h1: {
        fontFamily: "'Playfair Display', 'Hm Sergel Headline', Didot, Georgia, serif",
        fontWeight: 400,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        lineHeight: 1.06,
        letterSpacing: '-0.02em',
      },
      // section-display: category and section page titles in uppercase
      h2: {
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 300,
        fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
        lineHeight: 0.95,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      },
      h3: {
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 400,
        fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
        lineHeight: 1.15,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      },
      h4: {
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 400,
        fontSize: '1.25rem',
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
      },
      h5: {
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.3,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      },
      h6: {
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: 1.3,
        letterSpacing: '0.02em',
      },
      // label: product names, filter pills, button text
      subtitle1: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.21,
        letterSpacing: '0.01em',
      },
      // body-small: prices, metadata, store locator text
      subtitle2: {
        fontSize: '0.8125rem',
        fontWeight: 400,
        lineHeight: 1.3,
        letterSpacing: '0.01em',
      },
      // body: descriptions, general content
      body1: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#000000',
      },
      // body-small
      body2: {
        fontSize: '0.8125rem',
        fontWeight: 400,
        lineHeight: 1.3,
        color: '#737373',
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 300,
        lineHeight: 1.33,
        letterSpacing: '0.02em',
        color: '#737373',
      },
    },
    // Strict flat rectilinear shape language: zero border-radius everywhere
    shape: {
      borderRadius: 0,
    },
    // No drop shadows or elevation effects - flat print-like materiality
    shadows: Array(25).fill('none'),
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#ffffff',
            color: '#000000',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            borderRadius: 0,
            textTransform: 'uppercase',
            fontWeight: 400,
            fontSize: '0.875rem',
            letterSpacing: '0.04em',
            padding: '12px 24px',
            boxShadow: 'none !important',
            transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              boxShadow: 'none !important',
            },
          },
          containedPrimary: {
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '1px solid #000000',
            '&:hover': {
              backgroundColor: '#262626',
              borderColor: '#262626',
            },
            '&.Mui-disabled': {
              backgroundColor: '#e6e6e6',
              color: '#737373',
              borderColor: '#e6e6e6',
            },
          },
          outlinedPrimary: {
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #000000',
            '&:hover': {
              backgroundColor: '#000000',
              color: '#ffffff',
              borderColor: '#000000',
            },
          },
          text: {
            padding: '8px 16px',
            color: '#000000',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 0,
            border: 'none',
            backgroundColor: '#ffffff',
            boxShadow: 'none !important',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: 'none !important',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            fontWeight: 400,
            fontSize: '0.8125rem',
            letterSpacing: '0.02em',
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
            color: '#000000',
            '&.MuiChip-clickable:hover': {
              backgroundColor: '#000000',
              color: '#ffffff',
            },
          },
          filled: {
            backgroundColor: '#000000',
            color: '#ffffff',
          },
          outlined: {
            borderColor: '#000000',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#000000',
                borderWidth: 1,
              },
              '&:hover fieldset': {
                borderColor: '#000000',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000000',
                borderWidth: 1.5,
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            '& fieldset': {
              borderColor: '#000000',
            },
            '&:hover fieldset': {
              borderColor: '#000000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
            },
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: 'none !important',
            borderBottom: '1px solid #e6e6e6',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: '#e6e6e6',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            border: '1px solid #000000',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            padding: '10px 16px',
            '&:hover': {
              backgroundColor: '#e6e6e6',
            },
          },
        },
      },
    },
  });
};
