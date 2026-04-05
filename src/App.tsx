import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { MaterialsLibrary } from './components/materials/MaterialsLibrary'
import { AssignmentGrid } from './components/assignments/AssignmentGrid'
import { ChatChannel } from './components/chat/ChatChannel'
import { PipelineTracker } from './components/progress/PipelineTracker'
import { DailySchedule } from './components/schedule/DailySchedule'
import { AnnouncementsList } from './components/announcements/AnnouncementsList'
import { UserManagement } from './components/users/UserManagement'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materials" element={<MaterialsLibrary />} />
              <Route path="/assignments" element={<AssignmentGrid />} />
              <Route path="/chat" element={<ChatChannel />} />
              <Route path="/progress" element={<PipelineTracker />} />
              <Route path="/schedule" element={<DailySchedule />} />
              <Route path="/announcements" element={<AnnouncementsList />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      </AuthProvider>
    </Router>
  )
}

export default App