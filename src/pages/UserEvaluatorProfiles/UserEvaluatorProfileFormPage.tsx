import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    MenuItem,
    Avatar,
    IconButton,
    InputLabel,
    Select,
    FormControl
  } from '@mui/material'
  import { useForm, Controller } from 'react-hook-form'
  import { yupResolver } from '@hookform/resolvers/yup'
  import * as Yup from 'yup'
  import { useTheme } from '@mui/material/styles'
  import UploadIcon from '@mui/icons-material/Upload'
  import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
  import SaveAsIcon from '@mui/icons-material/SaveAs'

  
  const civilStatusOptions = [
    'Soltero',
    'Casado',
    'Conviviente',
    'Divorciado',
    'Separado',
    'Viudo'
  ]
  
  const archetypes = [
    { name: 'El gobernante', description: 'Necesita tener el control de la situación, y ser el que tome las decisiones por el bien común.' },
    { name: 'El inocente', description: 'Despreocupado, soñador y con visión positiva. Busca un final feliz y teme al castigo.' },
    { name: 'El creador', description: 'Imaginativo y original. Necesita aportar valor con ideas propias.' },
    { name: 'El explorador', description: 'Independiente y curioso. Odia la rutina y busca experiencias nuevas.' },
    { name: 'El sabio', description: 'Busca el conocimiento y respuestas profundas. Reflexivo y analítico.' },
    { name: 'El héroe', description: 'Valiente y fuerte. Su propósito es ayudar a otros superando obstáculos.' },
    { name: 'El mago', description: 'Transformador y perceptivo. Ve más allá de lo evidente.' },
    { name: 'El bufón', description: 'Divertido y positivo. Busca hacer felices a los demás con humor.' },
    { name: 'El rebelde', description: 'Rompe reglas para generar cambios. Audaz e inspirador.' },
    { name: 'El amigo', description: 'Leal, sincero y siempre dispuesto a ayudar.' },
    { name: 'El amante', description: 'Busca armonía y afecto. Teme al rechazo y el conflicto.' },
    { name: 'El cuidador', description: 'Empático y entregado. Se sacrifica por el bienestar de los demás.' }
  ]
  
  type FormValues = {
    fullName: string
    phrase: string
    age: number
    profession: string
    maritalStatus: string
    country: string
    city: string
    archetype: string
    biography: string
    personality: string
    goals: string
    frustrations: string
  }
  
  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required('Requerido'),
    phrase: Yup.string().required('Requerido'),
    age: Yup.number().required('Requerido').min(1),
    profession: Yup.string().required('Requerido'),
    maritalStatus: Yup.string().required('Requerido'),
    country: Yup.string().required('Requerido'),
    city: Yup.string().required('Requerido'),
    archetype: Yup.string().required('Requerido'),
    biography: Yup.string().required('Requerido'),
    personality: Yup.string().required('Requerido'),
    goals: Yup.string().required('Requerido'),
    frustrations: Yup.string().required('Requerido')
  })
  
  export default function UserEvaluatorProfileFormPage() {
    const theme = useTheme()
    const {
      control,
      handleSubmit,
      formState: { errors }
    } = useForm<FormValues>({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        fullName: '',
        phrase: '',
        age: 0,
        profession: '',
        maritalStatus: '',
        country: '',
        city: '',
        archetype: '',
        biography: '',
        personality: '',
        goals: '',
        frustrations: ''
      }
    })

    const longTextFields: { name: keyof FormValues; label: string }[] = [
        { name: 'biography', label: 'Biografía' },
        { name: 'personality', label: 'Personalidad' },
        { name: 'goals', label: 'Objetivos' },
        { name: 'frustrations', label: 'Frustraciones' }
    ]/* string[] = [
    'biography',
    'personality',
    'goals',
    'frustrations'
    ] */
  
    const onSubmit = (data: any) => {
      console.log(data)
    }
  
    return (
      <Box p={0}>
        <Typography variant="h5" fontWeight={600} mb={3}>Agregar o editar perfil evaluador</Typography>
  
        <Card elevation={0} sx={{ borderRadius: 2, bgcolor: '#ddd8ff' }}>
          <CardContent sx={{pb: 2}}>
            <Box sx={{backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2}}>
              <Typography variant="h6" sx={{fontWeight: 600, pb: 2, pl: '14px' }}>
                Información principal del evaluador
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 3}} sx={{display: 'flex', justifyContent: 'center'}}>
                  <Box position="relative" width={100} height={100}>
                    <Avatar sx={{ width: 100, height: 100 }} />
                    <IconButton
                      sx={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.palette.primary.main, color: '#fff' }}
                      component="label"
                    >
                      <UploadIcon />
                      <input type="file" hidden />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 9}}>
                  <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Nombre y Apellido"
                        error={!!errors.fullName}
                        helperText={errors.fullName?.message}
                        {...field}
                      />
                    )}
                  />
                  <Controller
                    name="phrase"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Frase que describe al usuario"
                        sx={{ mt: 2 }}
                        error={!!errors.phrase}
                        helperText={errors.phrase?.message}
                        {...field}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
  
            <Box sx={{backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2}}>
              <Typography variant="h6" sx={{fontWeight: 600, pb: 2 , pl: '14px'}}>
                Detalles del evaluador
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4}}>
                  <Controller
                    name="age"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Edad"
                        type="number"
                        error={!!errors.age}
                        helperText={errors.age?.message}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4}}>
                  <Controller
                    name="profession"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Profesión"
                        error={!!errors.profession}
                        helperText={errors.profession?.message}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4}}>
                  <Controller
                    name="maritalStatus"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.maritalStatus}>
                        <InputLabel>Estado civil</InputLabel>
                        <Select label="Estado civil" {...field}>
                          {civilStatusOptions.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="País"
                        error={!!errors.country}
                        helperText={errors.country?.message}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Ciudad"
                        error={!!errors.city}
                        helperText={errors.city?.message}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="archetype"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.archetype}>
                        <InputLabel>Arquetipo</InputLabel>
                        <Select label="Arquetipo" {...field}>
                          {archetypes.map(arche => (
                            <MenuItem key={arche.name} value={arche.name}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <EmojiObjectsIcon fontSize="small" /> {arche.name +': '+arche.description}
                                </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
  
            <Box sx={{backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2}}>
              <Typography variant="h6" sx={{fontWeight: 600, pb: 2 , pl: '14px'}}>
                Descripción del perfil evaluador
              </Typography>
              <Grid container spacing={2}>
                
                {longTextFields.map(({ name, label }) => (
                    <Grid size={{ xs: 12, md: 6}}  key={name}>
                    <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                        <TextField
                            fullWidth
                            multiline
                            minRows={5}
                            label={label}
                            error={!!errors[name]}
                            helperText={errors[name]?.message}
                            {...field}
                        />
                        )}
                    />
                    </Grid>
                ))}
              </Grid>
            </Box>
  
            <Box textAlign="right" mt={3}>
              <Button variant="contained" startIcon={<SaveAsIcon />} onClick={handleSubmit(onSubmit)}>
                Guardar perfil
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }
  