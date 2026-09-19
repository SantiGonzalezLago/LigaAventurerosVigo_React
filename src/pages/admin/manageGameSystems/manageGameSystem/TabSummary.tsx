import { useEffect, useState } from 'react';
import { FileUploadModal } from '../../../../components/FileUploadModal';
import { apiService, ApiError } from '../../../../services/apiService';
import { useToast } from '../../../../context/ToastContext';
import { useUser } from '../../../../context/UserContext';
import type { GameSystem } from '../GameSystemFormModal';

export function TabSummary({
  system,
  onSlugUpdated,
}: {
  system: GameSystem;
  onSlugUpdated: (slug: string) => void;
}) {
  const { logout } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState(system.name);
  const [slug, setSlug] = useState(system.slug);
  const [iconPreview, setIconPreview] = useState(system.icon ?? '');
  const [active, setActive] = useState(system.active);
  const [pcLimit, setPcLimit] = useState(system.pc_limit);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  useEffect(() => {
    setName(system.name);
    setSlug(system.slug);
    setIconPreview(system.icon ?? '');
    setActive(system.active);
    setPcLimit(system.pc_limit);
    setIconFile(null);
  }, [system]);

  const toSlug = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-');

  const save = async () => {
    if (!name.trim() || !slug.trim()) {
      showToast('El nombre y el slug son obligatorios', 'danger');
      return;
    }

    setIsSaving(true);
    const body: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim(),
      pc_limit: pcLimit,
      active: active ? 1 : 0,
    };
    if (system.icon && !iconPreview) body.remove_icon = '1';
    const files: Record<string, File> = iconFile ? { icon: iconFile } : {};

    try {
      await apiService.postWithFiles(`game-systems/update/${system.id}`, body, files);
      showToast('Cambios guardados', 'success');
      if (slug.trim() !== system.slug) onSlugUpdated(slug.trim());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      showToast(error instanceof ApiError ? error.message : 'No se pudieron guardar los cambios', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="summary-content">
      <div className="field">
        <label className="field-label">Nombre</label>
        <div className="item">
          <input
            value={name}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugManuallyEdited) setSlug(toSlug(event.target.value));
            }}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Slug</label>
        <div className="item">
          <input
            value={slug}
            disabled={isSaving}
            onChange={(event) => {
              setSlugManuallyEdited(event.target.value.length > 0);
              setSlug(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Icono</label>
        <div className="icon-field-row">
          {iconPreview ? (
            <img className="icon-preview" src={iconPreview} alt="Vista previa del icono" />
          ) : (
            <div className="icon-placeholder">Sin icono</div>
          )}
          <button type="button" className="btn btn-outline btn-small" disabled={isSaving} onClick={() => setIsFileUploadOpen(true)}>
            {iconPreview ? 'Cambiar' : 'Seleccionar'}
          </button>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Límite de personajes por jugador</label>
        <div className="item">
          <input
            type="number"
            min={0}
            value={pcLimit}
            disabled={isSaving}
            onChange={(event) => setPcLimit(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="field field-active-row">
        <div className="active-toggle-row">
          <span>Activo</span>
          <label className="switch">
            <input type="checkbox" checked={active} disabled={isSaving} onChange={(event) => setActive(event.target.checked)} />
            <span className="switch-slider" />
          </label>
        </div>
      </div>

      <div className="summary-actions">
        <button type="button" className="btn" disabled={isSaving} onClick={() => void save()}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <FileUploadModal
        isOpen={isFileUploadOpen}
        type="image"
        imageMaxDimension={128}
        onClose={() => setIsFileUploadOpen(false)}
        onFileSelected={(selection) => {
          setIconFile(selection.file);
          setIconPreview(selection.previewUrl);
          setIsFileUploadOpen(false);
        }}
      />
    </div>
  );
}
