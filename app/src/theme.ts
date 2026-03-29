import { alpha, createTheme } from '@mui/material/styles';

const insynergyBlue = '#1F4AA8';
const insynergyBlueDark = '#163A85';
const insynergyBlueLight = '#5D86DA';
const insynergyOrange = '#FF8A3D';
const insynergyOrangeLight = '#FFB37E';
const insynergyBackground = '#F4F7FD';
const insynergySurface = '#FFFFFF';
const insynergySuccess = '#2EAF62';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: insynergyBlue,
      light: insynergyBlueLight,
      dark: insynergyBlueDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: insynergyOrange,
      light: insynergyOrangeLight,
      dark: '#E16F1E',
      contrastText: '#ffffff',
    },
    background: {
      default: insynergyBackground,
      paper: insynergySurface,
    },
    success: {
      main: insynergySuccess,
    },
    warning: {
      main: insynergyOrange,
    },
    text: {
      primary: '#16305F',
      secondary: '#5F6F94',
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-0.04em',
      color: '#16305F',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
      color: '#16305F',
    },
    h3: {
      fontWeight: 700,
      color: '#16305F',
    },
    h4: {
      fontWeight: 700,
      color: '#16305F',
    },
    h5: {
      fontWeight: 700,
      color: '#16305F',
    },
    h6: {
      fontWeight: 700,
      color: '#16305F',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, rgba(93,134,218,0.16) 0%, rgba(244,247,253,1) 22%, rgba(244,247,253,1) 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: `0 24px 80px ${alpha(insynergyBlueDark, 0.10)}`,
          backgroundImage: 'none',
          borderColor: alpha(insynergyBlue, 0.12),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
          minHeight: 48,
        },
        containedPrimary: {
          boxShadow: `0 12px 28px ${alpha(insynergyBlue, 0.28)}`,
        },
        containedSecondary: {
          boxShadow: `0 12px 28px ${alpha(insynergyOrange, 0.30)}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: alpha('#ffffff', 0.96),
        },
      },
    },
  },
});
