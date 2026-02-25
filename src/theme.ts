import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6a57e3',
      light: '#ddd8ff',
      dark: '#7f6fe7'
    },
    secondary: {
      main: '#222834', 
      light: '#3b3f4a'
    },
    info: {
      main: '#cd74dd',
      light: '#d995e5'
    },
    background: {
      default: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Quicksand, sans-serif',
  },
  shape: {
    borderRadius: 24, // Equivalente a tailwind's `xl`
  },
  spacing: 8, // 1 unidad = 8px (lg = 2rem = 32px aprox)
});

export default theme;


