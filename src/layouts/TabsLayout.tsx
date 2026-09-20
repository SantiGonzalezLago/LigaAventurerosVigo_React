import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, LogIn, ShieldCheck, UserCircle, Menu as MenuIcon, ChevronLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usePageHeader } from '../context/PageHeaderContext';
import { environment } from '../config/environment';

export function TabsLayout({ onOpenMenu, onOpenLogin }: { onOpenMenu: () => void; onOpenLogin: () => void }) {
  const { hasMasterAccess, hasAdminAccess, isLoggedIn, activeUser } = useUser();
  const { title, showBackButton } = usePageHeader();
  const location = useLocation();
  const navigate = useNavigate();

  const avatar = activeUser?.avatar?.trim() || null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-toolbar">
          <button type="button" className="icon-button" aria-label="Abrir menú" onClick={onOpenMenu}>
            <MenuIcon size={22} />
          </button>
          {showBackButton && (
            // Navigates back in browser history instead of a fixed route, since a page may be reached from multiple places.
            <button type="button" className="back-button" aria-label="Volver" onClick={() => navigate(-1)}>
              <ChevronLeft size={22} />
            </button>
          )}
          <span className="toolbar-title">{title ?? environment.appName}</span>
          <span style={{ width: 40 }} />
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet key={location.pathname} />
      </main>

      <nav className="tab-bar" id="main-tab-bar">
        <NavLink to="/" end className={({ isActive }) => `tab-button${isActive ? ' active' : ''}`}>
          <Home />
          <span>Inicio</span>
        </NavLink>

        {hasMasterAccess && (
          <NavLink to="/master" className={({ isActive }) => `tab-button${isActive ? ' active' : ''}`}>
            <Compass />
            <span>Master</span>
          </NavLink>
        )}

        {hasAdminAccess && (
          <NavLink to="/admin" className={({ isActive }) => `tab-button${isActive ? ' active' : ''}`}>
            <ShieldCheck />
            <span>Admin</span>
          </NavLink>
        )}

        {isLoggedIn ? (
          <NavLink to="/profile" className={({ isActive }) => `tab-button${isActive ? ' active' : ''}`}>
            {avatar ? (
              <span className="profile-tab-avatar" aria-hidden="true">
                <img src={avatar} alt="" />
              </span>
            ) : (
              <UserCircle />
            )}
            <span>Mi perfil</span>
          </NavLink>
        ) : (
          <button type="button" className="tab-button" onClick={onOpenLogin}>
            <LogIn />
            <span>Iniciar sesión</span>
          </button>
        )}
      </nav>
    </div>
  );
}
