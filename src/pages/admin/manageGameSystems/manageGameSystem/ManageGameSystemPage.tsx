import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '../../../../context/PageHeaderContext';
import { Loader } from '../../../../components/Loader';
import { apiService, ApiError } from '../../../../services/apiService';
import { useToast } from '../../../../context/ToastContext';
import { useUser } from '../../../../context/UserContext';
import type { GameSystem } from '../GameSystemFormModal';
import { TabSummary } from './TabSummary';
import { TabSettings } from './TabSettings';
import { TabTiers } from './TabTiers';
import { TabSpecies } from './TabSpecies';
import { TabClasses } from './TabClasses';

const TABS = [
  { value: 'summary', label: 'Resumen' },
  { value: 'settings', label: 'Settings' },
  { value: 'tiers', label: 'Tiers' },
  { value: 'species', label: 'Especies' },
  { value: 'classes', label: 'Clases' },
];

export function ManageGameSystemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setTitle } = usePageHeader();
  const { showToast } = useToast();
  const { logout } = useUser();

  const [system, setSystem] = useState<GameSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('summary');

  useEffect(() => {
    if (!slug?.trim()) {
      navigate('/admin/game-systems', { replace: true });
      return;
    }

    setLoading(true);
    setTitle(slug.trim(), true);

    apiService
      .get<{ game_system: GameSystem }>(`game-systems/${encodeURIComponent(slug.trim())}`)
      .then((response) => {
        if (!response.game_system?.name) throw new Error('Sistema no encontrado');
        setSystem(response.game_system);
        setTitle(response.game_system.name, true);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
        showToast(error instanceof ApiError ? error.message : 'No se pudo cargar el sistema', 'danger');
        navigate('/admin/game-systems', { replace: true });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading || !system) {
    return (
      <div className="page-content">
        <Loader />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="system-tabs-segment">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`segment-btn${selectedTab === tab.value ? ' active' : ''}`}
            onClick={() => setSelectedTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {selectedTab === 'summary' && (
          <TabSummary
            system={system}
            onSlugUpdated={(newSlug) => {
              navigate(`/admin/game-systems/${newSlug}`, { replace: true });
            }}
          />
        )}
        {selectedTab === 'settings' && <TabSettings systemId={system.id} />}
        {selectedTab === 'tiers' && <TabTiers systemId={system.id} />}
        {selectedTab === 'species' && <TabSpecies systemId={system.id} />}
        {selectedTab === 'classes' && <TabClasses systemId={system.id} />}
      </div>
    </div>
  );
}
