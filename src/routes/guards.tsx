import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export function RequireAdmin() {
  const { hasAdminAccess } = useUser();
  const location = useLocation();

  if (!hasAdminAccess) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RequireMaster() {
  const { hasMasterAccess } = useUser();
  const location = useLocation();

  if (!hasMasterAccess) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
