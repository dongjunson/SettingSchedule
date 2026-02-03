import { Navigate } from 'react-router-dom';
import { useUserStore } from '../lib/userStore';

export default function AdminRoute({ children }) {
  const currentUser = useUserStore((state) => state.currentUser);
  const isLoggedIn = currentUser !== null;
  const isAdmin = currentUser?.group === '관리자';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
