import type { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@app/store'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  return isAuthenticated ? children : <Navigate to="/login" />
}
