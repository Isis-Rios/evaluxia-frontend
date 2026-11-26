// src/layouts/Sidebar.tsx
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Avatar,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material'
import {
  Home,
  Menu,
  Close,
  ArrowForward,
  Logout,
  RecentActors,
  Web,
  AccountTree,
  CropOriginal,
  WorkHistory
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import logo from '@assets/images/logo-white.png'
import type { RootState } from '@app/store'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '@features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

const drawerWidth = 240

export default function Sidebar() {
  const activeProfile = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const theme = useTheme()
  const isCompactViewport = useMediaQuery(theme.breakpoints.down('lg'))
  const [open, setOpen] = useState(!isCompactViewport)
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(!isCompactViewport)
  }, [isCompactViewport])

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 64,
          transition: 'width 0.1s',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.secondary.dark,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Box>
        <Box sx={{ display: 'flex', justifyContent: open ? 'space-between' : 'center', alignItems: 'center', p: 2, mt: 2 }}>
            {open && (
              <Box
                component="img"
                src={logo}
                alt="Logo Evaluxia"
                sx={{ width: { md: '180px', xs: '120px' } }}
              />
            )}
            {/* Botón de colapsar */}

            <IconButton
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Contraer menú lateral' : 'Expandir menú lateral'}
              sx={{ color: theme.palette.primary.main }}
            >
              {open ? <Close /> : <Menu />}
            </IconButton>
          </Box>
        

        <Box>
          {/* Usuario */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              mb: 2,
              mt: 2,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: theme.palette.primary.main,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ backgroundColor: theme.palette.info.main, width: 30, height: 30 }}>{activeProfile?.name?.charAt(0)}</Avatar>
              {open && (
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ color: '#fff', marginLeft: 3, fontWeight: 700 }}
                >
                  {activeProfile?.name}
                </Typography>
              )}
            </Box>
            {open && (
              <IconButton aria-label="Perfil" sx={{ color: theme.palette.primary.main }}>
                <ArrowForward />
              </IconButton>
            )}
          </Box>

          {/* Menú */}
          <List sx={{ color: '#fff' }}>
            {[{ icon: <Home />, label: 'Inicio', path: '/inicio' },
              { icon: <RecentActors />, label: 'Perfiles evaluadores', path: '/perfiles' },
              { icon: <Web />, label: 'Evaluar sitio web', path: '/evaluate/web' },
              { icon: <CropOriginal />, label: 'Evaluar prototipo', path: '/evaluate/prototype' },
              { icon: <AccountTree />, label: 'Evaluar flujo', path: '/evaluate/flow' },
              { icon: <WorkHistory />, label: 'Historial', path: '/historial' }
            ].map((item, index) => (
              <Tooltip key={index} title={!open ? item.label : ''} placement="right">
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                  {open && <ListItemText primary={item.label} />}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: theme.palette.primary.main,
            mb: 4
          }}
        >
          <List sx={{ color: theme.palette.primary.main }}>
            <ListItemButton onClick={() => {
              dispatch(logout())
              navigate('/login')
            }}>
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <Logout />
              </ListItemIcon>
              {open ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <ListItemText primary="Cerrar sesión" />
                  <ListItemIcon sx={{ minWidth: 32, color: theme.palette.primary.main }}>
                    <ArrowForward />
                  </ListItemIcon>
                </Box>
              ) : null}
            </ListItemButton>
          </List>
        </Box>
      </Box>
    </Drawer>
  )
}
