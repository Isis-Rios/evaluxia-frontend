// src/routes/PrivateRoute.tsx
import type { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@app/store'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * PrivateRoute — Guarda de ruta para rutas privadas.
 *
 * Lee `isAuthenticated` del store (hidratado por redux-persist en boot).
 * Preserva la ruta de origen en el estado de navegación para poder
 * redirigir al usuario de vuelta tras el login (preparado para iteración futura).
 */
export default function PrivateRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )
  const location = useLocation()

  if (!isAuthenticated) {
    // Guardamos la ruta intentada para redirigir post-login en iteraciones futuras
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
