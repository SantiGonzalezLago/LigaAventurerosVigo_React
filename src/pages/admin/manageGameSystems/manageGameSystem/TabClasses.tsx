import { EntityCrudList } from '../../../../components/admin/EntityCrudList';

export function TabClasses({ systemId }: { systemId: number }) {
  return (
    <EntityCrudList
      entityLabel="Clase"
      loadUrl={`game-systems/${systemId}/class`}
      itemsKey="classes"
      addUrl={`game-systems/${systemId}/class/add`}
      updateUrl={(id) => `game-systems/${systemId}/class/${id}/update`}
      deleteUrl={(id) => `game-systems/${systemId}/class/${id}/delete`}
      fields={['name', 'active']}
    />
  );
}
