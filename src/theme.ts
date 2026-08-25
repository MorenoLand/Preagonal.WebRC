import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#63c58b' },
    secondary: { main: '#ffe27b' },
    background: { default: '#0e1016', paper: '#171a22' },
    text: { primary: '#f7f5f1', secondary: '#a7adb9' },
    divider: 'rgba(255,255,255,0.1)'
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    caption: { fontSize: '0.7rem', letterSpacing: '0.04em' }
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiTooltip: { defaultProps: { arrow: true } }
  }
});
