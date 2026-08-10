// src/services/snapshots/snapshots.service.ts
import apiClient from '@services/api/apiClient'

const BASE_URL = '/api/v1/snapshots'

export interface SnapshotEvidenceItem {
  _id: string
  evaluationId: string
  iteration: number
  url: string
  actionExecuted?: string
  screenshotPath?: string
  screenshotUrl?: string
  timestamp: string
  headings?: Array<{ level: number; text: string; selector: string }>
  images?: Array<{ src: string; alt: string | null; role: string | null; selector: string }>
  links?: Array<{ href: string; text: string; ariaLabel: string | null; selector: string }>
  buttons?: Array<{ text: string; ariaLabel: string | null; disabled: boolean; selector: string }>
  forms?: Array<{ id: string | null; name: string | null; action: string | null }>
  landmarks?: Array<{ role: string; ariaLabel: string | null; selector: string }>
}

export interface SnapshotsResponse {
  status: 'success'
  data: SnapshotEvidenceItem[]
}

class SnapshotsService {
  /** GET /api/v1/snapshots/evaluation/:evaluationId */
  async getByEvaluationId(evaluationId: string): Promise<SnapshotEvidenceItem[]> {
    const { data } = await apiClient.get<SnapshotsResponse>(
      `${BASE_URL}/evaluation/${evaluationId}`,
    )
    return data.data
  }
}

export const snapshotsService = new SnapshotsService()
