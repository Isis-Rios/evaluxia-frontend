// src/types/evaluatorProfile.types.ts

/**
 * Perfil evaluador tal como lo retorna el backend.
 * Campos opcionales marcados con ? para compatibilidad con PATCH parcial.
 */
export interface EvaluatorProfile {
  _id: string
  userId: string
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
  goals: string[]
  frustrations: string[]
  techSavviness: 'low' | 'medium' | 'high'
  accessibilityNeeds: string[]
  preferredDevice: 'desktop' | 'mobile' | 'tablet'
  /** true si este perfil es el activo actualmente para el usuario */
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Respuesta del endpoint PATCH /api/v1/evaluator-profiles/:id/activate */
export interface ActivateProfileResponse {
  status: 'success'
  data: EvaluatorProfile
}

/** Body para POST /api/v1/evaluator-profiles */
export interface CreateEvaluatorProfileDto {
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
  goals: string[]
  frustrations: string[]
  techSavviness: 'low' | 'medium' | 'high'
  accessibilityNeeds: string[]
  preferredDevice: 'desktop' | 'mobile' | 'tablet'
}

/** Body para PATCH /api/v1/evaluator-profiles/:id */
export type UpdateEvaluatorProfileDto = Partial<CreateEvaluatorProfileDto>

/** Shape de la respuesta paginada del listado */
export interface EvaluatorProfilesListResponse {
  status: 'success'
  data: EvaluatorProfile[]
  total: number
  page: number
  limit: number
}

/** Shape de la respuesta de perfil individual */
export interface EvaluatorProfileResponse {
  status: 'success'
  data: EvaluatorProfile
}

/**
 * Valores del formulario — goals y frustrations se ingresan como texto plano
 * separado por líneas y se convierten a array antes de enviar al backend.
 */
export interface EvaluatorProfileFormValues {
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
  goals: string       // textarea → split por \n al enviar
  frustrations: string // textarea → split por \n al enviar
  techSavviness: 'low' | 'medium' | 'high'
  preferredDevice: 'desktop' | 'mobile' | 'tablet'
}
