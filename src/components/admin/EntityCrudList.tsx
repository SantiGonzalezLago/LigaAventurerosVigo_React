import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Loader } from '../Loader';
import { ErrorState } from '../ErrorState';
import { EntityFormModal, type EntityDraft } from './EntityFormModal';
import { apiService, ApiError } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useUser } from '../../context/UserContext';

export function EntityCrudList<
  T extends { id: number; name: string; active: boolean; slug?: string; description?: string | null },
>({
  entityLabel,
  loadUrl,
  itemsKey,
  addUrl,
  updateUrl,
  deleteUrl,
  fields,
  renderExtraColumns,
}: {
  entityLabel: string;
  loadUrl: string;
  itemsKey: string;
  addUrl: string;
  updateUrl: (id: number) => string;
  deleteUrl: (id: number) => string;
  fields: Array<'name' | 'slug' | 'description' | 'active'>;
  renderExtraColumns?: (item: T) => React.ReactNode;
}) {
  const { logout } = useUser();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    apiService
      .get<Record<string, unknown>>(loadUrl)
      .then((response) => {
        setItems((response[itemsKey] as T[]) ?? []);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
        setLoadError(`No se pudieron cargar: ${entityLabel}`);
      })
      .finally(() => setLoading(false));
  }, [loadUrl, itemsKey, entityLabel, logout]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const submit = async (draft: EntityDraft) => {
    setSaving(true);
    const body: Record<string, unknown> = { name: draft.name.trim(), active: draft.active };
    if (fields.includes('slug')) body.slug = (draft.slug ?? '').trim();
    if (fields.includes('description') && draft.description?.trim()) body.description = draft.description.trim();

    try {
      if (editing) {
        await apiService.post(updateUrl(editing.id), body);
        showToast(`${entityLabel} actualizado`, 'success');
      } else {
        await apiService.post(addUrl, body);
        showToast(`${entityLabel} creado correctamente`, 'success');
      }
      setIsModalOpen(false);
      load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      showToast(
        error instanceof ApiError ? error.message : `No se pudo guardar: ${entityLabel}`,
        'danger'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: T) => {
    const confirmed = await confirm({
      header: `Eliminar ${entityLabel.toLowerCase()}`,
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await apiService.delete(deleteUrl(item.id));
      showToast(`${entityLabel} eliminado`, 'success');
      load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      showToast('No se pudo eliminar', 'danger');
    }
  };

  return (
    <div>
      {loading && <Loader />}

      {loadError && !loading && items.length === 0 && <ErrorState message={loadError} onRetry={load} />}

      {!loading && items.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                {fields.includes('slug') && <th>Slug</th>}
                {fields.includes('description') && <th>Descripción</th>}
                <th className="active-cell">Estado</th>
                <th className="options-cell" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  {fields.includes('slug') && <td className="name-slug">{item.slug}</td>}
                  {fields.includes('description') && <td>{item.description || '-'}</td>}
                  <td className="active-cell">
                    <span className={`setting-status${item.active ? '' : ' inactive'}`}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="options-cell">
                    {renderExtraColumns?.(item)}
                    <button type="button" className="option-btn" aria-label="Editar" onClick={() => openEdit(item)}>
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="option-btn danger"
                      aria-label="Eliminar"
                      onClick={() => void remove(item)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <div className="empty-container">
          <h3>Sin resultados</h3>
          <p>No hay {entityLabel.toLowerCase()} disponibles.</p>
        </div>
      )}

      <button type="button" className="fab-button" disabled={loading} aria-label={`Añadir ${entityLabel}`} onClick={openCreate}>
        +
      </button>

      <EntityFormModal
        isOpen={isModalOpen}
        title={editing ? `Editar ${entityLabel.toLowerCase()}` : `Añadir ${entityLabel.toLowerCase()}`}
        fields={fields}
        seed={editing}
        isSaving={saving}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(draft) => void submit(draft)}
      />
    </div>
  );
}
