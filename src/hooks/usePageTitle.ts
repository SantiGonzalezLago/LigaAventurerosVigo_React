import { useEffect } from 'react';
import { usePageHeader } from '../context/PageHeaderContext';

export function usePageTitle(title?: string | null, showBackButton = false) {
  const { setTitle } = usePageHeader();

  useEffect(() => {
    setTitle(title ?? null, showBackButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, showBackButton]);
}
