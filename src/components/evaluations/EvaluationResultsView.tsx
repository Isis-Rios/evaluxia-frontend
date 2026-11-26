// src/components/evaluations/EvaluationResultsView.tsx
import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Link as MuiLink,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import CropOriginalIcon from '@mui/icons-material/CropOriginal'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { Evaluation, EvaluationType, Finding, Report } from '@/types/evaluation.types'
import { buildFindingSummary } from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import { buildExplorationIntegritySummary } from '@utils/criteriaCoverage'
import EvaluationSummary from './EvaluationSummary'
import CriteriaCoverageMatrix from './CriteriaCoverageMatrix'
import IterationTimeline from './IterationTimeline'
import FindingsAccordion from './FindingsAccordion'
import IncompleteExplorationNotice from './IncompleteExplorationNotice'

export type ResultsSectionTab = 'summary' | 'criteria' | 'findings' | 'evidence'

interface Props {
  evaluation?: Evaluation | null
  evaluationType: EvaluationType
  report?: Report | null
  findings: Finding[]
  snapshots?: SnapshotEvidenceItem[]
  profileName?: string
  profileArchetype?: string
  headerAction?: React.ReactNode
  findingsLoading?: boolean
  findingsError?: string | null
  initialTab?: ResultsSectionTab
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000'

/**
 * EvaluationResultsView — Contenedor reutilizable a ancho completo para consultar
 * los resultados de una evaluación (tanto desde el Historial como al finalizar una
 * nueva ejecución web o de prototipo).
 *
 * Organiza el reporte en 4 secciones principales accesibles por teclado:
 * 1. Resumen
 * 2. Criterios (Nielsen y WCAG + panel lateral "Contexto y alcance")
 * 3. Hallazgos
 * 4. Recorrido y evidencias (web) / Prototipo visual (prototipo)
 */
export default function EvaluationResultsView({
  evaluation = null,
  evaluationType,
  report = null,
  findings,
  snapshots = [],
  profileName,
  profileArchetype,
  headerAction,
  findingsLoading = false,
  findingsError = null,
  initialTab = 'summary',
}: Props) {
  const [activeTab, setActiveTab] = useState<ResultsSectionTab>(initialTab)
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  const isPrototype = evaluationType === 'prototype'
  const summary = useMemo(() => buildFindingSummary(findings), [findings])

  const integrity = useMemo(
    () =>
      !isPrototype
        ? buildExplorationIntegritySummary({ evaluation, report, snapshots })
        : null,
    [isPrototype, evaluation, report, snapshots],
  )

  const prototypeImageUrl = useMemo(() => {
    if (!isPrototype || !evaluation?.imageUrl) return null
    return evaluation.imageUrl.startsWith('http')
      ? evaluation.imageUrl
      : `${API_BASE_URL}${evaluation.imageUrl.startsWith('/') ? '' : '/'}${evaluation.imageUrl}`
  }, [isPrototype, evaluation?.imageUrl])

  const handleSelectCriterionFromMatrix = (criterionCode: string | null) => {
    setSelectedCriterion(criterionCode)
    if (criterionCode) {
      setActiveTab('findings')
      setLiveAnnouncement(`Mostrando hallazgos filtrados por el criterio ${criterionCode}.`)
    } else {
      setLiveAnnouncement('Filtro de criterio eliminado.')
    }
  }

  const formattedDateTime = useMemo(() => {
    if (!evaluation?.createdAt) return null
    const d = new Date(evaluation.createdAt)
    return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  }, [evaluation?.createdAt])

  const evidenceTabLabel = isPrototype
    ? 'Prototipo visual'
    : `Recorrido y evidencias (${snapshots.length})`

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Región aria-live para anunciar cambios de filtro entre Criterios y Hallazgos */}
      <Box
        component="span"
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {liveAnnouncement}
      </Box>

      {/* ── CABECERA COMPACTA DEL REPORTE (a ancho completo, sin columna lateral de perfil) ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          borderRadius: 2,
          border: '1px solid #e0d9f9',
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Chip
                size="small"
                label={isPrototype ? 'Prototipo visual' : 'Sitio web'}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
              />
              {report?.overallScore !== null && report?.overallScore !== undefined && (
                <Chip
                  size="small"
                  label={`Calificación: ${report.overallScore} / 100`}
                  sx={{ fontWeight: 800, height: 22, fontSize: 11, bgcolor: '#ede7f6', color: '#4527a0' }}
                />
              )}
              {integrity && (
                <Chip
                  size="small"
                  icon={
                    integrity.isComplete ? (
                      <CheckCircleOutlineIcon sx={{ color: '#1b5e20 !important', fontSize: 15 }} />
                    ) : (
                      <ErrorOutlineIcon sx={{ color: '#bf360c !important', fontSize: 15 }} />
                    )
                  }
                  label={integrity.statusLabel}
                  sx={{
                    fontWeight: 700,
                    height: 22,
                    fontSize: 11,
                    bgcolor: integrity.isComplete ? '#e8f5e9' : '#fff3e0',
                    color: integrity.isComplete ? '#1b5e20' : '#bf360c',
                  }}
                />
              )}
            </Box>

            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ overflowWrap: 'anywhere', lineHeight: 1.3 }}>
              {evaluation?.title || report?.title || 'Resultados de la evaluación'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
              {!isPrototype && evaluation?.url && (
                <MuiLink
                  href={evaluation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  sx={{ fontWeight: 600, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {evaluation.url}
                </MuiLink>
              )}
              {profileName && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonOutlineIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Perfil: {profileName}
                    {profileArchetype ? ` (${profileArchetype})` : ''}
                  </Typography>
                </Box>
              )}
              {formattedDateTime && (
                <Typography variant="caption" color="text.secondary">
                  {formattedDateTime}
                </Typography>
              )}
            </Box>
          </Box>

          {headerAction && <Box sx={{ flexShrink: 0 }}>{headerAction}</Box>}
        </Box>

        {/* Navegación principal por 4 secciones */}
        <Tabs
          value={activeTab}
          onChange={(_e, val: ResultsSectionTab) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Secciones del reporte de resultados"
          sx={{
            mt: 2,
            borderTop: '1px solid #f0ecfa',
            pt: 0.5,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              minHeight: 44,
            },
          }}
        >
          <Tab
            id="results-tab-summary"
            aria-controls="results-tabpanel-summary"
            value="summary"
            icon={<AssessmentOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Resumen"
          />
          <Tab
            id="results-tab-criteria"
            aria-controls="results-tabpanel-criteria"
            value="criteria"
            icon={<FactCheckOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Criterios"
          />
          <Tab
            id="results-tab-findings"
            aria-controls="results-tabpanel-findings"
            value="findings"
            icon={<ListAltOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`Hallazgos (${findings.length})`}
          />
          <Tab
            id="results-tab-evidence"
            aria-controls="results-tabpanel-evidence"
            value="evidence"
            icon={isPrototype ? <CropOriginalIcon fontSize="small" /> : <RouteOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={evidenceTabLabel}
          />
        </Tabs>
      </Paper>

      {/* Aviso de exploración parcial (una sola vez, solo web con cierre no natural) */}
      {!isPrototype && (
        <IncompleteExplorationNotice
          blockingError={evaluation?.flowState?.blockingError}
          terminationReason={evaluation?.flowState?.terminationReason}
        />
      )}

      {/* ── SECCIÓN 1: RESUMEN ── */}
      {activeTab === 'summary' && (
        <Box role="tabpanel" id="results-tabpanel-summary" aria-labelledby="results-tab-summary">
          <EvaluationSummary
            summary={summary}
            report={report}
            evaluationType={evaluationType}
            findings={findings}
          />
        </Box>
      )}

      {/* ── SECCIÓN 2: CRITERIOS ── */}
      {activeTab === 'criteria' && (
        <Box role="tabpanel" id="results-tabpanel-criteria" aria-labelledby="results-tab-criteria">
          <CriteriaCoverageMatrix
            findings={findings}
            evaluationType={evaluationType}
            selectedCriterion={selectedCriterion}
            onSelectCriterion={handleSelectCriterionFromMatrix}
            evaluation={evaluation}
            report={report}
            snapshots={snapshots}
          />
        </Box>
      )}

      {/* ── SECCIÓN 3: HALLAZGOS ── */}
      {activeTab === 'findings' && (
        <Box role="tabpanel" id="results-tabpanel-findings" aria-labelledby="results-tab-findings">
          {selectedCriterion && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Navegando hallazgos filtrados desde la matriz de criterios.
              </Typography>
              <Button
                type="button"
                size="small"
                variant="text"
                onClick={() => setActiveTab('criteria')}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12 }}
              >
                ← Volver a la matriz de criterios
              </Button>
            </Box>
          )}

          {findingsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {findingsError}
            </Alert>
          )}

          {findingsLoading ? (
            <Typography color="text.secondary">Cargando hallazgos...</Typography>
          ) : (
            <FindingsAccordion
              findings={findings}
              evaluationType={evaluationType}
              selectedCriterion={selectedCriterion}
              onClearCriterion={() => handleSelectCriterionFromMatrix(null)}
            />
          )}
        </Box>
      )}

      {/* ── SECCIÓN 4: RECORRIDO Y EVIDENCIAS (WEB) / PROTOTIPO VISUAL (PROTOTIPO) ── */}
      {activeTab === 'evidence' && (
        <Box role="tabpanel" id="results-tabpanel-evidence" aria-labelledby="results-tab-evidence">
          {isPrototype ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: '1px solid #e0d9f9',
                bgcolor: '#ffffff',
              }}
            >
              <Typography variant="subtitle1" fontWeight={800} color="primary.main" gutterBottom>
                🖼️ PROTOTIPO VISUAL EVALUADO
              </Typography>
              {prototypeImageUrl ? (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <MuiLink
                    href={prototypeImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir imagen del prototipo evaluado en tamaño completo en una nueva pestaña"
                    sx={{
                      display: 'inline-block',
                      maxWidth: '100%',
                      borderRadius: 2,
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 3,
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={prototypeImageUrl}
                      alt="Prototipo evaluado"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 520,
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        objectFit: 'contain',
                      }}
                    />
                  </MuiLink>
                  <Box sx={{ mt: 1 }}>
                    <MuiLink
                      href={prototypeImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      fontWeight={700}
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Abrir imagen original en nueva pestaña <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </MuiLink>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                  No hay imagen de prototipo disponible para esta evaluación.
                </Typography>
              )}

              {evaluation?.description && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f6ff', borderRadius: 1.5, border: '1px solid #e0d9f9' }}>
                  <Typography variant="caption" fontWeight={800} color="primary.dark" display="block" gutterBottom>
                    CONTEXTO DESCRIPTIVO SUMINISTRADO PARA LA EVALUACIÓN
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.6 }}>
                    {evaluation.description}
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : (
            <IterationTimeline
              snapshots={snapshots}
              evaluation={evaluation}
              report={report}
            />
          )}
        </Box>
      )}
    </Box>
  )
}
