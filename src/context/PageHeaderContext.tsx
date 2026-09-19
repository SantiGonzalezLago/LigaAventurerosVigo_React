import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const PageHeaderContext = createContext<{
  title: string | null;
  showBackButton: boolean;
  setTitle: (title?: string | null, showBackButton?: boolean) => void;
} | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);

  const value = useMemo(
    () => ({
      title,
      showBackButton,
      setTitle: (nextTitle?: string | null, nextShowBackButton?: boolean) => {
        setTitleState(typeof nextTitle === 'string' ? nextTitle.trim() : null);
        setShowBackButton(!!nextShowBackButton);
      },
    }),
    [title, showBackButton]
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) throw new Error('usePageHeader debe usarse dentro de PageHeaderProvider');
  return context;
}
