import { useEffect, useState } from 'react';
import { UserCircle, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { FileUploadModal } from './FileUploadModal';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

function formatDeleteDate(dateIso?: string): string | null {
  if (!dateIso) return null;
  const parts = dateIso.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeUser, updateSettings, deleteActiveUser } = useUser();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [username, setUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(activeUser?.name ?? '');
      setAvatarPreview(activeUser?.avatar ?? '');
      setPassword('');
      setPasswordRepeat('');
      setAvatarFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setUsername('');
    setAvatarPreview('');
    setIsAvatarModalOpen(false);
    setPassword('');
    setPasswordRepeat('');
    setAvatarFile(null);
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const saveChanges = async () => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      showToast('El nombre de usuario es obligatorio', 'danger');
      return;
    }

    if (password !== passwordRepeat) {
      showToast('Las contraseñas no coinciden', 'danger');
      return;
    }

    if (!activeUser) {
      showToast('No hay un usuario activo para actualizar', 'danger');
      return;
    }

    const hasNameChange = normalizedUsername !== activeUser.name;
    const hasPasswordChange = password.trim().length > 0;
    const hasAvatarChange = avatarFile !== null;

    if (!hasNameChange && !hasPasswordChange && !hasAvatarChange) {
      showToast('No hay cambios para guardar', 'danger');
      return;
    }

    const payload: { name?: string; password?: string; avatar?: File } = {};
    if (hasNameChange) payload.name = normalizedUsername;
    if (hasPasswordChange) payload.password = password;
    if (hasAvatarChange && avatarFile) payload.avatar = avatarFile;

    const result = await updateSettings(payload);
    if (!result.success) {
      showToast(result.message ?? 'No se pudieron guardar los cambios', 'danger');
      return;
    }

    if (result.user) {
      setUsername(result.user.name);
      setAvatarPreview(result.user.avatar ?? '');
    }

    setAvatarFile(null);
    setPassword('');
    setPasswordRepeat('');
    showToast(result.message ?? 'Cambios guardados', 'success');
  };

  const confirmDeleteAccount = async () => {
    const confirmed = await confirm({
      header: '¿Estás seguro de que quieres eliminar tu cuenta?',
      message: 'Tu cuenta se eliminará en 15 días. Para cancelar, inicia sesión durante ese período.',
      confirmText: 'Sí',
      cancelText: 'No',
      danger: true,
    });

    if (!confirmed) return;

    const result = await deleteActiveUser();
    if (!result.success) {
      showToast(result.message ?? 'No se pudo programar la eliminación de la cuenta', 'danger');
      return;
    }

    const formattedDate = formatDeleteDate(result.deleteOn);
    const successMessage = formattedDate
      ? `Tu cuenta se eliminará el ${formattedDate}. Inicia sesión antes de esa fecha para cancelar.`
      : 'Tu cuenta se eliminará próximamente. Inicia sesión antes de esa fecha para cancelar.';

    closeModal();
    showToast(successMessage, 'success');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={closeModal} title="Configuración">
        <div className="modal-body">
          <div className="avatar-section">
            <button
              type="button"
              className="avatar-picker-button"
              onClick={() => setIsAvatarModalOpen(true)}
              aria-label="Cambiar avatar"
            >
              {avatarPreview ? (
                <img className="avatar-preview" src={avatarPreview} alt="Avatar del usuario" />
              ) : (
                <div className="avatar-preview avatar-fallback" aria-hidden="true">
                  <UserCircle size={52} aria-hidden="true" />
                </div>
              )}
              <span className="avatar-add-badge" aria-hidden="true">
                <Plus size={18} aria-hidden="true" />
              </span>
            </button>
          </div>

          <div className="field">
            <span className="field-label">Nombre de usuario</span>
            <div className="item">
              <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Nueva contraseña</span>
            <div className="item">
              <input
                value={password}
                autoComplete="new-password"
                type="password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Repetir contraseña</span>
            <div className="item">
              <input
                value={passwordRepeat}
                autoComplete="new-password"
                type="password"
                onChange={(event) => setPasswordRepeat(event.target.value)}
              />
            </div>
          </div>

          <button type="button" className="btn btn-block" onClick={() => void saveChanges()}>
            Guardar cambios
          </button>

          <div className="settings-uid" aria-label="UID del usuario">
            <span className="settings-uid-label">UUID</span>
            <span className="settings-uid-value">{activeUser?.uid}</span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-danger btn-block"
            onClick={() => void confirmDeleteAccount()}
          >
            Eliminar mi cuenta
          </button>
        </div>
      </Modal>

      <FileUploadModal
        isOpen={isAvatarModalOpen}
        type="image"
        imageMaxDimension={256}
        onClose={() => setIsAvatarModalOpen(false)}
        onFileSelected={(selection) => {
          setAvatarFile(selection.file);
          setAvatarPreview(selection.previewUrl);
          setIsAvatarModalOpen(false);
        }}
        onFileError={(message) => {
          if (message.trim()) showToast(message, 'danger');
        }}
      />
    </>
  );
}
