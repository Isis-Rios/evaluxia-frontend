// src/pages/UserEvaluatorProfile.tsx
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Button,
  } from '@mui/material'
  import EditIcon from '@mui/icons-material/Edit'
  import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
  import { useTheme } from '@mui/material/styles'
  import { EmojiObjects, Face, Favorite, LocationOn, Work } from '@mui/icons-material';
  import CheckCircleIcon from '@mui/icons-material/CheckCircle'
  import PersonAddIcon from '@mui/icons-material/PersonAdd';
  import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
  import { useNavigate } from 'react-router-dom';
  
// 1. Lista de perfiles evaluadores
const userProfiles = [
  {
    fullName: 'Andrio Richard',
    phrase: 'Estudiante y freelancer',
    age: 29,
    profession: 'UX Designer',
    maritalStatus: 'Soltero',
    city: 'Evergreen Meadows',
    archetype: 'El explorador',
    biography: 'Andrio es un diseñador curioso que siempre está buscando nuevas formas de mejorar la experiencia de usuario.',
    personality: 'Extrovertido, detallista, le gusta probar nuevas tecnologías y analizar el comportamiento del usuario.',
    goals: 'Diseñar interfaces accesibles e inclusivas.',
    frustrations: 'Se frustra cuando los flujos no son intuitivos o tienen demasiados pasos innecesarios.',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    fullName: 'Lucía Martínez',
    phrase: 'Madre y profesora de secundaria',
    age: 45,
    profession: 'Docente de literatura',
    maritalStatus: 'Casada',
    city: 'Medellín',
    archetype: 'La cuidadora',
    biography: 'Lucía dedica su vida a educar y cuidar de los demás. Es empática y siempre piensa en las necesidades de otros.',
    personality: 'Paciente, amable, comprometida con sus alumnos y su familia.',
    goals: 'Fomentar el pensamiento crítico y emocional en sus estudiantes.',
    frustrations: 'Le molesta cuando la tecnología es poco amigable o no accesible para personas mayores.',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    fullName: 'Diego Torres',
    phrase: 'Ingeniero y gamer nocturno',
    age: 34,
    profession: 'Ingeniero en sistemas',
    maritalStatus: 'Soltero',
    city: 'Bogotá',
    archetype: 'El sabio',
    biography: 'Diego es meticuloso, estudioso y siempre está leyendo documentación para mejorar sus habilidades técnicas.',
    personality: 'Introvertido, analítico, reservado pero apasionado por la eficiencia.',
    goals: 'Crear soluciones tecnológicas que mejoren la productividad.',
    frustrations: 'Odia interfaces mal documentadas y lentas.',
    avatarUrl: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    fullName: 'Valentina Ríos',
    phrase: 'Creativa y diseñadora de moda',
    age: 27,
    profession: 'Diseñadora gráfica',
    maritalStatus: 'En una relación',
    city: 'Cali',
    archetype: 'La creadora',
    biography: 'Valentina se inspira en el arte y la cultura pop para crear diseños únicos y con propósito.',
    personality: 'Imaginativa, emocional, intensa y un poco desordenada.',
    goals: 'Diseñar experiencias que conecten con las emociones.',
    frustrations: 'La limita la falta de personalización en las herramientas digitales.',
    avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    fullName: 'Carlos Mendoza',
    phrase: 'Emprendedor social y voluntario',
    age: 38,
    profession: 'Trabajador social',
    maritalStatus: 'Divorciado',
    city: 'Quito',
    archetype: 'El héroe',
    biography: 'Carlos trabaja con comunidades vulnerables y busca crear impacto a través de la tecnología.',
    personality: 'Enérgico, propositivo, resiliente y buen comunicador.',
    goals: 'Implementar soluciones tecnológicas que reduzcan la desigualdad.',
    frustrations: 'Se frustra cuando la tecnología no tiene en cuenta a personas con poca formación digital.',
    avatarUrl: 'https://randomuser.me/api/portraits/men/47.jpg',
  }
]
  
const archetypeTooltips: any = {
  'El explorador': 'Curioso, independiente y con sed de nuevas experiencias. Le teme a la rutina y busca libertad.',
  'La cuidadora': 'Empática y protectora. Su vocación es ayudar a los demás, aunque a veces se olvida de sí misma.',
  'El sabio': 'Analítico y reflexivo. Busca entender el mundo y compartir su conocimiento, aunque puede tardar en decidir.',
  'La creadora': 'Creativa e innovadora. Necesita expresarse y aportar valor con sus ideas únicas.',
  'El héroe': 'Decidido y valiente. Quiere cambiar el mundo ayudando a los demás y teme al fracaso.',
}

  export default function UserEvaluatorProfilesPage() {
    const theme = useTheme()
    const navigate = useNavigate()
  
    return (
      <Box p={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600} >
            Perfiles Evaluadores
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/nuevo-perfil')}
          >
            Nuevo perfil
          </Button>
        </Box>
        
  
        <Grid container spacing={2}>
        {userProfiles.map((user, index) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card elevation={0} sx={{ borderRadius: 2, p: 2, bgcolor: (index == 0) ? '#d995e5' : '#ddd8ff', height: '100%', boxSizing: 'border-box' }}>

              <Box sx={{backgroundColor: '#fff', p: 2, borderRadius: 2, mb: 2}}>
                <Box display="flex" justifyContent="center" position="relative">

                {index == 0 ? (
                  <CheckCircleIcon
                  
                  sx={{
                    fontSize: "3rem",
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    color: theme.palette.success.light,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                  }}
                  />
                  ) : (
                    <Tooltip title="Seleccionar perfil evaluador">
                      <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: theme.palette.primary.light,
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        '&:hover': { backgroundColor: theme.palette.primary.dark },
                      }}
                    >
                      <RadioButtonUncheckedIcon fontSize="large" />
                    </IconButton>
                    </Tooltip>
                    
                  )}
                
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.fullName}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Tooltip title="Editar perfil evaluador">
                    <IconButton
                      size="medium"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        '&:hover': { backgroundColor: theme.palette.primary.dark },
                      }}
                    >
                      <EditIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>
                  
                </Box>
                <Typography variant="h6" align="center" fontWeight={700}>
                  {user.fullName}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
                  {user.phrase}
                </Typography>
              </Box>
              
  
              <CardContent sx={{p: 0, pb: 0}}>
                
              <Box sx={{backgroundColor: '#fff', p: 2, borderRadius: 2, minHeight: '152px'}}>
                <Grid container spacing={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Chip icon={<Face />} label={`Edad: ${user.age}`} />
                  <Chip icon={<Work />} label={`Profesión: ${user.profession}`} />
                  <Chip icon={<Favorite />} label={`Estado civil: ${user.maritalStatus}`} />
                  <Chip icon={<LocationOn />} label={`Ciudad: ${user.city}`} />
                  <Tooltip title={archetypeTooltips[user.archetype] || ''}>
                    <Chip
                      icon={<EmojiObjects />}
                      label={`Arquetipo: ${user.archetype}`}
                      color="secondary"
                      sx={{ cursor: 'help' }}
                    />
                  </Tooltip>
                </Grid>
              </Box>
  
                <Box sx={{borderRadius: 2, mt: 2, mb:-2, overflow: 'hidden', p: 2, backgroundColor: '#fff'}}>
                  <Accordion elevation={0} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight={600}>Biografía</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{user.biography}</Typography>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion elevation={0} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight={600}>Personalidad</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{user.personality}</Typography>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion elevation={0} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight={600}>Objetivos</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{user.goals}</Typography>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion elevation={0} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight={600}>Frustraciones</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{user.frustrations}</Typography>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        </Grid>
      </Box>
    )
  }
  