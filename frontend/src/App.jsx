import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import CampaignBuilder from './pages/CampaignBuilder'
import Users from './pages/Users'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import DepartmentAnalytics from './pages/DepartmentAnalytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Training from './pages/Training'
import PhishingLanding from './pages/PhishingLanding'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-mono">Initializing PhishGuard...</p>
      </div>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/training" element={<Training />} />
      <Route path="/phishing-landing" element={<PhishingLanding />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<CampaignBuilder />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="templates" element={<Templates />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="departments" element={<DepartmentAnalytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
