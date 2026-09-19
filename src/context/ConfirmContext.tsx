import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ConfirmOptions = {
  header: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

const ConfirmContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
} | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handle = (value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="modal-backdrop" onClick={() => handle(false)}>
          <div className="modal-panel confirm-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-body">
              <h2 className="modal-title">{options.header}</h2>
              {options.message && <p className="text-medium">{options.message}</p>}
              <div className="confirm-actions">
                <button type="button" className="btn btn-clear" onClick={() => handle(false)}>
                  {options.cancelText ?? 'Cancelar'}
                </button>
                <button
                  type="button"
                  className={`btn${options.danger ? ' btn-danger' : ''}`}
                  onClick={() => handle(true)}
                >
                  {options.confirmText ?? 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return context.confirm;
}
