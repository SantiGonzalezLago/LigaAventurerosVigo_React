import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Compass, Search, ShieldCheck, Star } from 'lucide-react';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { Loader } from '../../../components/Loader';
import { ErrorState } from '../../../components/ErrorState';
import { Pagination } from '../../../components/Pagination';
import { UserDetailModal } from './UserDetailModal';
import { apiService, ApiError } from '../../../services/apiService';
import { useUser } from '../../../context/UserContext';

type UserRow = {
  uid: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  banned: boolean;
  roles: string[];
  date_created: string;
};

export function ManageUsersPage() {
  usePageTitle('Gestión de usuarios', true);
  const { logout } = useUser();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    apiService
      .post<{ users: UserRow[]; pagination: { total: number; total_pages: number } }>('admin/user-list', {
        page: currentPage,
        per_page: 20,
        order_by: sortBy,
        order_dir: sortDir,
        q: searchQuery,
      })
      .then((response) => {
        setUsers(response.users ?? []);
        setPagination(response.pagination ?? { total: 0, total_pages: 0 });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError('No se han podido cargar los usuarios.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortDir, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchDraft.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const onSort = (column: string) => {
    if (column === 'avatar') return;
    if (sortBy === column) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sortIcon = (column: string) => (sortBy === column ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const onUserRoleChange = (update: { uid: string; roles?: string[]; banned?: boolean }) => {
    setUsers((current) =>
      current.map((user) =>
        user.uid === update.uid
          ? {
              ...user,
              ...(update.roles ? { roles: update.roles } : {}),
              ...(typeof update.banned === 'boolean' ? { banned: update.banned } : {}),
            }
          : user
      )
    );
  };

  return (
    <div className="page-content">
      {loading && <Loader />}

      <div className="searchbar mb-1">
        <Search size={18} aria-hidden="true" />
        <input
          placeholder="Buscar usuarios..."
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
      </div>

      {error && users.length === 0 && <ErrorState message={error} onRetry={load} />}

      {users.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th className="sortable" onClick={() => onSort('name')}>Nombre{sortIcon('name')}</th>
                <th className="sortable" onClick={() => onSort('vip')} title="VIP"><Star size={16} aria-label="VIP" />{sortIcon('vip')}</th>
                <th className="sortable" onClick={() => onSort('master')} title="Master"><Compass size={16} aria-label="Master" />{sortIcon('master')}</th>
                <th className="sortable" onClick={() => onSort('admin')} title="Admin"><ShieldCheck size={16} aria-label="Admin" />{sortIcon('admin')}</th>
                <th className="sortable" onClick={() => onSort('date_created')}>Registro{sortIcon('date_created')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className={user.banned ? 'banned' : ''} onClick={() => setSelectedUid(user.uid)}>
                  <td>
                    {user.avatar ? (
                      <img className="avatar-img" src={user.avatar} alt={`Avatar de ${user.name}`} />
                    ) : (
                      <span className="avatar-fallback">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </td>
                  <td>
                    <strong>{user.name}</strong>
                    {!user.verified && (
                      <AlertCircle size={15} className="unverified-icon" aria-label="Sin verificar" />
                    )}
                  </td>
                  <td>
                    <Star className={`role-icon${user.roles.includes('vip') ? '' : ' inactive'}`} size={17} aria-label="VIP" />
                  </td>
                  <td>
                    <Compass className={`role-icon${user.roles.includes('master') ? '' : ' inactive'}`} size={17} aria-label="Master" />
                  </td>
                  <td>
                    <ShieldCheck className={`role-icon${user.roles.includes('admin') ? '' : ' inactive'}`} size={17} aria-label="Admin" />
                  </td>
                  <td>{new Date(user.date_created).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserDetailModal uid={selectedUid} onClose={() => setSelectedUid(null)} onUserRoleChange={onUserRoleChange} />

      {users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.total_pages}
          total={pagination.total}
          itemsCount={users.length}
          onPageChange={setCurrentPage}
        />
      )}

      {!loading && !error && users.length === 0 && (
        <div className="empty-container">
          <h3>Sin resultados</h3>
          <p>{searchQuery ? 'No se encontraron usuarios que coincidan con tu búsqueda.' : 'No hay usuarios disponibles.'}</p>
        </div>
      )}

      <button type="button" className="fab-button" disabled={loading} aria-label="Actualizar" onClick={load}>
        ↻
      </button>
    </div>
  );
}
