// src/routes/index.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@pages/Login/LoginPage'
import HomePage from '@pages/Home/HomePage'
import HistoryPage from '@pages/History/HistoryPage'
import PublicLayout from '@layouts/PublicLayout'
import AdminPanelLayout from '@layouts/AdminPanelLayout'
import PrivateRoute from './PrivateRoute'

// Evaluator Profiles
import UserEvaluatorProfilesPage from '@pages/UserEvaluatorProfiles/UserEvaluatorProfilesPage'
import UserEvaluatorProfileFormPage from '@pages/UserEvaluatorProfiles/UserEvaluatorProfileFormPage'

// Evaluations
import EvaluateWebPage from '@pages/Evaluations/EvaluateWebPage'
import EvaluatePrototypePage from '@pages/Evaluations/EvaluatePrototypePage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Rutas públicas ── */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Route>

      {/* ── Rutas privadas ── */}
      <Route element={<PrivateRoute><AdminPanelLayout /></PrivateRoute>}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/historial" element={<HistoryPage />} />

        {/* Perfiles evaluadores */}
        <Route path="/perfiles" element={<UserEvaluatorProfilesPage />} />
        <Route path="/perfiles/nuevo" element={<UserEvaluatorProfileFormPage />} />
        <Route path="/perfiles/:id/editar" element={<UserEvaluatorProfileFormPage />} />

        {/* Evaluaciones */}
        <Route path="/evaluate/web" element={<EvaluateWebPage />} />
        <Route path="/evaluate/prototype" element={<EvaluatePrototypePage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
