import { EntityCrudList } from '../../../../components/admin/EntityCrudList';

export function TabSettings({ systemId }: { systemId: number }) {
  return (
    <EntityCrudList
      entityLabel="Setting"
      loadUrl={`game-systems/${systemId}/setting`}
      itemsKey="settings"
      addUrl={`game-systems/${systemId}/setting/add`}
      updateUrl={(id) => `game-systems/${systemId}/setting/${id}/update`}
      deleteUrl={(id) => `game-systems/${systemId}/setting/${id}/delete`}
      fields={['name', 'slug', 'description', 'active']}
    />
  );
}
