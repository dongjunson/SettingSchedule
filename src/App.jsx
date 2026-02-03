import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import AdminInviteUserPage from './pages/AdminInviteUserPage';
import AdminNewProjectPage from './pages/AdminNewProjectPage';
import AdminProjectManagePage from './pages/AdminProjectManagePage';
import ChecklistPage from './pages/ChecklistPage';
import CompletedProjectsPage from './pages/CompletedProjectsPage';
import IncomeStatementManagePage from './pages/IncomeStatementManagePage';
import IncomeStatementPage from './pages/IncomeStatementPage';
import LoginPage from './pages/LoginPage';
import SetPasswordPage from './pages/SetPasswordPage';
import SiteSelection from './pages/SiteSelection';
import TimelinePage from './pages/TimelinePage';
import { useUserStore } from './lib/userStore';
import { supabase } from './lib/supabase';

// 초대 링크 감지 및 리다이렉트 컴포넌트
function InviteHandler({ children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkInvite = async () => {
      // URL hash에서 type=invite 또는 type=recovery 감지
      const hash = window.location.hash;
      if (hash.includes('type=invite') || hash.includes('type=recovery')) {
        // Supabase가 hash에서 세션을 자동으로 처리하도록 잠시 대기
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // 세션이 있으면 비밀번호 설정 페이지로 이동
          navigate('/set-password', { replace: true });
        }
      }
      setChecking(false);
    };

    // Supabase Auth 이벤트 리스너 - 초대/복구 토큰 처리 후 세션 생성 시
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        const hash = window.location.hash;
        if (hash.includes('type=invite') || hash.includes('type=recovery')) {
          navigate('/set-password', { replace: true });
        }
      }
    });

    checkInvite();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return null; // 또는 로딩 스피너
  }

  return children;
}

function App() {
  useEffect(() => {
    useUserStore.getState().restoreSession();
  }, []);

  return (
    <Router>
      <InviteHandler>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
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
          <Route path="admin/invite-user" element={<AdminInviteUserPage />} />
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
      </InviteHandler>
    </Router>
  );
}

export default App;
