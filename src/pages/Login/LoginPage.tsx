// src/pages/Login/LoginPage.tsx
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@hooks/useAuth'
import logo from '@assets/images/logo.png'
import loginIllustration from '@assets/images/login-ilustracion.png'
import type { LoginRequest } from '@/types/auth.types'

// ─── Esquema de validación (yup ya estaba en el proyecto) ─────────────────

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Ingresa un correo electrónico válido')
    .required('El correo es obligatorio'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es obligatoria'),
})

// ─── Componente ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth()

  // Si ya hay sesión activa, redirigir directamente
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/inicio', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginRequest) => {
    clearError()
    await login(data)
  }

  return (
    <Box
      sx={{
        height: { md: '100vh', xs: '100%' },
        backgroundColor: '#f6f7f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { md: 5, xs: 2 },
        boxSizing: 'border-box',
        minHeight: '100vh',
      }}
    >
      <Paper
        elevation={2}
        sx={{
          borderRadius: { md: 2, xs: 1 },
          width: '100%',
          overflow: 'hidden',
          height: 'auto',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <Grid
          container
          sx={{
            display: 'flex',
            height: '100%',
            flexDirection: { md: 'row', xs: 'column-reverse' },
          }}
        >
          {/* ── Columna izquierda: formulario ──────────────────────── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                padding: { md: 8, xs: 2 },
                height: '100%',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
                boxSizing: 'border-box',
              }}
            >
              {/* Logo */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={logo}
                  alt="Logo Evaluxia"
                  sx={{ width: { md: '260px', xs: '200px' }, mb: 3, mt: { md: 0, xs: 1 } }}
                />
              </Box>

              {/* Formulario */}
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                display="flex"
                flexDirection="column"
                height="100%"
                justifyContent="space-between"
              >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: { md: 2, xs: 1 },
                    textAlign: 'left',
                    color: theme.palette.secondary.main,
                  }}
                >
                  Inicia sesión
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mb: { md: 4, xs: 3 }, color: theme.palette.info.main, fontWeight: 600 }}
                >
                  Bienvenido de nuevo 👋
                </Typography>

              
                <Box
                  
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <TextField
                    {...register('email')}
                    id="login-email"
                    label="Correo electrónico"
                    type="email"
                    variant="outlined"
                    fullWidth
                    autoComplete="email"
                    disabled={isLoading}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                  <TextField
                    {...register('password')}
                    id="login-password"
                    label="Contraseña"
                    type="password"
                    variant="outlined"
                    fullWidth
                    autoComplete="current-password"
                    disabled={isLoading}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />

                  
                </Box>

                

                {/* Se implementará más adelante
                <Typography
                  variant="body2"
                  sx={{ mt: { md: 3, xs: 2 }, textAlign: 'center', color: theme.palette.secondary.main }}
                >
                  ¿Olvidaste tu contraseña?{' '}
                  <Box
                    component="a"
                    href="#"
                    sx={{ color: theme.palette.info.main, fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Recupérala
                  </Box>
                </Typography> */}
              </Box>

              <Box>
                {/* Alerta de error de autenticación */}
                  {error && (
                    <Alert
                      severity="error"
                      onClose={clearError}
                      sx={{ mb: 1 }}
                      id="login-error-alert"
                    >
                      {error}
                    </Alert>
                  )}

                  <Button
                    id="login-submit-btn"
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : null
                    }
                    sx={{
                      mt: 2,
                      bgcolor: theme.palette.primary.main,
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                      '&.Mui-disabled': { opacity: 0.7 },
                    }}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
                  </Button>
              </Box>

                  

              {/* Se implementará más adelante
              <Box textAlign="center" sx={{ mt: { md: 3, xs: 4 } }}>
                <Typography variant="body2" color={theme.palette.secondary.main}>
                  ¿No tienes una cuenta?
                </Typography>
                <Button
                  type="button"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    marginTop: 2,
                    width: '100%',
                    bgcolor: theme.palette.secondary.light,
                    '&:hover': { bgcolor: theme.palette.secondary.dark },
                  }}
                >
                  Regístrate
                </Button>
              </Box> */}
              </Box>
            </Box>
          </Grid>

          {/* ── Columna derecha: branding ──────────────────────────── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                height: '100%',
                padding: { md: 8, xs: 2 },
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: { md: 'column', xs: 'row' },
                boxSizing: 'border-box',
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  textAlign: { md: 'center', xs: 'left' },
                  fontSize: { md: '3rem', xs: '1.5rem' },
                  width: { md: '100%', xs: '55%' },
                }}
                gutterBottom
              >
                Evalúa, mejora y crece
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  textAlign: { md: 'center', xs: 'left' },
                  width: { md: '100%', xs: '50%' },
                }}
              >
                Herramienta inteligente para validar interfaces y experiencias digitales.
              </Typography>
              <Box
                component="img"
                src={loginIllustration}
                alt="Ilustración"
                sx={{ maxWidth: { md: '500px', xs: '50%' }, height: 'auto', mt: { md: 5, xs: -4 } }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
