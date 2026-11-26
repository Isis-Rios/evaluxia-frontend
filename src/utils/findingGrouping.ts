// src/utils/findingGrouping.ts
import type {
  EvaluationType,
  Finding,
  FindingConfidence,
  FindingGroup,
  FindingSeverity,
  FindingStatus,
} from '@/types/evaluation.types'
import {
  extractCanonicalNielsenCode,
  extractCanonicalWcagCode,
  hasDualDomainCodes,
  isCrossDomainHeadingFinding,
  resolveFindingOrigin,
  type ResolvedFindingOrigin,
} from '@utils/criteriaCoverage'

/**
 * Utilidades puras y determinísticas para agrupar documentos `Finding` únicamente
 * en la capa de presentación del frontend.
 *
 * Garantías de integridad académica:
 * - Nunca modifica, fusiona ni elimina documentos originales en MongoDB.
 * - Cada documento `Finding` pertenece exactamente a un único `PresentationFindingGroup`.
 * - Nunca mezcla distintos `status`, `severity`, `origin`, `findingGroup`, `type`,
 *   criterios o recomendaciones distintas.
 * - Nunca fusiona observaciones narrativas de IA (`origin === 'ai'`), hallazgos con
 *   origen indeterminado (`origin === 'unknown'`) ni registros con `discrepancy`.
 * - Para `WCAG 1.4.3`, preserva diferencias de par de colores, ratio y umbral mínimo.
 */

export interface IterationCount {
  iteration: number
  count: number
}

export interface PresentationFindingGroup {
  /** Clave determinística estable del grupo */
  groupKey: string
  /** Documentos Finding originales intactos pertenecientes al grupo */
  findings: Finding[]
  /** Número exacto de documentos originales en este grupo */
  count: number
  /** `true` si agrupa > 1 instancia; `false` si es un hallazgo individual */
  isGrouped: boolean
  /** Etiqueta principal del criterio (WCAG o Heurística Nielsen) */
  primaryCriterionLabel: string
  /** Etiqueta secundaria cuando el hallazgo lleva simultáneamente WCAG y Nielsen */
  secondaryHeuristicLabel: string | null
  wcagCode: string | null
  nielsenCode: string | null
  status: FindingStatus
  severity: FindingSeverity
  findingGroup: FindingGroup
  type: string
  origin: ResolvedFindingOrigin
  /** Confianza compartida si todas las instancias coinciden; null si varía */
  sharedConfidence: FindingConfidence | null
  /** Descripción general legible del patrón (sin el selector puntual de una única instancia) */
  patternSummary: string
  /** Impacto compartido cuando todas las instancias poseen exactamente el mismo texto */
  sharedImpact: string | null
  /** Recomendación compartida cuando todas las instancias poseen exactamente el mismo texto */
  sharedRecommendation: string | null
  /** Resumen legible de evidencias comunes del patrón */
  commonEvidenceSummary: string[]
  /** Distribución exacta de instancias por iteración */
  iterationBreakdown: IterationCount[]
  hasDiscrepancy: boolean
  isCrossDomainH1: boolean
  isDualDomain: boolean
}

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

const STATUS_RANK: Record<FindingStatus, number> = {
  FAIL: 0,
  NOT_EVALUABLE: 1,
  PASS: 2,
}

/**
 * Formatea la etiqueta principal y secundaria del criterio de un hallazgo.
 */
export function buildFindingCriterionLabels(finding: Finding): {
  primaryLabel: string
  secondaryHeuristicLabel: string | null
} {
  const nielsenLabel =
    finding.heuristicCode && finding.heuristicName
      ? `${finding.heuristicCode} · ${finding.heuristicName}`
      : finding.heuristicName || finding.heuristicCode || finding.heuristic || null

  if (finding.wcagCriterion && nielsenLabel) {
    return {
      primaryLabel: finding.wcagCriterion,
      secondaryHeuristicLabel: nielsenLabel,
    }
  }

  return {
    primaryLabel: finding.wcagCriterion || nielsenLabel || 'Criterio General',
    secondaryHeuristicLabel: null,
  }
}

/**
 * Extrae una firma de evidencia determinística preservando diferencias
 * técnicamente relevantes (en particular, en WCAG 1.4.3 preserva colores,
 * ratio exacto y umbral requerido; en WCAG 2.4.4 preserva propiedades
 * estructurales y si el texto accesible está vacío o presente).
 */
function buildEvidenceSignature(finding: Finding, wcagCode: string | null): string {
  const evidence = finding.evidence || []
  if (evidence.length === 0) return 'NO_EVIDENCE'

  if (wcagCode === 'WCAG 1.4.3') {
    const contrastEv = evidence.find((e) => e.type === 'COMPUTED_STYLE' && e.property === 'contrastRatio') || evidence[0]
    const ratioVal = (contrastEv.value ?? '').trim()
    const threshold = (contrastEv.measurement ?? '').trim()
    // Preserva color y backgroundColor exactos; normaliza únicamente fontSize si el umbral requerido ya es idéntico
    const colorPair = (contrastEv.context ?? '')
      .replace(/,?\s*fontSize:\s*[^,]+/i, '')
      .trim()
    const related = contrastEv.relatedValue
      ? `${contrastEv.relatedValue.property ?? ''}=${contrastEv.relatedValue.value ?? ''}`
      : ''
    return `1.4.3|ratio=${ratioVal}|threshold=${threshold}|colors=${colorPair}|rel=${related}`
  }

  if (wcagCode === 'WCAG 2.4.4') {
    // Distingue claramente enlaces sin texto ("") frente a enlaces con texto presente, sin fragmentar por href único
    const props = evidence
      .map((e) => {
        const prop = e.property ?? e.attribute ?? ''
        if (prop === 'text' || prop === 'ariaLabel') {
          const isEmpty = !(e.value ?? '').trim()
          return `${e.type}:${prop}:${isEmpty ? 'EMPTY' : 'NON_EMPTY'}`
        }
        return `${e.type}:${prop}`
      })
      .sort()
      .join(',')
    return `2.4.4|${props}`
  }

  // Resto de reglas determinísticas (1.1.1, 3.3.2, 4.1.2, 1.3.1 h1_count:0)
  return evidence
    .map((e) => {
      const prop = e.property ?? e.attribute ?? ''
      if (e.type === 'HEADING_STRUCTURE') {
        return `${e.type}:${prop}:${(e.value ?? '').trim()}`
      }
      if (prop === 'alt' || prop === 'ariaLabel' || prop === 'label' || prop === 'text') {
        const val = (e.value ?? '').trim()
        const state = !val || val === 'null' ? 'MISSING' : 'PRESENT'
        return `${e.type}:${prop}:${state}`
      }
      return `${e.type}:${prop}`
    })
    .sort()
    .join(',')
}

/**
 * Normaliza únicamente los fragmentos ligados a una instancia concreta del DOM
 * (selector CSS y texto/alt literal entre comillas), conservando intactos los
 * valores de contraste, colores, umbrales y semántica del fallo.
 */
function normalizeDeterministicDescription(finding: Finding, wcagCode: string | null): string {
  let desc = (finding.description || '').replace(/\s+/g, ' ').trim()
  const selector = finding.affectedElement?.selector?.trim()
  if (selector) {
    desc = desc.split(selector).join('<selector>')
  }

  // En WCAG 2.4.4 y WCAG 1.1.1 (sobre todo en PASS), la descripción incluye el texto o atributo alt literal entre comillas
  if (wcagCode === 'WCAG 2.4.4' || wcagCode === 'WCAG 1.1.1' || wcagCode === 'WCAG 4.1.2' || wcagCode === 'WCAG 3.3.2') {
    desc = desc.replace(/""[^"]*"[^"]*"/g, '"<texto>"')
    desc = desc.replace(/"[^"]+"/g, '"<texto>"')
  }

  return desc
}

/**
 * Construye una clave determinística para agrupar hallazgos únicamente en capa
 * de presentación. Garantiza que:
 * - Hallazgos de IA (`ai`), de origen indeterminado (`unknown`) o con `discrepancy`
 *   nunca se fusionan entre sí.
 * - Hallazgos determinísticos solo se agrupan si comparten exactamente criterio,
 *   estado, severidad, grupo, tipo, origen, plantilla descriptiva, recomendación
 *   y firma de evidencia relevante.
 */
export function buildFindingGroupKey(
  finding: Finding,
  evaluationType: EvaluationType = 'website',
  fallbackIndex = 0,
): string {
  const origin = resolveFindingOrigin(finding, evaluationType)
  const uniqueId = finding._id || finding.id || `idx-${fallbackIndex}`

  // Nunca agrupar observaciones de IA, registros de origen indeterminado ni hallazgos con discrepancia
  if (origin === 'ai') {
    return `AI_SINGLE::${uniqueId}`
  }
  if (origin === 'unknown') {
    return `UNKNOWN_SINGLE::${uniqueId}`
  }
  if (finding.discrepancy) {
    return `DISCREPANCY_SINGLE::${uniqueId}`
  }

  const wcagCode = extractCanonicalWcagCode(finding.wcagCriterion) ?? ''
  const nielsenCode = extractCanonicalNielsenCode(finding.heuristicCode) ?? ''
  const status = finding.status || 'FAIL'
  const severity = finding.severity || 'info'
  const group = finding.findingGroup || 'accessibility'
  const type = finding.type || ''
  const descTemplate = normalizeDeterministicDescription(finding, wcagCode || null)
  const recommendation = (finding.recommendation || '').replace(/\s+/g, ' ').trim()
  const evidenceSig = buildEvidenceSignature(finding, wcagCode || null)

  return [
    'DET_GROUP',
    wcagCode,
    nielsenCode,
    status,
    severity,
    group,
    type,
    origin,
    descTemplate,
    recommendation,
    evidenceSig,
  ].join('||')
}

function buildPatternSummary(findings: Finding[], wcagCode: string | null): string {
  const first = findings[0]
  if (findings.length === 1) {
    return first.description
  }

  let template = normalizeDeterministicDescription(first, wcagCode)
  // Convertir marcadores técnicos en redacción clara para el usuario final
  template = template
    .replace(/en <selector>\s*/gi, '')
    .replace(/:\s*"<texto>"\.?$/i, '.')
    .replace(/"<texto>"/g, 'texto descriptivo')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return template
}

function buildCommonEvidenceSummary(findings: Finding[], wcagCode: string | null): string[] {
  if (findings.length <= 1) return []
  const items: string[] = []

  if (wcagCode === 'WCAG 1.4.3') {
    const firstEv = findings[0].evidence?.find((e) => e.type === 'COMPUTED_STYLE') || findings[0].evidence?.[0]
    if (firstEv?.value) {
      items.push(
        `Relación de contraste medida: ${firstEv.value}${firstEv.measurement ? ` (${firstEv.measurement})` : ''}.`,
      )
    }
    if (firstEv?.context) {
      const colorInfo = firstEv.context.replace(/,?\s*fontSize:\s*[^,]+/i, '').trim()
      if (colorInfo) {
        items.push(`Combinación de colores detectada: ${colorInfo}.`)
      }
    }
    const fontSizes = Array.from(
      new Set(
        findings
          .map((f) => f.evidence?.[0]?.context?.match(/fontSize:\s*([^,]+)/i)?.[1]?.trim())
          .filter((v): v is string => Boolean(v)),
      ),
    )
    if (fontSizes.length > 0) {
      items.push(`Tamaños de fuente afectados: ${fontSizes.join(', ')}.`)
    }
    return items
  }

  if (wcagCode === 'WCAG 2.4.4') {
    const hrefCounts = new Map<string, number>()
    for (const f of findings) {
      const href =
        f.affectedElement?.href ||
        f.evidence?.find((e) => e.property === 'href')?.value
      if (href) {
        hrefCounts.set(href, (hrefCounts.get(href) || 0) + 1)
      }
    }
    if (hrefCounts.size > 0) {
      const topHrefs = Array.from(hrefCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([href, cnt]) => `${href} (${cnt})`)
      items.push(
        `Destinos (href) más frecuentes (${hrefCounts.size} destino${hrefCounts.size === 1 ? '' : 's'} distinto${hrefCounts.size === 1 ? '' : 's'}): ${topHrefs.join(' · ')}.`,
      )
    }
    if (findings[0].status === 'FAIL') {
      items.push('Evidencia común: atributos DOM `href` presente y texto accesible / `aria-label` vacío.')
    }
    return items
  }

  if (wcagCode === 'WCAG 1.1.1') {
    items.push(
      findings[0].status === 'PASS'
        ? 'Evidencia común: atributo DOM `alt` descriptivo presente en todas las imágenes del grupo.'
        : 'Evidencia común: atributo DOM `alt` ausente o vacío en imágenes informativas.',
    )
    return items
  }

  // Genérico para otras reglas determinísticas
  const evTypes = Array.from(
    new Set(findings.flatMap((f) => (f.evidence || []).map((e) => `${e.type}${e.property ? `:${e.property}` : ''}`))),
  ).slice(0, 4)
  if (evTypes.length > 0) {
    items.push(`Propiedades de evidencia comunes: ${evTypes.join(', ')}.`)
  }
  return items
}

/**
 * Ordena hallazgos individuales de forma determinística: severidad (Crítico -> Info),
 * estado (FAIL -> NOT_EVALUABLE -> PASS), iteración ascendente, criterio y `_id`.
 */
export function sortFindingsDeterministically(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const sevDiff = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99)
    if (sevDiff !== 0) return sevDiff

    const statusDiff = (STATUS_RANK[a.status || 'FAIL'] ?? 99) - (STATUS_RANK[b.status || 'FAIL'] ?? 99)
    if (statusDiff !== 0) return statusDiff

    const iterDiff = (a.iteration || 1) - (b.iteration || 1)
    if (iterDiff !== 0) return iterDiff

    const critA = a.wcagCriterion || a.heuristicCode || ''
    const critB = b.wcagCriterion || b.heuristicCode || ''
    const critDiff = critA.localeCompare(critB, 'es')
    if (critDiff !== 0) return critDiff

    const selA = a.affectedElement?.selector || a.affectedElement?.visualReference?.description || ''
    const selB = b.affectedElement?.selector || b.affectedElement?.visualReference?.description || ''
    const selDiff = selA.localeCompare(selB, 'es')
    if (selDiff !== 0) return selDiff

    return (a._id || a.id || '').localeCompare(b._id || b.id || '')
  })
}

/**
 * Agrupa un conjunto de documentos `Finding` únicamente para presentación,
 * preservando el 100 % de los registros originales y ordenando los grupos de
 * manera determinística por severidad, estado, volumen de instancias y criterio.
 */
export function groupFindingsForPresentation(
  findings: Finding[],
  evaluationType: EvaluationType = 'website',
): PresentationFindingGroup[] {
  if (findings.length === 0) return []

  const buckets = new Map<string, Finding[]>()
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i]
    const key = buildFindingGroupKey(f, evaluationType, i)
    const list = buckets.get(key)
    if (list) {
      list.push(f)
    } else {
      buckets.set(key, [f])
    }
  }

  const groups: PresentationFindingGroup[] = []

  for (const [groupKey, rawItems] of buckets.entries()) {
    const items = sortFindingsDeterministically(rawItems)
    const first = items[0]
    const origin = resolveFindingOrigin(first, evaluationType)
    const wcagCode = extractCanonicalWcagCode(first.wcagCriterion)
    const nielsenCode = extractCanonicalNielsenCode(first.heuristicCode)
    const { primaryLabel, secondaryHeuristicLabel } = buildFindingCriterionLabels(first)

    // Distribución por iteración
    const iterMap = new Map<number, number>()
    for (const item of items) {
      const iter = item.iteration || 1
      iterMap.set(iter, (iterMap.get(iter) || 0) + 1)
    }
    const iterationBreakdown: IterationCount[] = Array.from(iterMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([iteration, count]) => ({ iteration, count }))

    // Campos compartidos solo si son equivalentes en todas las instancias
    const impacts = new Set(items.map((f) => (f.impact || '').trim()))
    const sharedImpact = impacts.size === 1 && first.impact?.trim() ? first.impact.trim() : null

    const recs = new Set(items.map((f) => (f.recommendation || '').trim()))
    const sharedRecommendation = recs.size === 1 && first.recommendation?.trim() ? first.recommendation.trim() : null

    const confs = new Set(items.map((f) => f.confidence))
    const sharedConfidence = confs.size === 1 ? first.confidence : null

    groups.push({
      groupKey,
      findings: items,
      count: items.length,
      isGrouped: items.length > 1,
      primaryCriterionLabel: primaryLabel,
      secondaryHeuristicLabel,
      wcagCode,
      nielsenCode,
      status: first.status || 'FAIL',
      severity: first.severity || 'info',
      findingGroup: first.findingGroup,
      type: first.type || '',
      origin,
      sharedConfidence,
      patternSummary: buildPatternSummary(items, wcagCode),
      sharedImpact,
      sharedRecommendation,
      commonEvidenceSummary: buildCommonEvidenceSummary(items, wcagCode),
      iterationBreakdown,
      hasDiscrepancy: Boolean(first.discrepancy),
      isCrossDomainH1: isCrossDomainHeadingFinding(first),
      isDualDomain: hasDualDomainCodes(first),
    })
  }

  // Orden determinístico: severidad (Crítico -> Info), estado (FAIL -> NE -> PASS),
  // mayor número de instancias primero, luego criterio y clave estable
  return groups.sort((a, b) => {
    const sevDiff = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99)
    if (sevDiff !== 0) return sevDiff

    const statusDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff

    const countDiff = b.count - a.count
    if (countDiff !== 0) return countDiff

    const critDiff = a.primaryCriterionLabel.localeCompare(b.primaryCriterionLabel, 'es')
    if (critDiff !== 0) return critDiff

    return a.groupKey.localeCompare(b.groupKey)
  })
}
