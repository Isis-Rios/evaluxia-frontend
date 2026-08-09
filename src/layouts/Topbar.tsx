// src/layouts/Topbar.tsx
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'

/**
 * Topbar — Barra superior de la aplicación.
 *
 * Muestra el perfil evaluador activo (no el usuario autenticado).
 * Al hacer click navega a /perfiles para cambiar el perfil.
 * El logout está en el Sidebar.
 */
export default function Topbar() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { profiles, isLoading, fetchProfiles } = useEvaluatorProfiles()

  // Cargar perfiles para encontrar el activo
  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const activeProfile = profiles.find((p) => p.isActive) ?? null
  const initial = activeProfile?.fullName?.charAt(0).toUpperCase() ?? '?'

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
          {/* Chip del perfil evaluador activo */}
          <Tooltip title={activeProfile ? 'Ir a perfiles evaluadores' : 'No hay perfil activo'}>
            <span>
              <Button
                id="topbar-active-profile"
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/perfiles')}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    <Avatar
                      alt={activeProfile?.fullName ?? 'Sin perfil'}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: activeProfile
                          ? theme.palette.success.light
                          : theme.palette.action.disabled,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {isLoading ? null : initial}
                    </Avatar>
                  )
                }
                sx={{
                  textTransform: 'none',
                  borderColor: activeProfile
                    ? theme.palette.success.light
                    : theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {activeProfile && (
                    <Typography
                      sx={{
                        fontSize: '8px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: theme.palette.success.light,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      Evaluador activo
                    </Typography>
                  )}
                  <Typography variant="body1" fontWeight={600} lineHeight={1.2}>
                    {isLoading
                      ? 'Cargando...'
                      : activeProfile?.fullName ?? 'Sin perfil activo'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={10} lineHeight={1}>
                    {activeProfile ? activeProfile.archetype : 'Selecciona un perfil'}
                  </Typography>
                </Box>
              </Button>
            </span>
          </Tooltip>

          {/* Acceso rápido a perfiles si no hay ninguno activo */}
          {!isLoading && !activeProfile && (
            <Tooltip title="Seleccionar perfil evaluador">
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<PersonSearchIcon />}
                onClick={() => navigate('/perfiles')}
                sx={{ textTransform: 'none' }}
              >
                Seleccionar
              </Button>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
