// src/pages/Login/LoginPage.tsx
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import logo from '@assets/images/logo.png'
import loginIllustration from '@assets/images/login-ilustracion.png'

import { loginSuccess } from '@features/auth/authSlice'



export default function LoginPage() {
  const { register, handleSubmit } = useForm()
  const theme = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  

  const onSubmit = (data: any) => {
    console.log('Login data:', data)

    // Simulación de login exitoso
    const fakeUser = {
      id: '123',
      name: 'Isis Ríos',
      email: data.email,
      tenant: 'evaluxia',
    }

    const fakeToken = 'fake-jwt-token'

    dispatch(loginSuccess({ user: fakeUser, token: fakeToken }))
    navigate('/historial')
  }

  return (
    <Box
      sx={{
        height: { md: '100vh', xs: '100%'},
        backgroundColor: '#f6f7f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { md: 5, xs: 2},
        boxSizing: 'border-box', 
        minHeight: '100vh'
      }}
    >
      <Paper
        elevation={2}
        sx={{
          borderRadius: {md: 2, xs: 1},
          width: '100%',
          overflow: 'hidden',
          height: 'auto',
          //maxHeight: { md: 'calc(100vh - 80px)', xs: 'initial'},
          boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
          
        }}
      >
        <Grid container sx={{display: 'flex', height: '100%', flexDirection: { md: 'row', xs: 'column-reverse'},}}>
          {/* Columna izquierda (formulario) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ padding: { md: 8, xs: 2}, height: '100%', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              {/* <img src={logo} alt="Logo Evaluxia" sx={{width: {md: '260px', xs: '200'}} /> */}
              <Box component="img"
                src={logo}
                alt="Logo Evaluxia"
                sx={{ width: { md: '260px', xs: '200px'}, mb: 3, mt: {md: 0, xs: 1} }}
              ></Box>
            </Box>
            
            <Box>
              <Typography variant="h5" sx={{fontWeight:700, mb: {md: 2, xs: 1}, textAlign:"left", color:theme.palette.secondary.main}}>
                Inicia sesión
              </Typography>
              <Typography variant="body1" sx={{mb: {md: 4, xs: 3}, color:theme.palette.info.main, fontWeight: 600}}>
                Bienvenido de nuevo 👋
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <TextField
                  {...register('email')}
                  label="Correo electrónico"
                  variant="outlined"
                  fullWidth
                />
                <TextField
                  {...register('password')}
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Ingresar
                </Button>
              </Box>
              <Typography variant="body2" sx={{mt: {md: 3, xs: 2}, textAlign:"center", color:theme.palette.secondary.main}}>
              ¿Olvidaste tu contraseña?{' '}
              <Box
                component="a"
                href="#"
                sx={{ color: theme.palette.info.main, fontWeight: 600, textDecoration: 'underline' }}
              >
                Recupérala
              </Box>
            </Typography>
            </Box>

            <Box textAlign="center" sx={{mt: {md: 3, xs: 4}}}>
              <Typography variant="body2" color={theme.palette.secondary.main}>
                ¿No tienes una cuenta?
              </Typography>
              <Button
                type="button"
                variant="contained"
                size="large"
                sx={{
                  marginTop: 2,
                  width: '100%',
                  bgcolor: theme.palette.secondary.light,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark,
                  },
                }}
              >
                Regístrate
              </Button>
            </Box>

            
            </Box>
          </Grid>

          {/* Columna derecha (ilustración o branding) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                height: '100%',
                padding: { md: 8, xs: 2},
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: { md: 'column', xs: 'row'},
                boxSizing: 'border-box',
                flexWrap: 'wrap'
              }}
            >
              <Typography variant="h3" sx={{fontWeight:600, color:'#fff', textAlign: { md: 'center', xs: 'left'}, fontSize: { md: '3rem', xs: '1.5rem'}, width: { md: '100%', xs: '55%'} }} gutterBottom >
                Evalúa, mejora y crece
              </Typography>
              <Typography variant="body1" sx={{fontWeight:600, color:'#fff', textAlign: { md: 'center', xs: 'left'},width: { md: '100%', xs: '50%'} }} textAlign="center">
                Herramienta inteligente para validar interfaces y experiencias digitales.
              </Typography>
              
              <Box component="img"
                src={loginIllustration}
                alt="Ilustración"
                sx={{ maxWidth: { md: '500px', xs: '50%'}, height: 'auto', mt: {md: 5, xs: -4} }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
