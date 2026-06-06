// src/layouts/Topbar.tsx
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '@hooks/useAuth'

/**
 * Topbar — Barra superior de la aplicación.
 *
 * Muestra el nombre real del usuario autenticado (desde el store via useAuth)
 * y expone el botón de logout que limpia la sesión y redirige a /login.
 */
export default function Topbar() {
  const theme = useTheme()
  const { user, logout, isLoading } = useAuth()

  // Inicial del nombre para el avatar generado localmente
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?'

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ backgroundColor: '#fff', color: theme.palette.secondary.main }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Panel de administración
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Chip con datos del usuario autenticado */}
          <Tooltip title={user?.email ?? 'Usuario'}>
            <Button
              id="topbar-user-menu"
              variant="outlined"
              color="inherit"
              startIcon={
                <Avatar
                  alt={user?.name ?? 'Usuario'}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {userInitial}
                </Avatar>
              }
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body1" fontWeight={600} lineHeight={1.2}>
                  {user?.name ?? 'Usuario'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize={11}>
                  {user?.role ?? 'evaluator'}
                </Typography>
              </Box>
            </Button>
          </Tooltip>

          {/* Botón de logout */}
          <Tooltip title="Cerrar sesión">
            <span>
              <IconButton
                id="topbar-logout-btn"
                onClick={logout}
                disabled={isLoading}
                color="inherit"
                aria-label="Cerrar sesión"
                sx={{
                  border: `1px solid ${theme.palette.secondary.main}`,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LogoutIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
