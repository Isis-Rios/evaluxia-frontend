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
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '@app/store'

/**
 * Topbar — Barra superior de la aplicación.
 *
 * Lee el perfil evaluador activo directamente desde Redux (evaluatorProfiles.activeProfile),
 * que se actualiza cada vez que useEvaluatorProfiles carga perfiles o activa uno.
 * Sin fetches propios — reactivo y sin duplicidad (DRY, SRP).
 */
export default function Topbar() {
  const theme = useTheme()
  const navigate = useNavigate()

  // Fuente única de verdad: Redux store
  const activeProfile = useSelector((state: RootState) => state.evaluatorProfiles.activeProfile)

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
                startIcon={
                  activeProfile === undefined ? (
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
                      {initial}
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
                    {activeProfile?.fullName ?? 'Sin perfil activo'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={10} lineHeight={1}>
                    {activeProfile ? activeProfile.archetype : 'Selecciona un perfil aquí'}
                  </Typography>
                </Box>
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
