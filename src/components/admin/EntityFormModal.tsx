import { useEffect, useState } from 'react';
import { Modal } from '../Modal';

export type EntityDraft = {
  name: string;
  slug?: string;
  description?: string | null;
  active: boolean;
};

export function EntityFormModal({
  isOpen,
  title,
  fields,
  seed,
  isSaving,
  isDeleting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  title: string;
  fields: Array<'name' | 'slug' | 'description' | 'active'>;
  seed: EntityDraft | null;
  isSaving: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onSubmit: (draft: EntityDraft) => void;
}) {
  const [draft, setDraft] = useState<EntityDraft>({ name: '', slug: '', description: '', active: true });
  const [showErrors, setShowErrors] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft({
        name: seed?.name ?? '',
        slug: seed?.slug ?? '',
        description: seed?.description ?? '',
        active: seed?.active ?? true,
      });
      setSlugManuallyEdited(!!seed);
      setShowErrors(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, seed]);

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');

  const onNameChange = (value: string) => {
    setDraft((current) => ({
      ...current,
      name: value,
      slug: fields.includes('slug') && !slugManuallyEdited ? toSlug(value) : current.slug,
    }));
  };

  const handleClose = () => {
    if (isSaving || isDeleting) return;
    onClose();
  };

  const handleSubmit = () => {
    if (isSaving || isDeleting) return;
    const nameValid = draft.name.trim().length > 0;
    const slugValid = !fields.includes('slug') || (draft.slug ?? '').trim().length > 0;

    if (!nameValid || !slugValid) {
      setShowErrors(true);
      return;
    }

    onSubmit(draft);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="modal-body">
        <div className="field">
          <label className="field-label">Nombre</label>
          <div className="item">
            <input
              type="text"
              value={draft.name}
              disabled={isSaving || isDeleting}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </div>
          {showErrors && !draft.name.trim() && <span className="field-error">El nombre es obligatorio</span>}
        </div>

        {fields.includes('slug') && (
          <div className="field">
            <label className="field-label">Slug</label>
            <div className="item">
              <input
                type="text"
                value={draft.slug}
                disabled={isSaving || isDeleting}
                onChange={(event) => {
                  setSlugManuallyEdited(event.target.value.trim().length > 0);
                  setDraft((current) => ({ ...current, slug: event.target.value }));
                }}
              />
            </div>
            {showErrors && !(draft.slug ?? '').trim() && <span className="field-error">El slug es obligatorio</span>}
          </div>
        )}

        {fields.includes('description') && (
          <div className="field">
            <label className="field-label">Descripción</label>
            <div className="item">
              <textarea
                rows={3}
                value={draft.description ?? ''}
                disabled={isSaving || isDeleting}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
          </div>
        )}

        {fields.includes('active') && (
          <div className="field field-active-row">
            <div className="active-toggle-row">
              <span>Activo</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={draft.active}
                  disabled={isSaving || isDeleting}
                  onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-clear" disabled={isSaving || isDeleting} onClick={handleClose}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={isSaving || isDeleting} onClick={handleSubmit}>
            {isSaving ? 'Guardando...' : seed ? 'Guardar cambios' : 'Añadir'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
