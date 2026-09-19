import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Palette,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { logoInstagram, logoWhatsapp } from 'ionicons/icons';
import { useUser } from '../context/UserContext';
import { useTheme, themeOptions, type ThemeMode } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { environment } from '../config/environment';
import { KofiSupportCard } from './KofiSupportCard';

function getThemeIcon(theme: ThemeMode) {
  if (theme === 'light') return Sun;
  if (theme === 'dark') return Moon;
  return Smartphone;
}

export function AppMenu({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenSettings,
  onOpenWhatsappQr,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
  onOpenWhatsappQr: (link: string) => void;
}) {
  const { users, activeUid, setActiveUser, logout, isLoggedIn } = useUser();
  const { currentTheme, setTheme } = useTheme();
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [kofiLink, setKofiLink] = useState<string | null>(null);
  const [instagramLink, setInstagramLink] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    apiService
      .get<{
        message: string;
        social_links?: { social_link_instagram?: string; social_link_whatsapp?: string; social_link_kofi?: string };
      }>('social-links')
      .then((response) => {
        setKofiLink(response.social_links?.social_link_kofi ?? null);
        setInstagramLink(response.social_links?.social_link_instagram ?? null);
        setWhatsappLink(response.social_links?.social_link_whatsapp ?? null);
      })
      .catch(() => {
        setKofiLink(null);
        setInstagramLink(null);
        setWhatsappLink(null);
      });
  }, []);

  return (
    <>
      <div className={`app-menu-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <nav className={`app-menu${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>
        <div className="menu-header">
          <h1 className="main-title">{environment.appName}</h1>
        </div>

        <div className="menu-content">
          <div className="menu-block" role="list" aria-label="Usuarios">
            {users.length > 0 ? (
              <>
                {users.map((user) => (
                  <div
                    key={user.uid}
                    role="button"
                    tabIndex={0}
                    className={`menu-badge${user.uid === activeUid ? ' menu-badge-active' : ''}`}
                    aria-pressed={user.uid === activeUid}
                    onClick={() => setActiveUser(user.uid)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveUser(user.uid);
                      }
                    }}
                  >
                    <span className="menu-badge-main">
                      {user.avatar ? (
                        <img className="menu-badge-avatar" src={user.avatar} alt={`Avatar de ${user.name}`} />
                      ) : (
                        <span className="menu-badge-avatar" aria-hidden="true">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="menu-badge-name">{user.name}</span>
                      <span className="menu-badge-roles">
                        {user.roles.includes('vip') && (
                          <Star className="user-role-icon user-role-icon-vip" aria-label="VIP" />
                        )}
                        {user.roles.includes('master') && (
                          <Compass className="user-role-icon user-role-icon-master" aria-label="Master" />
                        )}
                        {user.roles.includes('admin') && (
                          <ShieldCheck className="user-role-icon user-role-icon-admin" aria-label="Admin" />
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="menu-badge-logout"
                      aria-label={`Cerrar sesión de ${user.name}`}
                      title="Cerrar sesión"
                      onClick={(event) => {
                        event.stopPropagation();
                        logout(user.uid);
                      }}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button type="button" role="listitem" className="menu-badge menu-badge-add" onClick={onOpenLogin}>
                  <span className="menu-badge-main">
                    <span className="menu-badge-avatar menu-badge-avatar-action" aria-hidden="true"><Plus size={18} /></span>
                    <span className="menu-badge-name">Añadir usuario</span>
                  </span>
                </button>
              </>
            ) : (
              <button type="button" className="menu-badge menu-badge-add" onClick={onOpenLogin}>
                <span className="menu-badge-main">
                  <span className="menu-badge-avatar menu-badge-avatar-action" aria-hidden="true"><Plus size={18} /></span>
                  <span className="menu-badge-name">Iniciar sesión</span>
                </span>
              </button>
            )}
          </div>

          <div className="menu-block" role="list" aria-label="Navegacion">
            <Link to="/all-characters" className="menu-badge" role="listitem" onClick={onClose}>
              <span className="menu-badge-main">
                <span className="menu-badge-name">Todos los personajes</span>
              </span>
            </Link>
            <Link to="/resources" className="menu-badge" role="listitem" onClick={onClose}>
              <span className="menu-badge-main">
                <span className="menu-badge-name">Recursos</span>
              </span>
            </Link>
          </div>

          <div className="menu-block" role="list" aria-label="Configuración">
            {isLoggedIn && (
              <button
                type="button"
                role="listitem"
                className="menu-badge"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                <span className="menu-badge-main">
                  <span className="menu-badge-avatar menu-badge-avatar-action" aria-hidden="true"><Settings size={17} /></span>
                  <span className="menu-badge-name">Configuración</span>
                </span>
              </button>
            )}

            <button type="button" role="listitem" className="menu-badge" onClick={() => setIsThemeSheetOpen(true)}>
              <span className="menu-badge-main">
                <span className="menu-badge-avatar menu-badge-avatar-action" aria-hidden="true"><Palette size={17} /></span>
                <span className="menu-badge-name">Apariencia</span>
              </span>
            </button>
          </div>
        </div>

        <div className="menu-footer">
          {(whatsappLink || instagramLink) && (
            <span className="menu-footer-social-icons">
              {instagramLink && (
                <a
                  className="menu-footer-social-link"
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <img className="brand-icon" src={logoInstagram} alt="" aria-hidden="true" />
                </a>
              )}
              {whatsappLink && (
                <button
                  type="button"
                  className="menu-footer-social-link"
                  onClick={() => onOpenWhatsappQr(whatsappLink)}
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <img className="brand-icon" src={logoWhatsapp} alt="" aria-hidden="true" />
                </button>
              )}
            </span>
          )}

          {kofiLink && <KofiSupportCard kofiLink={kofiLink} />}
        </div>
      </nav>

      {isThemeSheetOpen && (
        <div className="modal-backdrop" onClick={() => setIsThemeSheetOpen(false)}>
          <div className="modal-panel action-sheet-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-body">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  className={`action-sheet-btn${theme.value === currentTheme ? ' active-theme' : ''}`}
                  onClick={() => {
                    setTheme(theme.value);
                    setIsThemeSheetOpen(false);
                  }}
                >
                  {(() => {
                    const ThemeIcon = getThemeIcon(theme.value);
                    return <ThemeIcon size={18} aria-hidden="true" />;
                  })()}
                  {theme.label}
                </button>
              ))}
              <button type="button" className="action-sheet-btn action-sheet-cancel" onClick={() => setIsThemeSheetOpen(false)}>
                <X size={18} aria-hidden="true" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
