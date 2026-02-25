// src/layouts/Topbar.tsx
import { AppBar, Toolbar, Typography, Box, Avatar, Button, Tooltip, useTheme } from '@mui/material'
import { useSelector } from 'react-redux'
import type { RootState } from '@app/store'

export default function Topbar() {
  const theme = useTheme()

  const activeProfile = useSelector((state: RootState) => state.auth.user)

  // Generar URL de avatar gratuito (ej: DiceBear estilo 'fun-emoji')
  const avatarUrl = 'https://randomuser.me/api/portraits/men/32.jpg'

  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', color: theme.palette.secondary.main }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Panel de administración
        </Typography>
        <Tooltip title="Perfil evaluador activo">
        <Button
          variant="outlined"
          color="inherit"
          startIcon={
            <Avatar
              alt={activeProfile?.name || 'Perfil'}
              src={avatarUrl}
              sx={{ width: 32, height: 32 }}
            />
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
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
          <Typography variant="body1" fontWeight={600} lineHeight={1.2}>
            {/* {activeProfile?.name || 'Ramiro'} */}
            Andrio Richard
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize={11}>
            Perfil evaluador
          </Typography>
          </Box>
        </Button>

        </Tooltip>
        
      </Toolbar>
    </AppBar>
  )
}
