import { useCallback, useEffect, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Loader } from '../../components/Loader';
import { ErrorState } from '../../components/ErrorState';
import { apiService, ApiError } from '../../services/apiService';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';

type Setting = { key: string; description: string | null; value: string };

export function ServerSettingsPage() {
  usePageTitle('Configuraciones del servidor', true);
  const { logout } = useUser();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(() => {
    setLoading(true);
    setError(null);
    apiService
      .get<{ message: string; settings: Setting[] }>('admin/settings/get')
      .then((response) => {
        setSettings(response.settings);
        const nextDrafts: Record<string, string> = {};
        const nextSaving: Record<string, boolean> = {};
        for (const setting of response.settings) {
          nextDrafts[setting.key] = setting.value;
          nextSaving[setting.key] = false;
        }
        setDrafts(nextDrafts);
        setSaving(nextSaving);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError('No se han podido cargar las configuraciones.');
      })
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const isDirty = (key: string) => {
    const original = settings.find((setting) => setting.key === key)?.value ?? '';
    return drafts[key] !== original;
  };

  const save = async (key: string) => {
    if (!isDirty(key) || saving[key]) return;
    setSaving((current) => ({ ...current, [key]: true }));

    try {
      const response = await apiService.post<{ message: string; key: string; value: string }>(
        'admin/settings/update',
        { key, value: drafts[key] }
      );
      setSettings((current) => current.map((setting) => (setting.key === key ? { ...setting, value: response.value } : setting)));
      setDrafts((current) => ({ ...current, [key]: response.value }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      showToast(err instanceof ApiError ? err.message : 'Error al guardar.', 'danger');
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
    }
  };

  return (
    <div className="page-content">
      {loading && <Loader />}
      {error && !loading && <ErrorState message={error} onRetry={loadSettings} />}

      {!loading && !error && settings.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.key}>
                  <td className="key-cell" title={setting.description ?? undefined}>
                    <span>{setting.key}</span>
                  </td>
                  <td className="value-cell">
                    <div className="value-wrapper">
                      <div className="item">
                        <input
                          type="text"
                          value={drafts[setting.key] ?? ''}
                          aria-label={`Valor de ${setting.key}`}
                          onChange={(event) =>
                            setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void save(setting.key);
                          }}
                        />
                      </div>
                      {isDirty(setting.key) && (
                        <button
                          type="button"
                          className="option-btn"
                          aria-label="Guardar"
                          disabled={saving[setting.key]}
                          onClick={() => void save(setting.key)}
                        >
                          {saving[setting.key] ? '…' : '✔'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
