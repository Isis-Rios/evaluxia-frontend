import {
    Box,
    Grid,
    TextField,
    Typography,
    Button,
    InputAdornment,
    IconButton,
    Card,
    CardContent,
    Tooltip
  } from '@mui/material';
  import { useForm, Controller } from 'react-hook-form';
  import { yupResolver } from '@hookform/resolvers/yup';
  import * as Yup from 'yup';
  import UploadIcon from '@mui/icons-material/Upload';
  import Visibility from '@mui/icons-material/Visibility';
  import VisibilityOff from '@mui/icons-material/VisibilityOff';
  import { useState } from 'react';
  
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Nombre requerido'),
    url: Yup.string().url('URL inválida').when('type', {
      is: (val: string) => val === 'web' || val === 'flow',
      then: (schema) => schema.required('URL requerida')
    }),
    username: Yup.string().when('type', {
      is: (val: string) => val === 'web' || val === 'flow',
      then: (schema) => schema
    }),
    password: Yup.string().when('type', {
      is: (val: string) => val === 'web' || val === 'flow',
      then: (schema) => schema
    }),
    description: Yup.string().required('Descripción requerida'),
    type: Yup.string().required('web'),
  });
  
  interface EvaluationFormProps {
    type: 'web' | 'prototype' | 'flow';
    onSubmit: (data: any) => void;
  }
  
  export default function EvaluationForm({ type, onSubmit }: EvaluationFormProps) {
    const [showPassword, setShowPassword] = useState(false);
  
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        name: '',
        url: '',
        username: '',
        password: '',
        description: '',
        type: type
      }
    });
  
    const handleFileUpload = (event: any) => {
      const files = event.target.files;
      if (files.length > 0) {
        console.log('Archivos seleccionados:', files);
      }
    };
  
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {type === 'web' && 'Evaluar Sitio Web'}
              {type === 'prototype' && 'Evaluar Prototipo'}
              {type === 'flow' && 'Ejecutar Flujo'}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Nombre de la evaluación"
                      {...field}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
  
              {(type === 'web' || type === 'flow') && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="url"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="URL del sitio"
                        {...field}
                        error={!!errors.url}
                        helperText={errors.url?.message}
                      />
                    )}
                  />
                </Grid>
              )}
  
              {(type === 'web' || type === 'flow') && (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label="Usuario"
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label="Contraseña"
                          type={showPassword ? 'text' : 'password'}
                          {...field}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}
  
              {type === 'prototype' && (
                <Grid size={{ xs: 12 }}>
                  <Tooltip title="Adjunta tus pantallas del prototipo">
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                    >
                      Adjuntar Imágenes
                      <input type="file" hidden multiple accept="image/*" onChange={handleFileUpload} />
                    </Button>
                  </Tooltip>
                </Grid>
              )}
  
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Describe el propósito de la evaluación"
                      {...field}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
  
            <Box textAlign="right" mt={3}>
              <Button type="submit" variant="contained">
                Enviar al agente
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    );
  }
  