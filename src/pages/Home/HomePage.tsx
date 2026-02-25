import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    useTheme,
    Avatar
  } from '@mui/material'
  import {  Web, CropOriginal, AccountTree, ArrowForward } from '@mui/icons-material'
  import { useState } from 'react'
  import AgentPanel from '@components/AgentPanel'
  import { useNavigate } from 'react-router-dom'
  
  export default function HomePage() {
    const theme = useTheme()
    const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string }[]>([]);
    const navigate = useNavigate()
  
    const handleSend = (text: string) => {
      // Aquí se manejaría el envío del mensaje al agente
      console.log('Mensaje enviado al agente:', messages)
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      // Aquí podrías simular una respuesta del agente si quieres
      setMessages((prev) => [...prev, { role: 'agent', content: 'Estoy procesando tu mensaje...' }]);
    }
  
    const cardOptions = [
      {
        icon: <Web sx={{fontSize: messages.length == 0 ? 36 : 20,  }}/>,
        title: 'Evaluar sitio web',
        description: 'Permite al agente navegar por un sitio web, analizar accesibilidad y experiencia de usuario, y generar un informe.',
        action: () => navigate('/evaluate/web')
      },
      {
        icon: <CropOriginal sx={{fontSize: messages.length == 0 ? 36 : 20, }}/>,
        title: 'Evaluar prototipo',
        description: 'Sube tus diseños y prototipos para que el agente los evalúe desde una perspectiva UX y accesibilidad.',
        action: () => navigate('/evaluate/prototype')
      },
      {
        icon: <AccountTree sx={{fontSize: messages.length == 0 ? 36 : 20, }}/>,
        title: 'Ejecutar flujo',
        description: 'El agente simula una interacción completa basada en tu descripción y valida funcionalidades end to end.',
        action: () => navigate('/evaluate/flow')
      }
    ]
  
    return (
      <Box sx={{ display: 'flex', flexDirection:'column', justifyContent:'space-between', height: '100%'}}>
        <Box mb={3}>
          <Box mb={2}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              ¡Hola! Bienvenido a Evaluxia 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ¿En qué puedo ayudarte hoy?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Selecciona una opción o háblame directamente abajo.
            </Typography>
          </Box>
    
          <Grid container spacing={2}>
            {cardOptions.map(({ icon, title, description, action }, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Card elevation={0} sx={{ height: '100%', borderRadius: 2, border: '1.5px solid #6a57e3'}}>
                  <CardContent sx={{minHeight: messages.length === 0 ? '148px' : 'auto', pb: messages.length === 0 ? 3 : '16px !important'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: messages.length === 0 ? 2 : 0}}>
                      <Avatar sx={{ bgcolor: '#cd74dd', width: messages.length == 0 ? 56 : 34, height: messages.length == 0 ? 56 : 34}}>
                        {icon}
                      </Avatar>
                      {messages.length === 0 ? 
                      (<Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>) :
                      (<Button
                        onClick={action}
                        variant="contained"
                        sx={{
                          bgcolor: theme.palette.primary.light,
                          color: 'rgba(0, 0, 0, 0.87)',
                          //color: theme.palette.primary.dark,
                          fontWeight: 700,
                          boxShadow: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          width: '100%',
                        }}
                      >
                        Ir a {title.toLowerCase()}
                        <ArrowForward fontSize="small" />
                      </Button>)
                      }
                    </Box>
                    
                    {messages.length === 0 && <Typography variant="body1" color="text.secondary">{description}</Typography>}
                  </CardContent>
                  {messages.length === 0 && 
                  <CardActions sx={{justifyContent: 'flex-end', padding: 2}} >
                  <Button
                    onClick={action}
                    variant="contained"
                    sx={{
                      bgcolor: theme.palette.primary.light,
                      //color: theme.palette.primary.dark,
                      color: 'rgba(0, 0, 0, 0.87)',
                      fontWeight: 700,
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    Ir a {title.toLowerCase()}
                    <ArrowForward fontSize="small" />
                  </Button>
                  </CardActions>}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
  
        {/* Área del agente */}
        <AgentPanel 
        context="inicio"
        showAttachments={false}
        messages={messages} // ← ahora sí recibe los mensajes reales
        onSendMessage={handleSend}/>
  
      </Box>
    )
  }