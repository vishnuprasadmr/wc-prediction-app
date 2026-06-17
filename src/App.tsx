import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { PrizesRoute } from './components/PrizesRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FixturesPage } from './pages/FixturesPage'
import { PredictPage } from './pages/PredictPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { GroupsPage } from './pages/GroupsPage'
import { ResultsPage } from './pages/ResultsPage'
import { TeamsPage } from './pages/TeamsPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'
import { WidgetPage } from './pages/WidgetPage'
import { PrizesPage } from './pages/PrizesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="widget" element={<WidgetPage />} />
        <Route element={<Layout />}>
          <Route index element={<FixturesPage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route
            path="prizes"
            element={
              <PrizesRoute>
                <PrizesPage />
              </PrizesRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
