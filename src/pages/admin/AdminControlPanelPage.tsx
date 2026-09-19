import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { apiService, ApiError } from '../../services/apiService';
import { useUser } from '../../context/UserContext';

export function AdminControlPanelPage() {
  usePageTitle('Administración');
  const { logout } = useUser();

  const [users, setUsers] = useState({ confirmed: 0, unconfirmed: 0, banned: 0 });
  const [files, setFiles] = useState({ total: 0, new: 0 });

  useEffect(() => {
    apiService
      .get<{
        message: string;
        users: { confirmed: number; unconfirmed: number; banned: number };
        files: { total: number; new: number };
      }>('admin/control-panel')
      .then((response) => {
        setUsers({
          confirmed: response.users?.confirmed ?? 0,
          unconfirmed: response.users?.unconfirmed ?? 0,
          banned: response.users?.banned ?? 0,
        });
        setFiles({ total: response.files?.total ?? 0, new: response.files?.new ?? 0 });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) logout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-content">
      <div className="actions-wrapper">
        <div className="section">
          <h2 className="section-title">Configuraciones Generales</h2>
          <div className="actions" role="list" aria-label="Configuraciones generales">
            <Link to="/admin/users" role="listitem" className="action-button">
              <span>Gestión de usuarios</span>
              <span className="action-button-badges">
                <span className="badge badge-success">{users.confirmed}</span>
                <span className="badge badge-warning">{users.unconfirmed}</span>
                <span className="badge badge-danger">{users.banned}</span>
              </span>
            </Link>

            <Link to="/admin/server-settings" role="listitem" className="action-button">
              <span>Configuraciones del servidor</span>
            </Link>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Configuraciones de Juego</h2>
          <div className="actions" role="list" aria-label="Configuraciones de juego">
            <Link to="/admin/game-systems" role="listitem" className="action-button">
              <span>Sistemas de juego</span>
            </Link>

            <Link to="/admin/game-types" role="listitem" className="action-button">
              <span>Tipos de partida</span>
            </Link>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Logs del servidor</h2>
          <div className="actions" role="list" aria-label="Logs">
            <Link to="/admin/upload-files-log" role="listitem" className="action-button">
              <span>Subidas de ficheros</span>
              <span className="action-button-badges">
                <span className="badge badge-neutral">{files.total}</span>
                {files.new > 0 && <span className="badge badge-warning">{files.new}</span>}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
