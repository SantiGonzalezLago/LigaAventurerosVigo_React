import { EntityCrudList } from '../../../../components/admin/EntityCrudList';

export function TabSpecies({ systemId }: { systemId: number }) {
  return (
    <EntityCrudList
      entityLabel="Especie"
      loadUrl={`game-systems/${systemId}/species`}
      itemsKey="species"
      addUrl={`game-systems/${systemId}/species/add`}
      updateUrl={(id) => `game-systems/${systemId}/species/${id}/update`}
      deleteUrl={(id) => `game-systems/${systemId}/species/${id}/delete`}
      fields={['name', 'active']}
    />
  );
}
