import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import AdminNewProjectPage from './pages/AdminNewProjectPage';
import AdminProjectManagePage from './pages/AdminProjectManagePage';
import ChecklistPage from './pages/ChecklistPage';
import CompletedProjectsPage from './pages/CompletedProjectsPage';
import IncomeStatementManagePage from './pages/IncomeStatementManagePage';
import IncomeStatementPage from './pages/IncomeStatementPage';
import LoginPage from './pages/LoginPage';
import SiteSelection from './pages/SiteSelection';
import TimelinePage from './pages/TimelinePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SiteSelection />} />
          <Route
            path="income-statement"
            element={
              <AdminRoute>
                <IncomeStatementPage />
              </AdminRoute>
            }
          />
          <Route
            path="income-statement/manage"
            element={
              <AdminRoute>
                <IncomeStatementManagePage />
              </AdminRoute>
            }
          />
          <Route path="completed-projects" element={<CompletedProjectsPage />} />
          <Route path="admin/new-project" element={<AdminNewProjectPage />} />
          <Route path="admin/projects" element={<AdminProjectManagePage />} />
          <Route path="admin/hidden-projects" element={<AdminProjectManagePage />} />
        </Route>
        <Route
          path="/site/:siteId"
          element={
            <ProtectedRoute>
              <TimelinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site/:siteId/checklist"
          element={
            <ProtectedRoute>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
