import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader } from '../../../../components/Loader';
import { apiService, ApiError } from '../../../../services/apiService';
import { useToast } from '../../../../context/ToastContext';
import { useUser } from '../../../../context/UserContext';

type Tier = { id?: number; name: string; min_level: number; max_level: number; active: boolean };
type DraftTier = Tier & { _key: string };

const TIER_COLORS = ['#4a9eff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const ROW_HEIGHT = 56;

let nextKey = 1;
function makeKey() {
  const key = `tier_${nextKey}`;
  nextKey += 1;
  return key;
}

function toDraftTiers(tiers: Tier[]): DraftTier[] {
  return tiers.map((tier) => ({ ...tier, _key: makeKey() }));
}

function tierGridRow(tier: { min_level: number; max_level: number }) {
  const min = Math.max(1, Math.floor(tier.min_level) || 1);
  const max = Math.max(min, Math.floor(tier.max_level) || min);
  return `${min} / ${max + 1}`;
}

function tierLevelLabel(tier: { min_level: number; max_level: number }) {
  if (tier.min_level === tier.max_level) return `Nivel ${tier.min_level}`;
  return `Nivel ${tier.min_level} - ${tier.max_level}`;
}

export function TabTiers({ systemId }: { systemId: number }) {
  const { logout } = useUser();
  const { showToast } = useToast();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [draftTiers, setDraftTiers] = useState<DraftTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setEditMode(false);

    apiService
      .get<{ tiers: Tier[] }>(`game-systems/${systemId}/tiers`)
      .then((response) => {
        const loaded = response.tiers ?? [];
        setTiers(loaded);
        setDraftTiers(toDraftTiers(loaded));
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
        setLoadError(error instanceof ApiError ? error.message : 'Error al cargar los tiers');
      })
      .finally(() => setLoading(false));
  }, [systemId, logout]);

  useEffect(() => {
    load();
  }, [load]);

  const activeDrafts = useMemo(
    () => [...draftTiers.filter((tier) => tier.active)].sort((a, b) => a.min_level - b.min_level),
    [draftTiers]
  );
  const inactiveDrafts = useMemo(() => draftTiers.filter((tier) => !tier.active), [draftTiers]);

  const displayMaxLevel = useMemo(() => {
    const maxes = draftTiers
      .filter((tier) => tier.active)
      .map((tier) => Math.max(tier.min_level || 0, tier.max_level || 0))
      .filter((value) => value > 0 && !Number.isNaN(value));
    return maxes.length > 0 ? Math.max(...maxes) : 0;
  }, [draftTiers]);

  const levels = useMemo(() => Array.from({ length: displayMaxLevel }, (_, i) => i + 1), [displayMaxLevel]);

  const gridTemplateRows =
    displayMaxLevel <= 0
      ? undefined
      : editMode
        ? `repeat(${displayMaxLevel}, minmax(${ROW_HEIGHT}px, auto))`
        : `repeat(${displayMaxLevel}, ${ROW_HEIGHT}px)`;

  const validationError = useMemo(() => {
    for (const tier of activeDrafts) {
      if (!tier.name.trim()) return 'Todos los tiers activos deben tener nombre';
      if (!tier.min_level || tier.min_level < 1) return 'El nivel mínimo debe ser al menos 1';
      if (!tier.max_level || tier.max_level < tier.min_level) return 'El nivel máximo debe ser ≥ al mínimo';
    }
    for (let i = 0; i < activeDrafts.length - 1; i++) {
      if (activeDrafts[i].max_level >= activeDrafts[i + 1].min_level) {
        return `"${activeDrafts[i].name || 'Tier'}" y "${activeDrafts[i + 1].name || 'Tier'}" se solapan`;
      }
      if (activeDrafts[i].max_level + 1 < activeDrafts[i + 1].min_level) {
        return `Hay un hueco entre el nivel ${activeDrafts[i].max_level} y ${activeDrafts[i + 1].min_level}`;
      }
    }
    return null;
  }, [activeDrafts]);

  const updateTier = (key: string, patch: Partial<Tier>) => {
    setDraftTiers((current) => current.map((tier) => (tier._key === key ? { ...tier, ...patch } : tier)));
  };

  const toggleEditMode = () => {
    setDraftTiers(toDraftTiers(tiers));
    setEditMode((current) => !current);
  };

  const addTier = () => {
    const nextMin = activeDrafts.length > 0 ? activeDrafts[activeDrafts.length - 1].max_level + 1 : 1;
    setDraftTiers((current) => [...current, { _key: makeKey(), name: '', min_level: nextMin, max_level: nextMin, active: true }]);
  };

  const removeTier = (key: string) => {
    setDraftTiers((current) => current.filter((tier) => tier._key !== key));
  };

  const saveTiers = async () => {
    if (validationError) {
      showToast(validationError, 'danger');
      return;
    }

    setSaving(true);
    const payload = draftTiers.map((tier) => ({
      ...(tier.id !== undefined ? { id: tier.id } : {}),
      name: tier.name.trim(),
      min_level: Math.round(tier.min_level),
      max_level: Math.round(tier.max_level),
      active: tier.active,
    }));

    try {
      const response = await apiService.post<{ tiers: Tier[] }>(`game-systems/${systemId}/tiers/update`, { tiers: payload });
      const savedTiers = response.tiers ?? [];
      setTiers(savedTiers);
      setDraftTiers(toDraftTiers(savedTiers));
      setEditMode(false);
      showToast('Tiers guardados correctamente', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      showToast(error instanceof ApiError ? error.message : 'Error al guardar', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const renderLevelFields = (tier: DraftTier) => (
    <div className="tier-levels-row">
      <span className="level-row-label">Nivel</span>
      <input
        type="number"
        className="level-num-input"
        value={tier.min_level}
        min={1}
        step={1}
        aria-label="Nivel mínimo"
        onChange={(event) => updateTier(tier._key, { min_level: Number(event.target.value) })}
      />
      <span className="level-sep">—</span>
      <input
        type="number"
        className="level-num-input"
        value={tier.max_level}
        min={1}
        step={1}
        aria-label="Nivel máximo"
        onChange={(event) => updateTier(tier._key, { max_level: Number(event.target.value) })}
      />
    </div>
  );

  if (loading) {
    return <Loader />;
  }

  if (loadError) {
    return <p className="load-error">{loadError}</p>;
  }

  return (
    <div className="tiers-content">
      <div className="tiers-header">
        {editMode ? (
          <>
            <button type="button" className="btn btn-outline btn-small add-tier-header-btn" disabled={saving} onClick={addTier}>
              + Añadir tier
            </button>
            <button type="button" className="btn btn-outline btn-small" disabled={saving} onClick={toggleEditMode}>
              Cancelar
            </button>
            <button type="button" className="btn btn-small" disabled={saving || !!validationError} onClick={() => void saveTiers()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-outline btn-small" onClick={toggleEditMode}>
            Editar
          </button>
        )}
      </div>

      {editMode && validationError && <div className="validation-banner">{validationError}</div>}

      {activeDrafts.length > 0 ? (
        <div className="ruler-grid" style={{ gridTemplateRows }}>
          {levels.map((level) => (
            <div key={level} className="level-mark" style={{ gridRow: level }}>
              {level}
            </div>
          ))}

          {activeDrafts.map((tier, index) => (
            <div
              key={tier._key}
              className={`tier-block${editMode ? ' edit-mode' : ''}`}
              style={{
                gridRow: tierGridRow(tier),
                backgroundColor: `${TIER_COLORS[index % TIER_COLORS.length]}22`,
                borderLeftColor: TIER_COLORS[index % TIER_COLORS.length],
              }}
            >
              {editMode ? (
                <div className="tier-block-edit">
                  <div className="item tier-name-item">
                    <input
                      type="text"
                      value={tier.name}
                      placeholder="Nombre del tier"
                      aria-label="Nombre del tier"
                      onChange={(event) => updateTier(tier._key, { name: event.target.value })}
                    />
                  </div>
                  {renderLevelFields(tier)}
                  <div className="tier-actions">
                    <button type="button" className="btn btn-clear btn-small" onClick={() => updateTier(tier._key, { active: false })}>
                      Desactivar
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => removeTier(tier._key)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="tier-block-view">
                  <span className="tier-name">{tier.name || '(sin nombre)'}</span>
                  <span className="tier-range">{tierLevelLabel(tier)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="ruler-empty-hint">No hay tiers activos</div>
      )}

      {inactiveDrafts.length > 0 && (
        <div className="inactive-section">
          <div className="inactive-section-title">Tiers inactivos</div>
          <div className="inactive-list">
            {inactiveDrafts.map((tier) => (
              <div key={tier._key} className="inactive-tier">
                {editMode ? (
                  <>
                    <div className="inactive-tier-fields">
                      <div className="item tier-name-item">
                        <input
                          type="text"
                          value={tier.name}
                          placeholder="Nombre del tier"
                          aria-label="Nombre del tier"
                          onChange={(event) => updateTier(tier._key, { name: event.target.value })}
                        />
                      </div>
                      {renderLevelFields(tier)}
                    </div>
                    <div className="inactive-tier-actions">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => updateTier(tier._key, { active: true })}>
                        Activar
                      </button>
                      <button type="button" className="btn btn-danger btn-small" onClick={() => removeTier(tier._key)}>
                        Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="inactive-tier-info">
                    <span className="tier-name">{tier.name || '(sin nombre)'}</span>
                    <span className="tier-range">{tierLevelLabel(tier)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!editMode && activeDrafts.length === 0 && inactiveDrafts.length === 0 && (
        <p className="empty-state">
          No hay tiers definidos. Pulsa <strong>Editar</strong> para añadir.
        </p>
      )}
    </div>
  );
}
