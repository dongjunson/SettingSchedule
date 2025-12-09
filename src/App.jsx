import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SiteSelection from './pages/SiteSelection'
import TimelinePage from './pages/TimelinePage'
import ChecklistPage from './pages/ChecklistPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SiteSelection />} />
        <Route path="/site/:siteId" element={<TimelinePage />} />
        <Route path="/site/:siteId/checklist" element={<ChecklistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
