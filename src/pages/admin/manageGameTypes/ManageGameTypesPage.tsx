import { usePageTitle } from '../../../hooks/usePageTitle';
import { EntityCrudList } from '../../../components/admin/EntityCrudList';

export function ManageGameTypesPage() {
  usePageTitle('Tipos de partida', true);

  return (
    <div className="page-content">
      <EntityCrudList
        entityLabel="Tipo de partida"
        loadUrl="game-types"
        itemsKey="game_types"
        addUrl="game-types/add"
        updateUrl={(id) => `game-types/${id}/update`}
        deleteUrl={(id) => `game-types/${id}/delete`}
        fields={['name', 'active']}
      />
    </div>
  );
}
