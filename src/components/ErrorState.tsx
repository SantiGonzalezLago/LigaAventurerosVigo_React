import { AlertCircle } from 'lucide-react';

export function ErrorState({
  message = 'Ha ocurrido un error.',
  retryLabel = 'Reintentar',
  onRetry,
}: {
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-container">
      <AlertCircle className="error-icon" aria-hidden="true" />
      <h3>Error</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="retry-button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
