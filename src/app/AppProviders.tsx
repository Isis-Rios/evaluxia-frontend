import { Provider } from 'react-redux'
import { StyledEngineProvider, ThemeProvider } from '@mui/material'
import { store, persistor } from './store'
import theme from '../theme'
import { PersistGate } from 'redux-persist/integration/react'
import './../index.css'

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <StyledEngineProvider injectFirst enableCssLayer>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </StyledEngineProvider>
)