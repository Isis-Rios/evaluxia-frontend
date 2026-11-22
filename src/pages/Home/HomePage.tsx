// src/pages/Home/HomePage.tsx
import { useEffect, useMemo } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  AccountTree,
  ArrowForward,
  CropOriginal,
  History,
  Image as ImageIcon,
  Language,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@hooks/useAuth'
import { useEvaluations } from '@hooks/useEvaluations'
import { useEvaluatorProfiles } from '@hooks/useEvaluatorProfiles'

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' | 'warning' }> = {
  pending:   { label: 'Pendiente',   color: 'default' },
  running:   { label: 'En progreso', color: 'info' },
  completed: { label: 'Completada',  color: 'success' },
  failed:    { label: 'Fallida',     color: 'error' },
}

export default function HomePage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Últimas 5 evaluaciones
  const { evaluations, isLoading: evalsLoading, fetchEvaluations } = useEvaluations()
  useEffect(() => { fetchEvaluations(1, 5) }, [fetchEvaluations])

  // Perfil activo y mapa de perfiles
  const { profiles, fetchProfiles } = useEvaluatorProfiles()
  useEffect(() => { fetchProfiles() }, [fetchProfiles])
  const activeProfile = profiles.find((p) => p.isActive) ?? null

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of profiles) {
      map[p._id] = p.fullName
    }
    return map
  }, [profiles])

  const firstName = user?.name?.split(' ')[0] ?? 'evaluador'

  // ── Tarjetas de acceso ────────────────────────────────────────────────────

  const ACTION_CARDS = [
    {
      id: 'card-evaluate-web',
      icon: <Language sx={{ fontSize: 36 }} />,
      title: 'Evaluar sitio web',
      description: 'Permite al agente navegar por un sitio web, analizar accesibilidad y experiencia de usuario, y generar un informe.',
      active: true,
      action: () => navigate('/evaluate/web'),
    },
    {
      id: 'card-evaluate-prototype',
      icon: <CropOriginal sx={{ fontSize: 36 }} />,
      title: 'Evaluar prototipo',
      description: 'Sube tus diseños y prototipos para que el agente los evalúe desde una perspectiva UX y accesibilidad.',
      active: true,
      action: () => navigate('/evaluate/prototype'),
    },
    {
      id: 'card-execute-flow',
      icon: <AccountTree sx={{ fontSize: 36 }} />,
      title: 'Evaluar flujo',
      description: 'El agente simula una interacción completa basada en tu descripción y valida funcionalidades end to end.',
      active: false,
      action: () => navigate('/evaluate/flow'),
    },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>

      {/* ── Bienvenida ── */}
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Hola, {firstName} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={580}>
          EvalUXIA evalúa sitios web y prototipos desde la perspectiva real de un usuario. Selecciona
          un perfil evaluador y ejecuta un análisis para obtener hallazgos de
          accesibilidad y UX fundamentados en criterios WCAG.
        </Typography>
      </Box>

      {/* ── Alerta si no hay perfil activo ── */}
      {activeProfile === null && profiles.length > 0 && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={() => navigate('/perfiles')}>
              Seleccionar
            </Button>
          }
        >
          No tienes un perfil evaluador activo. Las evaluaciones requieren uno.
        </Alert>
      )}

      {/* ── Tarjetas de acción ── */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1.5}>
          ¿QUÉ QUIERES HACER?
        </Typography>
        <Grid container spacing={2}>
          {ACTION_CARDS.map(({ id, icon, title, description, active, action }) => (
            <Grid key={id} size={{ xs: 12, md: 4 }}>
              <Card
                id={id}
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  border: active
                    ? '1.5px solid #6a57e3'
                    : '1.5px solid #e0e0e0',
                  opacity: active ? 1 : 0.72,
                }}
              >
                <CardContent
                  sx={{
                    minHeight: { xs: 'auto', md: 148 },
                    pb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {/* Avatar + título en fila */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: active ? '#cd74dd' : '#bdbdbd',
                        width: 56,
                        height: 56,
                      }}
                    >
                      {icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {title}
                      </Typography>
                      {!active && (
                        <Chip
                          label="Próximamente"
                          size="small"
                          sx={{
                            bgcolor: '#eeeeee',
                            color: '#757575',
                            fontWeight: 600,
                            fontSize: 10,
                            height: 18,
                            mt: 0.3,
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body1" color="text.secondary">
                    {description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', padding: 2 }}>
                  <Button
                    onClick={active ? action : undefined}
                    disabled={!active}
                    variant="contained"
                    sx={{
                      bgcolor: active ? theme.palette.primary.light : undefined,
                      color: active ? 'rgba(0, 0, 0, 0.87)' : undefined,
                      fontWeight: 700,
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      textTransform: 'none',
                    }}
                  >
                    Ir a {title.toLowerCase()} <ArrowForward fontSize="small" />
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Últimas evaluaciones ── */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            ÚLTIMAS EVALUACIONES
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForward fontSize="small" />}
            onClick={() => navigate('/historial')}
            sx={{ textTransform: 'none', fontSize: 12 }}
          >
            Ver historial completo
          </Button>
        </Box>

        {evalsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!evalsLoading && evaluations.length === 0 && (
          <Box
            sx={{
              border: '1.5px dashed #e0e0e0',
              borderRadius: 2,
              py: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <History sx={{ fontSize: 40, opacity: 0.25 }} />
            <Typography variant="body2" mt={1}>
              Aún no tienes evaluaciones. Ejecuta la primera desde "Evaluar sitio web".
            </Typography>
          </Box>
        )}

        {!evalsLoading && evaluations.length > 0 && (
          <Stack divider={<Divider />} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
            {evaluations.slice(0, 5).map((ev) => {
              const status = STATUS_CONFIG[ev.status] ?? { label: ev.status, color: 'default' }
              const dateObj = new Date(ev.createdAt)
              const date = dateObj.toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              const time = dateObj.toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              })
              const profileName =
                (typeof ev.evaluatorProfileId === 'string' && profileMap[ev.evaluatorProfileId]) ||
                (typeof ev.evaluatorProfileId === 'object' && (ev.evaluatorProfileId as unknown as { fullName?: string })?.fullName) ||
                undefined

              const captionText =
                ev.type === 'prototype'
                  ? (ev.description || 'Prototipo sin descripción')
                  : (ev.url || 'Sin URL')

              return (
                <Box
                  key={ev._id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#fafafa' },
                  }}
                  onClick={() => navigate('/historial')}
                >
                  <Badge
                    badgeContent=" "
                    color={status.color}
                    variant="dot"
                    sx={{
                      mt: 0.5,
                      flexShrink: 0,
                      '& .MuiBadge-badge': { width: 10, height: 10, borderRadius: '50%' },
                    }}
                  >
                    {ev.type === 'prototype' ? (
                      <ImageIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    ) : (
                      <Language sx={{ color: 'text.disabled', fontSize: 20 }} />
                    )}
                  </Badge>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {ev.title}
                    </Typography>
                    <Tooltip title={captionText} arrow placement="bottom-start" enterDelay={600}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          lineHeight: 1.4,
                          mt: 0.25,
                        }}
                      >
                        {captionText}
                      </Typography>
                    </Tooltip>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {profileName && (
                      <Chip
                        label={profileName}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 11, fontWeight: 500 }}
                      />
                    )}
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {date}, {time}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>

      {/* ── AgentPanel oculto (futura integración) ── */}
      {/* <AgentPanel context="inicio" showAttachments={false} messages={[]} onSendMessage={() => {}} /> */}
    </Box>
  )
}