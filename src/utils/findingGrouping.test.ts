// src/utils/findingGrouping.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildFindingGroupKey,
  groupFindingsForPresentation,
  sortFindingsDeterministically,
} from '@utils/findingGrouping'
import type { Finding } from '@/types/evaluation.types'

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    _id: 'f-1',
    id: 'f-1',
    evaluationId: 'eval-1',
    iteration: 1,
    findingGroup: 'accessibility',
    type: 'wcag',
    status: 'FAIL',
    severity: 'medium',
    confidence: 'high',
    description: 'Descripción de prueba',
    createdAt: '2026-11-14T19:44:29.000Z',
    updatedAt: '2026-11-14T19:44:29.000Z',
    ...overrides,
  }
}

describe('findingGrouping — Etapa 3: invariantes determinísticas y trazabilidad', () => {
  it('agrupa enlaces WCAG 2.4.4 repetidos (patrón EJE-10) preservando el 100% de registros, selectores e iteraciones', () => {
    const findings: Finding[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeFinding({
          _id: `link-i1-${i}`,
          id: `link-i1-${i}`,
          iteration: 1,
          wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
          status: 'FAIL',
          severity: 'medium',
          description: `El enlace en div > a:nth-of-type(${i + 1}) carece de texto accesible que identifique su destino o propósito.`,
          affectedElement: { tag: 'a', selector: `div > a:nth-of-type(${i + 1})`, href: `https://demo-${i}.carrd.co/` },
          evidence: [
            { type: 'DOM_ATTRIBUTE', property: 'href', value: `https://demo-${i}.carrd.co/`, selector: `div > a:nth-of-type(${i + 1})` },
            { type: 'DOM_ATTRIBUTE', property: 'text', value: '', selector: `div > a:nth-of-type(${i + 1})` },
          ],
          impact: 'Usuarios de lectores de pantalla no sabrán a dónde dirige la navegación.',
          recommendation: 'Reformular el texto del enlace o agregar un aria-label descriptivo.',
        }),
      ),
      ...Array.from({ length: 330 }, (_, i) =>
        makeFinding({
          _id: `link-i2-${i}`,
          id: `link-i2-${i}`,
          iteration: 2,
          wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
          status: 'FAIL',
          severity: 'medium',
          description: `El enlace en article:nth-of-type(${i + 1}) > a carece de texto accesible que identifique su destino o propósito.`,
          affectedElement: { tag: 'a', selector: `article:nth-of-type(${i + 1}) > a`, href: 'https://carrd.com/build#' },
          evidence: [
            { type: 'DOM_ATTRIBUTE', property: 'href', value: 'https://carrd.com/build#', selector: `article:nth-of-type(${i + 1}) > a` },
            { type: 'DOM_ATTRIBUTE', property: 'text', value: '', selector: `article:nth-of-type(${i + 1}) > a` },
          ],
          impact: 'Usuarios de lectores de pantalla no sabrán a dónde dirige la navegación.',
          recommendation: 'Reformular el texto del enlace o agregar un aria-label descriptivo.',
        }),
      ),
    ]

    const groups = groupFindingsForPresentation(findings, 'website')

    expect(groups).toHaveLength(1)
    expect(groups[0].count).toBe(340)
    expect(groups[0].isGrouped).toBe(true)
    expect(groups[0].origin).toBe('deterministic')
    expect(groups[0].iterationBreakdown).toEqual([
      { iteration: 1, count: 10 },
      { iteration: 2, count: 330 },
    ])
    // Recuperación exacta del 100 % de IDs originales sin pérdidas ni duplicados
    const recoveredIds = new Set(groups.flatMap((g) => g.findings.map((f) => f._id)))
    expect(recoveredIds.size).toBe(340)
    expect(groups[0].commonEvidenceSummary.some((s) => s.includes('https://carrd.com/build# (330)'))).toBe(true)
  })

  it('preserva diferencias de colores, ratios y umbrales en WCAG 1.4.3 (patrón EJE-10)', () => {
    const tealButtons = Array.from({ length: 13 }, (_, i) =>
      makeFinding({
        _id: `c-teal-${i}`,
        id: `c-teal-${i}`,
        iteration: 2,
        wcagCriterion: 'WCAG 1.4.3 Contraste (Mínimo)',
        status: 'FAIL',
        severity: 'high',
        description: 'El elemento <a> presenta un ratio de contraste insuficiente de 2.73:1 (mínimo requerido: 4.5:1).',
        affectedElement: { tag: 'a', selector: `article:nth-of-type(${i + 1}) > a`, text: 'Select' },
        evidence: [
          {
            type: 'COMPUTED_STYLE',
            property: 'contrastRatio',
            value: '2.73:1',
            measurement: 'esperado >= 4.5:1',
            context: `color: rgb(255, 255, 255), backgroundColor: rgb(51, 173, 169), fontSize: ${i === 0 ? '16px' : '12.8px'}`,
          },
        ],
        recommendation: 'Ajustar el color del texto (rgb(255, 255, 255)) o del fondo (rgb(51, 173, 169)) para lograr un contraste mínimo de 4.5:1.',
      }),
    )

    const pastelCardA = makeFinding({
      _id: 'c-pastel-1',
      id: 'c-pastel-1',
      iteration: 2,
      wcagCriterion: 'WCAG 1.4.3 Contraste (Mínimo)',
      status: 'FAIL',
      severity: 'high',
      description: 'El elemento <a> presenta un ratio de contraste insuficiente de 1.31:1 (mínimo requerido: 4.5:1).',
      evidence: [
        {
          type: 'COMPUTED_STYLE',
          property: 'contrastRatio',
          value: '1.31:1',
          measurement: 'esperado >= 4.5:1',
          context: 'color: rgba(255, 255, 255, 0.75), backgroundColor: rgb(200, 218, 234), fontSize: 16px',
        },
      ],
      recommendation: 'Ajustar el color del texto (rgba(255, 255, 255, 0.75)) o del fondo (rgb(200, 218, 234)) para lograr un contraste mínimo de 4.5:1.',
    })

    const pastelCardB = makeFinding({
      _id: 'c-pastel-2',
      id: 'c-pastel-2',
      iteration: 2,
      wcagCriterion: 'WCAG 1.4.3 Contraste (Mínimo)',
      status: 'FAIL',
      severity: 'high',
      description: 'El elemento <a> presenta un ratio de contraste insuficiente de 2.28:1 (mínimo requerido: 4.5:1).',
      evidence: [
        {
          type: 'COMPUTED_STYLE',
          property: 'contrastRatio',
          value: '2.28:1',
          measurement: 'esperado >= 4.5:1',
          context: 'color: rgba(255, 255, 255, 0.75), backgroundColor: rgb(160, 152, 134), fontSize: 16px',
        },
      ],
      recommendation: 'Ajustar el color del texto (rgba(255, 255, 255, 0.75)) o del fondo (rgb(160, 152, 134)) para lograr un contraste mínimo de 4.5:1.',
    })

    const groups = groupFindingsForPresentation([...tealButtons, pastelCardA, pastelCardB], 'website')

    // 1 grupo para los 13 botones teal idénticos + 2 individuales para las 2 tarjetas pastel distintas
    expect(groups).toHaveLength(3)
    expect(groups[0].count).toBe(13)
    expect(groups[0].isGrouped).toBe(true)
    expect(groups[1].count).toBe(1)
    expect(groups[1].isGrouped).toBe(false)
    expect(groups[2].count).toBe(1)
    expect(groups[2].isGrouped).toBe(false)
  })

  it('conserva los 7 registros de EJE-14 (prototipo) como observaciones independientes sin fusionar hallazgos de IA', () => {
    const eje14Findings: Finding[] = [
      makeFinding({ _id: '1', id: '1', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', confidence: 'low', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo', description: 'Tendencias KPI bajo contraste visual.' }),
      makeFinding({ _id: '2', id: '2', findingGroup: 'accessibility', type: 'visual', status: 'NOT_EVALUABLE', severity: 'info', confidence: 'low', wcagCriterion: 'WCAG 1.4.3 Contraste mínimo', description: 'Cabeceras de tabla Inventory Status bajo contraste visual.' }),
      makeFinding({ _id: '3', id: '3', findingGroup: 'accessibility', type: 'visual', status: 'FAIL', severity: 'medium', confidence: 'high', wcagCriterion: 'WCAG 1.4.1 Uso del color', description: 'Estados en Recent Shipments usan solo color.' }),
      makeFinding({ _id: '4', id: '4', findingGroup: 'ux', type: 'usability', status: 'FAIL', severity: 'low', confidence: 'high', heuristicCode: 'N-08', description: 'Sección promocional innecesaria en dashboard.' }),
      makeFinding({ _id: '5', id: '5', findingGroup: 'ux', type: 'content', status: 'FAIL', severity: 'medium', confidence: 'high', heuristicCode: 'N-04', description: 'Interfaz en inglés para perfil en español.' }),
      makeFinding({ _id: '6', id: '6', findingGroup: 'ux', type: 'interaction', status: 'PASS', severity: 'info', confidence: 'high', heuristicCode: 'N-06', description: 'Barra lateral con íconos y etiquetas.' }),
      makeFinding({ _id: '7', id: '7', findingGroup: 'accessibility', type: 'wcag', status: 'PASS', severity: 'info', confidence: 'high', wcagCriterion: 'WCAG 2.4.6 Encabezados y etiquetas', description: 'Tarjetas KPI con encabezados descriptivos.' }),
    ]

    const groups = groupFindingsForPresentation(eje14Findings, 'prototype')

    // Ninguna de las 7 observaciones de IA (incluso las 2 NOT_EVALUABLE de WCAG 1.4.3) se fusiona
    expect(groups).toHaveLength(7)
    expect(groups.every((g) => g.count === 1 && !g.isGrouped && g.origin === 'ai')).toBe(true)
    // Orden determinista por severidad: primero medium FAIL (2), luego low FAIL (1), luego info (NE y PASS)
    expect(groups.slice(0, 2).every((g) => g.status === 'FAIL' && g.severity === 'medium')).toBe(true)
    expect(groups[2].status === 'FAIL' && groups[2].severity === 'low').toBe(true)
  })

  it('nunca mezcla estados, severidades, discrepancias ni registros con origen indeterminado (unknown)', () => {
    const mixed: Finding[] = [
      makeFinding({
        _id: 'det-fail-high',
        id: 'det-fail-high',
        status: 'FAIL',
        severity: 'high',
        wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
        description: 'El enlace en a.one carece de texto accesible.',
        affectedElement: { selector: 'a.one' },
        evidence: [{ type: 'DOM_ATTRIBUTE', property: 'href', value: '/a' }, { type: 'DOM_ATTRIBUTE', property: 'text', value: '' }],
      }),
      makeFinding({
        _id: 'det-fail-med',
        id: 'det-fail-med',
        status: 'FAIL',
        severity: 'medium',
        wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
        description: 'El enlace en a.two carece de texto accesible.',
        affectedElement: { selector: 'a.two' },
        evidence: [{ type: 'DOM_ATTRIBUTE', property: 'href', value: '/b' }, { type: 'DOM_ATTRIBUTE', property: 'text', value: '' }],
      }),
      makeFinding({
        _id: 'det-disc',
        id: 'det-disc',
        status: 'FAIL',
        severity: 'medium',
        wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
        description: 'El enlace en a.three carece de texto accesible.',
        affectedElement: { selector: 'a.three' },
        evidence: [{ type: 'DOM_ATTRIBUTE', property: 'href', value: '/c' }, { type: 'DOM_ATTRIBUTE', property: 'text', value: '' }],
        discrepancy: {
          origin: 'ai',
          status: 'PASS',
          severity: 'info',
          confidence: 'medium',
          description: 'El icono adyacente podría dar contexto.',
        },
      }),
      makeFinding({
        _id: 'unk-1',
        id: 'unk-1',
        status: 'FAIL',
        severity: 'medium',
        wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
        description: 'Registro histórico sin firma determinística ni evidencia.',
        evidence: [],
      }),
      makeFinding({
        _id: 'unk-2',
        id: 'unk-2',
        status: 'FAIL',
        severity: 'medium',
        wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
        description: 'Registro histórico sin firma determinística ni evidencia.',
        evidence: [],
      }),
    ]

    const groups = groupFindingsForPresentation(mixed, 'website')

    // Todos quedan en grupos separados: diferente severidad, discrepancia, y 2 registros unknown independientes
    expect(groups).toHaveLength(5)
    expect(buildFindingGroupKey(mixed[3], 'website')).toMatch(/^UNKNOWN_SINGLE::/)
    expect(groups.filter((g) => g.origin === 'unknown')).toHaveLength(2)
    expect(groups[0].severity).toBe('high')
    expect(sortFindingsDeterministically(mixed)[0]._id).toBe('det-fail-high')
  })
})
