// src/components/evaluations/FindingsAccordion.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import FindingsAccordion from './FindingsAccordion'
import type { Finding } from '@/types/evaluation.types'

afterEach(() => {
  cleanup()
})

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    _id: 'finding-1',
    id: 'finding-1',
    evaluationId: 'eval-1',
    iteration: 1,
    findingGroup: 'ux',
    status: 'FAIL',
    severity: 'medium',
    confidence: 'high',
    description: 'Dos botones distintos usan el mismo texto "Enviar".',
    recommendation: 'Diferenciar el texto de cada botón.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('FindingsAccordion — evidencia VISUAL_OBSERVATION (prototipos)', () => {
  it('renders elementDescription, region and context even when property/value are absent', () => {
    const finding = makeFinding({
      evidence: [
        {
          type: 'VISUAL_OBSERVATION',
          elementDescription: 'botón Enviar del formulario de contacto',
          region: 'center',
          context: 'Pertenece a la tarjeta del formulario de contacto.',
        },
      ],
    })

    render(<FindingsAccordion findings={[finding]} evaluationType="prototype" />)

    expect(screen.getByText(/botón Enviar del formulario de contacto/)).toBeTruthy()
    expect(screen.getByText(/Región: center/)).toBeTruthy()
    expect(screen.getByText(/Pertenece a la tarjeta del formulario de contacto\./)).toBeTruthy()
  })

  it('still renders property/value for evidence that has them, alongside the new fields', () => {
    const finding = makeFinding({
      evidence: [
        {
          type: 'VISUAL_OBSERVATION',
          elementDescription: "Ícono de guion '-' en la esquina superior derecha",
          property: 'visibleText',
          value: '',
          context: 'El ícono es pequeño y se presenta de forma aislada sin texto acompañante.',
        },
      ],
    })

    render(<FindingsAccordion findings={[finding]} evaluationType="prototype" />)

    expect(screen.getByText(/Ícono de guion/)).toBeTruthy()
    expect(screen.getByText(/Property: visibleText/)).toBeTruthy()
  })

  it('does not render an evidence item for findings with no evidence at all', () => {
    const finding = makeFinding({ evidence: [] })
    render(<FindingsAccordion findings={[finding]} evaluationType="prototype" />)
    expect(screen.getByText('No hay evidencia técnica disponible.')).toBeTruthy()
  })
})

describe('FindingsAccordion — filtro inicial FAIL y filtrado interactivo (Etapa 3)', () => {
  it('inicia filtrando por FAIL y permite alternar a NOT_EVALUABLE, PASS y Todos conservando los conteos originales', () => {
    const findings = [
      makeFinding({ _id: 'f1', id: 'f1', status: 'FAIL', description: 'Fallo de contraste 1.3:1' }),
      makeFinding({ _id: 'f2', id: 'f2', status: 'NOT_EVALUABLE', description: 'Contraste no determinable' }),
      makeFinding({ _id: 'f3', id: 'f3', status: 'PASS', description: 'Enlace con texto accesible' }),
    ]

    render(<FindingsAccordion findings={findings} evaluationType="prototype" />)

    // Chips muestran siempre conteos reales originales
    expect(screen.getByText('FAIL (1)')).toBeTruthy()
    expect(screen.getByText('NOT_EVALUABLE (1)')).toBeTruthy()
    expect(screen.getByText('PASS (1)')).toBeTruthy()
    expect(screen.getByText('Todos (3)')).toBeTruthy()

    // Filtro inicial: FAIL
    expect(screen.getByText('Fallo de contraste 1.3:1')).toBeTruthy()
    expect(screen.queryByText('Contraste no determinable')).toBeNull()
    expect(screen.queryByText('Enlace con texto accesible')).toBeNull()

    // Clic en PASS
    fireEvent.click(screen.getByText('PASS (1)'))
    expect(screen.queryByText('Fallo de contraste 1.3:1')).toBeNull()
    expect(screen.getByText('Enlace con texto accesible')).toBeTruthy()

    // Clic en NOT_EVALUABLE
    fireEvent.click(screen.getByText('NOT_EVALUABLE (1)'))
    expect(screen.getByText('Contraste no determinable')).toBeTruthy()
    expect(screen.queryByText('Enlace con texto accesible')).toBeNull()

    // Clic en Todos: conviven los 3 estados
    fireEvent.click(screen.getByText('Todos (3)'))
    expect(screen.getByText('Fallo de contraste 1.3:1')).toBeTruthy()
    expect(screen.getByText('Contraste no determinable')).toBeTruthy()
    expect(screen.getByText('Enlace con texto accesible')).toBeTruthy()
  })

  it('shows an empty state message when a status filter has 0 matching findings', () => {
    const findings = [makeFinding({ _id: 'f1', id: 'f1', status: 'FAIL', description: 'Fallo único' })]
    render(<FindingsAccordion findings={findings} evaluationType="prototype" />)

    fireEvent.click(screen.getByText('PASS (0)'))
    expect(screen.getByText(/No se encontraron hallazgos con estado/)).toBeTruthy()
    expect(screen.getByText('PASS')).toBeTruthy()
  })
})

describe('FindingsAccordion — vista agrupada, instancias paginadas y vista individual reversible (Etapa 3)', () => {
  it('agrupa 25 hallazgos determinísticos WCAG 2.4.4 en 1 tarjeta agrupada con instancias paginadas (10/página) y permite volver a vista individual', () => {
    const repeatedLinks: Finding[] = Array.from({ length: 25 }, (_, i) =>
      makeFinding({
        _id: `link-${i + 1}`,
        id: `link-${i + 1}`,
        iteration: i < 5 ? 1 : 2,
        findingGroup: 'accessibility',
        type: 'wcag',
        status: 'FAIL',
        severity: 'medium',
        confidence: 'high',
        wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
        description: `El enlace en article:nth-of-type(${i + 1}) > a carece de texto accesible que identifique su destino o propósito.`,
        affectedElement: { tag: 'a', selector: `article:nth-of-type(${i + 1}) > a`, href: 'https://carrd.com/build#' },
        evidence: [
          { type: 'DOM_ATTRIBUTE', property: 'href', value: 'https://carrd.com/build#', selector: `article:nth-of-type(${i + 1}) > a` },
          { type: 'DOM_ATTRIBUTE', property: 'text', value: '', selector: `article:nth-of-type(${i + 1}) > a` },
        ],
        impact: 'Usuarios de lectores de pantalla no conocerán el destino del enlace.',
        recommendation: 'Agregar aria-label descriptivo.',
      }),
    )

    render(<FindingsAccordion findings={repeatedLinks} evaluationType="website" />)

    // Vista agrupada por defecto: muestra 25 hallazgos reales organizados en 1 grupo
    expect(screen.getByText('25 instancias')).toBeTruthy()
    expect(screen.getByText('Paso 1: 5 · Paso 2: 20')).toBeTruthy()
    expect(screen.getByText(/hallazgos reales organizados en/i)).toBeTruthy()

    // Expandir la tarjeta agrupada para revisar instancias paginadas (10 por página)
    const groupTrigger = screen.getByRole('button', { expanded: false })
    fireEvent.click(groupTrigger)

    expect(screen.getByText(/INSTANCIAS INDIVIDUALES \(1–10 de 25\)/i)).toBeTruthy()
    expect(screen.getByText(/PATRÓN COMPARTIDO \(25 HALLAZGOS ORIGINALES\)/i)).toBeTruthy()
    expect(screen.getByText(/Agregar aria-label descriptivo\./i)).toBeTruthy()

    // Desplegar el detalle técnico original de la primera instancia
    const detailButtons = screen.getAllByRole('button', { name: /Ver detalle técnico/i })
    expect(detailButtons).toHaveLength(10)
    fireEvent.click(detailButtons[0])
    expect(screen.getByText(/ID original: link-1/i)).toBeTruthy()

    // Cambiar a Vista individual: pagina 20 de 25 sin montar todo a la vez
    fireEvent.click(screen.getByRole('button', { name: /Vista individual/i }))
    expect(screen.getByText(/1–20/)).toBeTruthy()
    expect(screen.getByText(/hallazgos individuales originales/i)).toBeTruthy()
  })

  it('auto-ajusta el filtro cuando se navega desde la matriz a un criterio que solo tiene registros NOT_EVALUABLE', () => {
    const findings: Finding[] = [
      makeFinding({
        _id: 'ne-1',
        id: 'ne-1',
        findingGroup: 'accessibility',
        type: 'visual',
        status: 'NOT_EVALUABLE',
        severity: 'info',
        confidence: 'low',
        wcagCriterion: 'WCAG 1.4.3 Contraste mínimo',
        description: 'Contraste visual aparente bajo en subtítulos KPI.',
      }),
    ]

    render(
      <FindingsAccordion
        findings={findings}
        evaluationType="prototype"
        selectedCriterion="WCAG 1.4.3"
      />,
    )

    expect(screen.getByText('Contraste visual aparente bajo en subtítulos KPI.')).toBeTruthy()
  })
})

describe('FindingsAccordion — trazabilidad enriquecida (N-04 transversal, origen, confianza, impacto y discrepancias)', () => {
  it('renders both WCAG and Nielsen codes simultaneously for cross-domain findings (N-04 + WCAG 1.3.1)', () => {
    const crossFinding = makeFinding({
      _id: 'f-cross',
      id: 'f-cross',
      findingGroup: 'ux',
      type: 'usability',
      status: 'FAIL',
      severity: 'medium',
      confidence: 'high',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description: 'La página evaluada carece de un encabezado principal de primer nivel (<h1>).',
      impact: 'Los usuarios de tecnologías de asistencia no cuentan con un punto de inicio claro.',
      evidence: [{ type: 'HEADING_STRUCTURE', value: 'h1_count: 0', selector: 'body' }],
    })

    render(<FindingsAccordion findings={[crossFinding]} evaluationType="website" />)

    expect(screen.getAllByText('WCAG 1.3.1 Información y relaciones').length).toBeGreaterThan(0)
    expect(screen.getByText('N-04 · Consistencia y estándares')).toBeTruthy()
    expect(screen.getByText('Regla determinística')).toBeTruthy()
    expect(screen.getByText('Confianza del sistema: Alta')).toBeTruthy()
    expect(screen.getByText(/Los usuarios de tecnologías de asistencia no cuentan con un punto de inicio claro/i)).toBeTruthy()
    expect(screen.getByText(/Hallazgo transversal:/i)).toBeTruthy()
  })

  it('renders discrepancy details when deterministic and AI mechanisms disagreed during consolidation', () => {
    const findingWithDiscrepancy = makeFinding({
      _id: 'f-disc',
      id: 'f-disc',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'PASS',
      severity: 'info',
      confidence: 'high',
      wcagCriterion: 'WCAG 2.4.4 Propósito de los enlaces',
      description: 'El enlace tiene un propósito identificable: "Leer más".',
      discrepancy: {
        origin: 'ai',
        status: 'FAIL',
        severity: 'medium',
        confidence: 'high',
        description: 'El texto "Leer más" resulta ambiguo fuera de contexto.',
      },
    })

    render(<FindingsAccordion findings={[findingWithDiscrepancy]} evaluationType="website" />)

    // Filtro inicial es FAIL; al seleccionar PASS (1) se muestra el hallazgo con discrepancia
    fireEvent.click(screen.getByText('PASS (1)'))
    expect(screen.getByText(/DISCREPANCIA REGISTRADA ENTRE MECANISMOS DE EVALUACIÓN/i)).toBeTruthy()
    expect(screen.getByText(/El texto "Leer más" resulta ambiguo fuera de contexto/i)).toBeTruthy()
  })

  it('shows "Análisis IA" and "Hallazgo con doble clasificación" (not missing <h1>) for EJE-10 Gemini dual findings, and "Origen no especificado" for ambiguous findings', () => {
    const eje10NavFinding = makeFinding({
      _id: '6af8ba1ecf630223c0672b0e',
      id: '6af8ba1ecf630223c0672b0e',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'low',
      confidence: 'high',
      heuristicCode: 'N-04',
      heuristicName: 'Consistencia y estándares',
      wcagCriterion: 'WCAG 1.3.1 Información y relaciones',
      description: "El punto de referencia de navegación `<nav>` carece de un atributo 'aria-label'.",
      evidence: [{ type: 'DOM_ATTRIBUTE', property: 'ariaLabel', value: 'null', selector: 'header > nav' }],
    })
    const ambiguousFinding = makeFinding({
      _id: 'f-unknown-origin',
      id: 'f-unknown-origin',
      findingGroup: 'accessibility',
      type: 'wcag',
      status: 'FAIL',
      severity: 'medium',
      confidence: 'high',
      wcagCriterion: 'WCAG 1.1.1 Contenido no textual',
      description: 'Registro histórico sin firma determinística verificable.',
      evidence: [],
    })

    render(<FindingsAccordion findings={[eje10NavFinding, ambiguousFinding]} evaluationType="website" />)

    expect(screen.getByText('Análisis IA')).toBeTruthy()
    expect(screen.getByText('Origen no especificado')).toBeTruthy()
    expect(screen.getByText(/Hallazgo con doble clasificación:/i)).toBeTruthy()
    expect(screen.queryByText(/ausencia de <h1>/i)).toBeNull()

    // Ordenado por severidad: primero medium (ambiguousFinding), luego low (eje10NavFinding)
    const accordionTriggers = screen.getAllByRole('button', { expanded: false })
    fireEvent.click(accordionTriggers[1])

    const evidenceButton = screen.getByRole('button', { name: /Ver Evidencia Técnica \(1\)/i })
    expect(evidenceButton.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(evidenceButton)
    expect(evidenceButton.getAttribute('aria-expanded')).toBe('true')
  })
})
