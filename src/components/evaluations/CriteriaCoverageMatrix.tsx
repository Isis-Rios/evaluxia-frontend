// src/components/evaluations/CriteriaCoverageMatrix.tsx
import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import BlockIcon from '@mui/icons-material/Block'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import LinkIcon from '@mui/icons-material/Link'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Evaluation, EvaluationType, Finding, Report } from '@/types/evaluation.types'
import type { SnapshotEvidenceItem } from '@services/snapshots/snapshots.service'
import {
  buildCriteriaCoverageMatrix,
  type ReconstructedCriterionRow,
  type ReconstructedDomainSummary,
} from '@utils/criteriaCoverage'
import CriterionContextDrawer from './CriterionContextDrawer'

interface Props {
  findings: Finding[]
  evaluationType?: EvaluationType
  selectedCriterion?: string | null
  onSelectCriterion?: (criterionCode: string | null) => void
  evaluation?: Evaluation | null
  report?: Report | null
  snapshots?: SnapshotEvidenceItem[]
}

function getStatusVisualConfig(row: ReconstructedCriterionRow): {
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  icon: React.ReactElement
} {
  if (row.status === 'FAIL') {
    return {
      label: 'FAIL',
      sublabel: 'Incumplimiento detectado',
      color: '#c62828',
      bg: '#ffebee',
      border: '#ef9a9a',
      icon: <HighlightOffIcon fontSize="small" sx={{ color: '#c62828 !important' }} />,
    }
  }
  if (row.status === 'PASS') {
    return {
      label: 'PASS',
      sublabel: 'Con comprobación conforme',
      color: '#1b5e20',
      bg: '#e8f5e9',
      border: '#a5d6a7',
      icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#1b5e20 !important' }} />,
    }
  }
  if (row.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE') {
    return {
      label: 'FUERA DE COBERTURA',
      sublabel: 'Excluido por modalidad',
      color: '#37474f',
      bg: '#eceff1',
      border: '#b0bec5',
      icon: <BlockIcon fontSize="small" sx={{ color: '#37474f !important' }} />,
    }
  }
  if (row.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING') {
    return {
      label: 'NOT_EVALUABLE',
      sublabel: 'Con observación registrada',
      color: '#5d4037',
      bg: '#fff8e1',
      border: '#ffe082',
      icon: <HelpOutlineIcon fontSize="small" sx={{ color: '#5d4037 !important' }} />,
    }
  }
  return {
    label: 'NOT_EVALUABLE',
    sublabel: 'Sin hallazgos generados',
    color: '#424242',
    bg: '#f5f5f5',
    border: '#bdbdbd',
    icon: <HelpOutlineIcon fontSize="small" sx={{ color: '#424242 !important' }} />,
  }
}

function DomainSummaryBar({
  summary,
  domainLabel,
  isPrototype,
}: {
  summary: ReconstructedDomainSummary
  domainLabel: string
  isPrototype: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
        p: 1.5,
        mb: 2,
        bgcolor: '#f8f6ff',
        border: '1px solid #e0d9f9',
        borderRadius: 1.5,
      }}
    >
      <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ mr: 0.5 }}>
        {domainLabel}:
      </Typography>
      <Chip
        size="small"
        label={`Evaluados: ${summary.evaluatedCount} / ${summary.applicableCount} (${summary.coveragePercent}%)`}
        sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#01579b' }}
      />
      <Chip
        size="small"
        label={`Cumplimiento: ${summary.compliance !== null ? `${summary.compliance}%` : 'No evaluable'}`}
        sx={{ fontWeight: 700, bgcolor: '#ede7f6', color: '#4527a0' }}
      />
      <Chip
        size="small"
        label={`PASS: ${summary.passCount}`}
        sx={{ fontWeight: 700, bgcolor: '#e8f5e9', color: '#1b5e20' }}
      />
      <Chip
        size="small"
        label={`FAIL: ${summary.failCount}`}
        sx={{ fontWeight: 700, bgcolor: '#ffebee', color: '#c62828' }}
      />
      <Tooltip
        title={`Sin hallazgo generado (estado inicial por abstención): ${summary.notEvaluableWithoutFindingsCount} | Con observación registrada como no evaluable: ${summary.notEvaluableWithFindingsCount}`}
        arrow
      >
        <Chip
          size="small"
          label={`NOT_EVALUABLE: ${summary.notEvaluableCount} (${summary.notEvaluableWithFindingsCount} con obs. / ${summary.notEvaluableWithoutFindingsCount} sin hallazgo)`}
          sx={{ fontWeight: 700, bgcolor: '#f5f5f5', color: '#424242', maxWidth: '100%' }}
        />
      </Tooltip>
      {isPrototype && summary.outOfCoverageCount > 0 && (
        <Chip
          size="small"
          label={`Fuera de cobertura visual: ${summary.outOfCoverageCount}`}
          sx={{ fontWeight: 700, bgcolor: '#eceff1', color: '#37474f' }}
        />
      )}
    </Box>
  )
}

export default function CriteriaCoverageMatrix({
  findings,
  evaluationType = 'website',
  selectedCriterion = null,
  onSelectCriterion,
  evaluation = null,
  report = null,
  snapshots = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<'NIELSEN' | 'WCAG'>('NIELSEN')
  const [contextRowCode, setContextRowCode] = useState<string | null>(null)
  const theme = useTheme()
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('md'))
  const isPrototype = evaluationType === 'prototype'

  const matrix = useMemo(
    () => buildCriteriaCoverageMatrix(findings, evaluationType),
    [findings, evaluationType],
  )

  const currentRows = activeTab === 'NIELSEN' ? matrix.nielsenRows : matrix.wcagRows
  const currentSummary = activeTab === 'NIELSEN' ? matrix.nielsenSummary : matrix.wcagSummary

  const activeContextRow = useMemo(() => {
    if (!contextRowCode) return null
    return (
      matrix.nielsenRows.find((r) => r.code === contextRowCode) ||
      matrix.wcagRows.find((r) => r.code === contextRowCode) ||
      null
    )
  }, [contextRowCode, matrix])

  const handleToggleCriterion = (code: string) => {
    if (!onSelectCriterion) return
    if (selectedCriterion === code) {
      onSelectCriterion(null)
    } else {
      onSelectCriterion(code)
    }
  }

  const renderActionsCell = (row: ReconstructedCriterionRow) => {
    const isSelected = selectedCriterion === row.code
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-start' }}>
        {row.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE' && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
            Excluido del denominador en imagen única.
          </Typography>
        )}

        {row.traceabilityCase === 'CASE_B_NOT_EVALUABLE_NO_FINDING' && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
            <strong>0 hallazgos</strong> · Conserva estado inicial <code>NOT_EVALUABLE</code>.
          </Typography>
        )}

        {(row.traceabilityCase === 'CASE_A_WITH_VERDICT' ||
          row.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING') && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ mb: 0.5 }}>
              {row.findingsCount}{' '}
              {row.findingsCount === 1 ? 'registro asociado' : 'registros asociados'}:{' '}
              {[
                row.failFindingsCount > 0 ? `${row.failFindingsCount} FAIL` : null,
                row.passFindingsCount > 0 ? `${row.passFindingsCount} PASS` : null,
                row.notEvaluableFindingsCount > 0 ? `${row.notEvaluableFindingsCount} NOT_EVALUABLE` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>

            {onSelectCriterion && (
              <Button
                type="button"
                size="small"
                variant={isSelected ? 'contained' : 'outlined'}
                color="primary"
                startIcon={isSelected ? <FilterAltOffIcon fontSize="small" /> : <FilterListIcon fontSize="small" />}
                onClick={() => handleToggleCriterion(row.code)}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.25 }}
              >
                {isSelected
                  ? 'Quitar filtro'
                  : row.traceabilityCase === 'CASE_C_NOT_EVALUABLE_WITH_FINDING'
                    ? `Ver observación (${row.findingsCount})`
                    : `Filtrar por criterio (${row.findingsCount})`}
              </Button>
            )}
          </Box>
        )}

        <Button
          type="button"
          size="small"
          variant="text"
          color="primary"
          startIcon={<InfoOutlinedIcon fontSize="small" />}
          onClick={() => setContextRowCode(row.code)}
          aria-label={`Ver contexto y alcance de ${row.code}`}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 11,
            p: 0.25,
            color: 'primary.dark',
          }}
        >
          Ver contexto y alcance
        </Button>
      </Box>
    )
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e0d9f9',
          borderRadius: 2,
          bgcolor: '#ffffff',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        {/* Cabecera y Pestañas de dominio */}
        <Box sx={{ p: 2.5, pb: 0, bgcolor: '#f8f6ff', borderBottom: '1px solid #e0d9f9' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                🧭 MATRIZ DE COBERTURA Y TRAZABILIDAD POR CRITERIO
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {isPrototype
                  ? 'Consulta individual de los 13 criterios aplicables en prototipos estáticos (6 Nielsen + 7 WCAG) y los 6 criterios excluidos por modalidad.'
                  : 'Consulta individual de las 10 heurísticas de usabilidad de Nielsen y los 10 criterios WCAG 2.2 contemplados en la modalidad web.'}
              </Typography>
            </Box>

            {selectedCriterion && onSelectCriterion && (
              <Chip
                icon={<FilterAltOffIcon fontSize="small" />}
                label={`Filtro activo: ${selectedCriterion} (Quitar)`}
                color="primary"
                size="small"
                onClick={() => onSelectCriterion(null)}
                onDelete={() => onSelectCriterion(null)}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_e, val: 'NIELSEN' | 'WCAG') => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mt: 1.5, '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none' } }}
          >
            <Tab
              value="NIELSEN"
              label={
                isPrototype
                  ? 'Heurísticas de Nielsen (6 aplicables · 4 excluidas)'
                  : 'Heurísticas de Nielsen (10 criterios)'
              }
            />
            <Tab
              value="WCAG"
              label={
                isPrototype
                  ? 'Criterios WCAG 2.2 (7 aplicables · 2 excluidos)'
                  : 'Criterios WCAG 2.2 (10 criterios)'
              }
            />
          </Tabs>
        </Box>

        {/* Contenido de la pestaña activa */}
        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <DomainSummaryBar
            summary={currentSummary}
            domainLabel={activeTab === 'NIELSEN' ? 'Resumen Heurísticas de Nielsen' : 'Resumen Criterios WCAG 2.2'}
            isPrototype={isPrototype}
          />

          {activeTab === 'NIELSEN' ? (
            <Alert severity="info" variant="outlined" sx={{ mb: 2, py: 0.5 }}>
              <Typography variant="caption" color="text.primary">
                <strong>Trazabilidad heurística:</strong> Pulse <em>«Filtrar por criterio»</em> para saltar a los hallazgos asociados o{' '}
                <strong>«Ver contexto y alcance»</strong> para abrir el panel lateral con la evidencia recopilada, limitaciones y verificación humana recomendada.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" variant="outlined" sx={{ mb: 2, py: 0.5 }}>
              <Typography variant="caption" color="text.primary">
                <strong>Alcance WCAG 2.2:</strong> EvalUXIA inspecciona un subconjunto acotado de criterios niveles A y AA. Un estado{' '}
                <code>PASS</code> refleja ausencia de incumplimientos en los elementos analizados, pero{' '}
                <strong>no constituye una certificación formal de conformidad WCAG 2.2</strong>.
              </Typography>
            </Alert>
          )}

          {isCompactLayout ? (
            /* Vista en tarjetas verticales para pantallas < md (sin scroll horizontal) */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {currentRows.map((row) => {
                const st = getStatusVisualConfig(row)
                const isSelected = selectedCriterion === row.code
                return (
                  <Paper
                    key={row.code}
                    elevation={0}
                    sx={{
                      p: 1.75,
                      border: isSelected ? '2px solid #673ab7' : '1px solid #e0e0e0',
                      borderRadius: 1.5,
                      bgcolor: isSelected ? '#f3e5f5' : '#ffffff',
                      opacity: row.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE' ? 0.85 : 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                          label={row.code}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: 11,
                            height: 20,
                            bgcolor: row.framework === 'NIELSEN' ? '#ede7f6' : '#e3f2fd',
                            color: row.framework === 'NIELSEN' ? '#4527a0' : '#01579b',
                          }}
                        />
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {row.name}
                        </Typography>
                        {row.wcagLevel && (
                          <Chip label={`Nivel ${row.wcagLevel}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                        )}
                      </Box>

                      <Chip
                        icon={st.icon}
                        label={st.label}
                        size="small"
                        sx={{
                          bgcolor: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                          fontWeight: 800,
                          fontSize: 11,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                      <Chip
                        label={row.mechanismLabel}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, fontWeight: 600, height: 'auto', py: 0.25, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontWeight: 600 }}>
                        {st.sublabel}
                      </Typography>
                    </Box>

                    {row.hasCrossDomainHeadingFinding && (
                      <Chip
                        icon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                        label="Incluye hallazgo transversal N-04 + WCAG 1.3.1 (Ausencia de <h1>)"
                        size="small"
                        sx={{
                          mb: 1,
                          height: 'auto',
                          py: 0.25,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: '#fff3e0',
                          color: '#bf360c',
                          border: '1px solid #ffb74d',
                          '& .MuiChip-label': { whiteSpace: 'normal' },
                        }}
                      />
                    )}

                    {renderActionsCell(row)}
                  </Paper>
                )
              })}
            </Box>
          ) : (
            /* Vista tabular fija para escritorio >= md (table-layout: fixed evita expansión horizontal) */
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5 }}>
              <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 800, width: '32%' }}>Código y Criterio</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: '21%' }}>Mecanismo</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: '21%' }}>Estado del Criterio</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: '26%' }}>Hallazgos y Contexto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRows.map((row) => {
                    const st = getStatusVisualConfig(row)
                    const isSelected = selectedCriterion === row.code

                    return (
                      <TableRow
                        key={row.code}
                        hover
                        selected={isSelected}
                        sx={{
                          opacity: row.traceabilityCase === 'CASE_D_OUT_OF_COVERAGE' ? 0.85 : 1,
                          bgcolor: isSelected ? '#f3e5f5' : 'inherit',
                        }}
                      >
                        {/* Columna 1: Código, nombre y badge programático <h1> solo cuando está verificado */}
                        <TableCell sx={{ verticalAlign: 'top', py: 1.25, overflowWrap: 'anywhere' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Chip
                              label={row.code}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: 11,
                                height: 20,
                                bgcolor: row.framework === 'NIELSEN' ? '#ede7f6' : '#e3f2fd',
                                color: row.framework === 'NIELSEN' ? '#4527a0' : '#01579b',
                              }}
                            />
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                              {row.name}
                            </Typography>
                            {row.wcagLevel && (
                              <Chip
                                label={`Nivel ${row.wcagLevel}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                              />
                            )}
                          </Box>

                          {row.hasCrossDomainHeadingFinding && (
                            <Chip
                              icon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                              label="Incluye hallazgo transversal N-04 + WCAG 1.3.1 (Ausencia de <h1>)"
                              size="small"
                              sx={{
                                mt: 0.75,
                                height: 'auto',
                                py: 0.25,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: '#fff3e0',
                                color: '#bf360c',
                                border: '1px solid #ffb74d',
                                maxWidth: '100%',
                                '& .MuiChip-label': { whiteSpace: 'normal' },
                              }}
                            />
                          )}
                        </TableCell>

                        {/* Columna 2: Mecanismo en la modalidad */}
                        <TableCell sx={{ verticalAlign: 'top', py: 1.25 }}>
                          <Chip
                            label={row.mechanismLabel}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              height: 'auto',
                              py: 0.4,
                              maxWidth: '100%',
                              '& .MuiChip-label': { whiteSpace: 'normal', display: 'block' },
                            }}
                          />
                        </TableCell>

                        {/* Columna 3: Estado registrado */}
                        <TableCell sx={{ verticalAlign: 'top', py: 1.25 }}>
                          <Chip
                            icon={st.icon}
                            label={st.label}
                            size="small"
                            sx={{
                              bgcolor: st.bg,
                              color: st.color,
                              border: `1px solid ${st.border}`,
                              fontWeight: 800,
                              fontSize: 11,
                              maxWidth: '100%',
                              '& .MuiChip-label': { whiteSpace: 'normal' },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.4, fontWeight: 600 }}>
                            {st.sublabel}
                          </Typography>
                        </TableCell>

                        {/* Columna 4: Hallazgos asociados y disparador del panel lateral */}
                        <TableCell sx={{ verticalAlign: 'top', py: 1.25 }}>
                          {renderActionsCell(row)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Nota metodológica sobre WCAG 3.2.2 en prototipos */}
          {isPrototype && activeTab === 'WCAG' && matrix.uncontemplatedPrototypeNote && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1.5, fontStyle: 'italic', lineHeight: 1.4 }}
            >
              {matrix.uncontemplatedPrototypeNote}
            </Typography>
          )}
        </Box>
      </Card>

      {/* Panel lateral (escritorio) / Diálogo accesible (móvil/tablet) para Contexto y alcance */}
      <CriterionContextDrawer
        row={activeContextRow}
        open={Boolean(activeContextRow)}
        onClose={() => setContextRowCode(null)}
        onFilterByCriterion={
          onSelectCriterion
            ? (code) => {
                onSelectCriterion(code)
              }
            : undefined
        }
        evaluation={evaluation}
        report={report}
        snapshots={snapshots}
      />
    </>
  )
}
