import { Navigate } from 'react-router-dom';
import { useUserStore } from '../lib/userStore';

export default function ProtectedRoute({ children }) {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn());

  if (!isLoggedIn) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  return children;
}
