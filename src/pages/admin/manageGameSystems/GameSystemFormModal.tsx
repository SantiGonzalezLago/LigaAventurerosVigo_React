import { useEffect, useState } from 'react';
import { Modal } from '../../../components/Modal';
import { FileUploadModal } from '../../../components/FileUploadModal';

export type GameSystem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  pc_limit: number;
  active: boolean;
};

export function GameSystemFormModal({
  isOpen,
  seed,
  isSaving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  seed: GameSystem | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (draft: { name: string; slug: string; pcLimit: number; active: boolean; iconFile: File | null; removeIcon: boolean }) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [active, setActive] = useState(true);
  const [pcLimit, setPcLimit] = useState(0);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(seed?.name ?? '');
      setSlug(seed?.slug ?? '');
      setIconPreview(seed?.icon ?? '');
      setActive(seed?.active ?? true);
      setPcLimit(seed?.pc_limit ?? 0);
      setIconFile(null);
      setSlugManuallyEdited(!!seed);
      setShowErrors(false);
    }
  }, [isOpen, seed]);

  const toSlug = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-');

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = () => {
    if (isSaving) return;
    if (!name.trim() || !slug.trim()) {
      setShowErrors(true);
      return;
    }

    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      pcLimit,
      active,
      iconFile,
      removeIcon: !!seed?.icon && !iconPreview,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={seed ? 'Editar sistema' : 'Nuevo sistema'}>
        <div className="modal-body">
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
            {showErrors && !name.trim() && <span className="field-error">El nombre es obligatorio</span>}
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
            {showErrors && !slug.trim() && <span className="field-error">El slug es obligatorio</span>}
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
                step={1}
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

          <div className="modal-actions">
            <button type="button" className="btn btn-clear" disabled={isSaving} onClick={handleClose}>
              Cancelar
            </button>
            <button type="button" className="btn" disabled={isSaving} onClick={handleSubmit}>
              {isSaving ? 'Guardando...' : seed ? 'Guardar cambios' : 'Crear sistema'}
            </button>
          </div>
        </div>
      </Modal>

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
    </>
  );
}
