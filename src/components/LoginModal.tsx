import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from './Modal';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

type GoogleCredentialResponse = { credential?: string };
type GoogleAccountsIdApi = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(container: HTMLElement, options: Record<string, string | number | boolean>): void;
};
type GoogleWindowApi = Window & { google?: { accounts?: { id?: GoogleAccountsIdApi } } };

let googleScriptLoader: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  const googleWindow = window as GoogleWindowApi;
  if (googleWindow.google?.accounts?.id) return Promise.resolve();
  if (googleScriptLoader) return googleScriptLoader;

  googleScriptLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      if (googleWindow.google?.accounts?.id) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });

  return googleScriptLoader;
}

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { loginPassword, getGoogleClientId, loginGoogle } = useUser();
  const { showToast } = useToast();
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const googleClientIdRef = useRef<string | null>(null);
  const googleAccountsRef = useRef<GoogleAccountsIdApi | null>(null);
  const googleInitializedRef = useRef(false);

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasGoogleSetupError, setHasGoogleSetupError] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);

  const resetForm = () => {
    setUser('');
    setPassword('');
    setShowPassword(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      googleInitializedRef.current = false;
      setGoogleButtonReady(false);
      setHasGoogleSetupError(false);
      if (googleButtonContainerRef.current) googleButtonContainerRef.current.innerHTML = '';
      return;
    }

    void initializeGoogleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !googleButtonReady || !googleAccountsRef.current) return;

    const container = googleButtonContainerRef.current;
    if (!container) return;

    const googleAccounts = googleAccountsRef.current;
    container.innerHTML = '';
    googleAccounts.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      text: 'continue_with',
      shape: 'pill',
      size: 'large',
      width: Math.max(220, Math.floor(container.clientWidth)),
    });
    googleInitializedRef.current = true;
  }, [isOpen, googleButtonReady]);

  const initializeGoogleLogin = async (forceRefreshClient = false) => {
    if (!isOpen || isGoogleLoading) return;
    if (!forceRefreshClient && googleInitializedRef.current && googleButtonReady) return;

    setIsGoogleLoading(true);
    setHasGoogleSetupError(false);
    setGoogleButtonReady(false);

    try {
      const clientId = await getGoogleClientId(forceRefreshClient);
      await loadGoogleIdentityScript();

      const googleWindow = window as GoogleWindowApi;
      const googleAccounts = googleWindow.google?.accounts?.id;
      if (!googleAccounts) throw new Error('Google Identity Services no está disponible');

      if (googleClientIdRef.current !== clientId) {
        googleAccounts.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleGoogleCredential(response);
          },
          cancel_on_tap_outside: false,
        });
        googleClientIdRef.current = clientId;
      }

      googleAccountsRef.current = googleAccounts;
      setGoogleButtonReady(true);
    } catch {
      setGoogleButtonReady(false);
      setHasGoogleSetupError(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    if (!response.credential) return;
    const result = await loginGoogle(response.credential);
    if (result.success) {
      showToast('Sesión iniciada', 'success');
      resetForm();
      onClose();
      return;
    }
    showToast(result.message ?? 'No se pudo iniciar sesión con Google', 'danger');
  };

  const login = async () => {
    if (isSubmitting || !user.trim() || !password) return;
    setIsSubmitting(true);
    const result = await loginPassword(user.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      showToast('Sesión iniciada', 'success');
      resetForm();
      onClose();
      return;
    }

    showToast(result.message ?? 'No se pudo iniciar sesión', 'danger');
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Iniciar sesión">
      <div className="modal-body">
        <div className="field">
          <div className="item">
            <input
              value={user}
              disabled={isSubmitting}
              onChange={(event) => setUser(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void login();
              }}
              autoComplete="username"
              placeholder="Email"
            />
          </div>
        </div>
        <div className="field">
          <div className="item">
            <input
              value={password}
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void login();
              }}
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
            />
            <button
              type="button"
              className="icon-button"
              disabled={isSubmitting}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button type="button" className="btn btn-block" disabled={isSubmitting} onClick={() => void login()}>
          Entrar
        </button>

        <div className="separator" aria-hidden="true">
          <span>o</span>
        </div>

        <div className="google-login-section">
          {isGoogleLoading && <p className="text-medium google-status">Preparando acceso con Google...</p>}
          {hasGoogleSetupError && (
            <button
              type="button"
              className="btn btn-clear btn-small"
              disabled={isGoogleLoading}
              onClick={() => void initializeGoogleLogin(true)}
            >
              Reintentar Google
            </button>
          )}
          {googleButtonReady && <div ref={googleButtonContainerRef} className="google-button-container" />}
        </div>
      </div>
    </Modal>
  );
}
