import { useEffect, useState } from 'react';
import { AlertCircle, Star } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Loader } from '../../../components/Loader';
import { apiService, ApiError } from '../../../services/apiService';
import { useUser } from '../../../context/UserContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';

type Ban = {
  id: number;
  date_start: string;
  date_end: string | null;
  permanent: boolean;
  reason: string | null;
  active: boolean;
  banned_by_name?: string | null;
};

type UserDetail = {
  uid: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  banned: boolean;
  date_created: string;
  roles: string[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-ES');
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function UserDetailModal({
  uid,
  onClose,
  onUserRoleChange,
}: {
  uid: string | null;
  onClose: () => void;
  onUserRoleChange: (update: { uid: string; roles?: string[]; banned?: boolean }) => void;
}) {
  const { activeUid, loginAdmin, logout } = useUser();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [bans, setBans] = useState<Ban[]>([]);
  const [togglingVip, setTogglingVip] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [creatingBan, setCreatingBan] = useState(false);
  const [unbanning, setUnbanning] = useState(false);
  const [banPermanent, setBanPermanent] = useState(true);
  const [banDateEnd, setBanDateEnd] = useState('');
  const [banReason, setBanReason] = useState('');

  const isRequestedUserActive = uid === activeUid;

  useEffect(() => {
    if (!uid) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    setBanPermanent(true);
    setBanDateEnd('');
    setBanReason('');

    apiService
      .get<{ user: UserDetail; bans: Ban[] }>(`admin/user/${encodeURIComponent(uid)}`)
      .then((response) => {
        setUser({ ...response.user, roles: Array.isArray(response.user.roles) ? response.user.roles : [] });
        setBans(Array.isArray(response.bans) ? response.bans : []);
      })
      .catch((error) => {
        showToast(error instanceof ApiError ? error.message : 'Error inesperado al cargar el usuario', 'danger');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const hasRole = (role: 'vip' | 'admin' | 'master') => (user?.roles ?? []).includes(role);

  const reload = async () => {
    if (!uid) return;
    const response = await apiService.get<{ user: UserDetail; bans: Ban[] }>(`admin/user/${encodeURIComponent(uid)}`);
    setUser({ ...response.user, roles: response.user.roles ?? [] });
    setBans(response.bans ?? []);
  };

  const toggleRole = async (role: 'vip' | 'admin' | 'master') => {
    if (!user || !uid) return;
    const setters = { vip: setTogglingVip, admin: setTogglingAdmin, master: setTogglingMaster };
    const endpoints = { vip: 'admin/toggle-vip', admin: 'admin/toggle-admin', master: 'admin/toggle-master' };
    const setToggling = setters[role];

    setToggling(true);
    try {
      const response = await apiService.post<{ uid: string; roles: string[] }>(endpoints[role], {
        uid,
        state: hasRole(role) ? 0 : 1,
      });
      setUser({ ...user, roles: response.roles ?? [] });
      onUserRoleChange({ uid: response.uid || uid, roles: response.roles });
      showToast('Permisos actualizados', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      showToast(error instanceof ApiError ? error.message : 'No se pudo actualizar el rol', 'danger');
    } finally {
      setToggling(false);
    }
  };

  const impersonate = async () => {
    if (!uid || isRequestedUserActive) return;
    const result = await loginAdmin(uid);
    if (result.success) {
      onClose();
      return;
    }
    showToast(result.message ?? 'No se pudo suplantar el usuario', 'danger');
  };

  const createBan = async () => {
    if (!user || !uid || creatingBan || isRequestedUserActive || user.banned) return;
    const reason = banReason.trim();
    if (!reason) {
      showToast('Debes indicar un motivo para el ban', 'danger');
      return;
    }
    if (!banPermanent && !banDateEnd) {
      showToast('Debes indicar una fecha fin para un ban temporal', 'danger');
      return;
    }

    setCreatingBan(true);
    try {
      await apiService.post('admin/ban-user', {
        uid,
        permanent: banPermanent ? 1 : 0,
        date_end: banPermanent ? null : banDateEnd,
        reason,
      });
      setUser({ ...user, banned: true });
      onUserRoleChange({ uid, banned: true });
      setBanPermanent(true);
      setBanDateEnd('');
      setBanReason('');
      await reload();
      showToast('Usuario baneado correctamente', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      showToast(error instanceof ApiError ? error.message : 'No se pudo banear al usuario', 'danger');
    } finally {
      setCreatingBan(false);
    }
  };

  const unban = async () => {
    if (!uid || !user?.banned || unbanning) return;
    const confirmed = await confirm({
      header: 'Confirmar desbloqueo',
      message: 'Esta acción quitará el bloqueo activo del usuario. ¿Deseas continuar?',
      confirmText: 'Desbloquear',
    });
    if (!confirmed) return;

    setUnbanning(true);
    try {
      await apiService.get(`admin/unban/${encodeURIComponent(uid)}`);
      setUser({ ...user, banned: false });
      onUserRoleChange({ uid, banned: false });
      await reload();
      showToast('Usuario desbloqueado correctamente', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      showToast('No se pudo desbloquear al usuario', 'danger');
    } finally {
      setUnbanning(false);
    }
  };

  const adjustBanDateEnd = (direction: 1 | -1, unit: 'week' | 'month') => {
    if (creatingBan || unbanning || isRequestedUserActive || user?.banned) return;
    const baseDate = banDateEnd ? new Date(banDateEnd) : new Date();
    if (Number.isNaN(baseDate.getTime())) return;
    const nextDate = new Date(baseDate);

    if (unit === 'week') {
      nextDate.setDate(nextDate.getDate() + 7 * direction);
    } else {
      const day = nextDate.getDate();
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + direction);
      const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(day, lastDay));
    }

    setBanDateEnd(toInputDate(nextDate));
  };

  return (
    <>
      {isLoading && <Loader />}
      <Modal isOpen={!!uid && !!user} onClose={onClose} title={user?.name ?? 'Usuario'}>
        <div className="modal-body">
          {user && (
            <div className="user-info">
              <div className="text-medium">{user.uid}</div>
              <div className="text-medium">Registrado el {formatDate(user.date_created)}</div>
              {!user.verified && <div className="unverified-note"><AlertCircle size={16} aria-hidden="true" /> Usuario sin verificar</div>}

              <div className="role-toggle-row" style={{ display: 'flex', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-small${hasRole('vip') ? '' : ' btn-outline'}`}
                  onClick={() => void toggleRole('vip')}
                  disabled={!user.verified || user.banned || togglingVip || togglingAdmin || togglingMaster}
                >
                  <Star size={16} aria-hidden="true" /> VIP
                </button>
                <button
                  type="button"
                  className={`btn btn-small${hasRole('admin') ? '' : ' btn-outline'}`}
                  onClick={() => void toggleRole('admin')}
                  disabled={!user.verified || user.banned || isRequestedUserActive || togglingVip || togglingAdmin || togglingMaster}
                >
                  Administrador
                </button>
                <button
                  type="button"
                  className={`btn btn-small${hasRole('master') ? '' : ' btn-outline'}`}
                  onClick={() => void toggleRole('master')}
                  disabled={!user.verified || user.banned || togglingVip || togglingAdmin || togglingMaster}
                >
                  Master
                </button>
              </div>
              {!user.verified && <p className="text-medium">El usuario debe ser verificado primero</p>}
              {user.banned && <p className="text-medium">No se pueden asignar roles a un usuario baneado</p>}
            </div>
          )}

          {isRequestedUserActive ? (
            <p className="text-medium">Este es tu usuario activo</p>
          ) : (
            <button
              type="button"
              className="btn btn-danger btn-block mb-1"
              onClick={() => void impersonate()}
              disabled={user?.banned || hasRole('admin')}
            >
              Suplantar usuario
            </button>
          )}

          {!isRequestedUserActive && user && (
            <details className="ban-create-dropdown mb-1">
              <summary>
                <span>Bloquear usuario</span>
                {user.banned && (
                  <button type="button" className="btn-clear btn btn-small" onClick={() => void unban()} disabled={unbanning}>
                    {unbanning ? 'Desbloqueando...' : 'Desbloquear'}
                  </button>
                )}
              </summary>

              <div className="ban-form-body">
                <div className="active-toggle-row mb-1">
                  <span>Permanente</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={banPermanent}
                      onChange={(event) => {
                        setBanPermanent(event.target.checked);
                        if (event.target.checked) setBanDateEnd('');
                      }}
                      disabled={creatingBan || unbanning || isRequestedUserActive || user.banned}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                {!banPermanent && (
                  <div className="field">
                    <label className="field-label">Fecha fin</label>
                    <div className="item">
                      <input
                        type="date"
                        value={banDateEnd}
                        onChange={(event) => setBanDateEnd(event.target.value)}
                        disabled={creatingBan || unbanning || isRequestedUserActive || user.banned}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => adjustBanDateEnd(-1, 'week')}>-1 semana</button>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => adjustBanDateEnd(1, 'week')}>+1 semana</button>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => adjustBanDateEnd(-1, 'month')}>-1 mes</button>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => adjustBanDateEnd(1, 'month')}>+1 mes</button>
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="field-label">Motivo</label>
                  <div className="item">
                    <textarea
                      rows={3}
                      placeholder="Escribe el motivo del ban"
                      value={banReason}
                      onChange={(event) => setBanReason(event.target.value)}
                      disabled={creatingBan || unbanning || isRequestedUserActive || user.banned}
                    />
                  </div>
                </div>

                {user.banned && <p className="text-medium">Este usuario ya tiene un ban activo.</p>}

                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={() => void createBan()}
                  disabled={creatingBan || unbanning || isRequestedUserActive || user.banned}
                >
                  {creatingBan ? 'Bloqueando...' : 'Confirmar'}
                </button>
              </div>
            </details>
          )}

          <details className="bans-dropdown">
            <summary>
              Historial de bloqueos {bans.length > 0 && `(${bans.length})`}
            </summary>

            {bans.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fechas</th>
                      <th>Responsable</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bans.map((ban) => (
                      <tr key={ban.id} className={ban.active ? 'banned' : ''}>
                        <td>
                          <div>{formatDate(ban.date_start)}</div>
                          <div className="text-medium">{ban.permanent ? 'Permanente' : ban.date_end ? formatDate(ban.date_end) : '-'}</div>
                        </td>
                        <td>{ban.banned_by_name?.trim() || 'Sin responsable'}</td>
                        <td>{ban.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-medium">Este usuario no tiene bans registrados.</p>
            )}
          </details>
        </div>
      </Modal>
    </>
  );
}
