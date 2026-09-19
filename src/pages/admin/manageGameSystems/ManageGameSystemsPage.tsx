import { useCallback, useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { Loader } from '../../../components/Loader';
import { ErrorState } from '../../../components/ErrorState';
import { GameSystemFormModal, type GameSystem } from './GameSystemFormModal';
import { apiService, ApiError } from '../../../services/apiService';
import { useUser } from '../../../context/UserContext';
import { useToast } from '../../../context/ToastContext';

function sortSystems(systems: GameSystem[]) {
  return [...systems].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.id - b.id;
  });
}

export function ManageGameSystemsPage() {
  usePageTitle('Configurar sistemas', true);
  const navigate = useNavigate();
  const { logout } = useUser();
  const { showToast } = useToast();

  const [systems, setSystems] = useState<GameSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<GameSystem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiService
      .get<{ game_systems: GameSystem[] }>('game-systems')
      .then((response) => setSystems(sortSystems(response.game_systems)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError('No se pudieron cargar los sistemas de juego');
      })
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (draft: { name: string; slug: string; pcLimit: number; active: boolean; iconFile: File | null; removeIcon: boolean }) => {
    setSaving(true);
    const body: Record<string, unknown> = {
      name: draft.name,
      slug: draft.slug,
      pc_limit: draft.pcLimit,
      active: draft.active ? 1 : 0,
    };
    if (draft.removeIcon) body.remove_icon = '1';
    const files: Record<string, File> = draft.iconFile ? { icon: draft.iconFile } : {};

    try {
      if (editing) {
        await apiService.postWithFiles(`game-systems/update/${editing.id}`, body, files);
        showToast('Sistema actualizado', 'success');
      } else {
        await apiService.postWithFiles('game-systems/add', body, files);
        showToast('Sistema creado correctamente', 'success');
      }
      setIsModalOpen(false);
      load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      showToast(error instanceof ApiError ? error.message : 'No se pudo guardar el sistema', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      {loading && <Loader />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="systems-list">
          {systems.length === 0 && (
            <div className="empty-container">
              <p>No hay sistemas de juego registrados.</p>
            </div>
          )}

          {systems.map((system) => (
            <div
              key={system.id}
              className={`system-row${system.active ? '' : ' system-row-inactive'}`}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/admin/game-systems/${system.slug}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') navigate(`/admin/game-systems/${system.slug}`);
              }}
            >
              {system.icon ? (
                <img className="system-icon" src={system.icon} alt={system.name} />
              ) : (
                <div className="system-icon-placeholder">{system.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="system-info">
                <span className="system-name">{system.name}</span>
                <span className="system-slug">
                  {system.slug}
                  {!system.active && <span className="status-pill">Inactivo</span>}
                </span>
              </div>
              <button
                type="button"
                className="edit-btn"
                aria-label="Editar"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(system);
                  setIsModalOpen(true);
                }}
              >
                <Settings2 size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="fab-button"
        aria-label="Añadir sistema"
        onClick={() => {
          setEditing(null);
          setIsModalOpen(true);
        }}
      >
        +
      </button>

      <GameSystemFormModal
        isOpen={isModalOpen}
        seed={editing}
        isSaving={saving}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(draft) => void submit(draft)}
      />
    </div>
  );
}
