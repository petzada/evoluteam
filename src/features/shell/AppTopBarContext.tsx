'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

type TopBarState = {
  title: string | null;
  actions: React.ReactNode | null;
};

const defaultState: TopBarState = { title: null, actions: null };

type AppTopBarContextValue = TopBarState & {
  setTopBar: (next: Partial<TopBarState>) => void;
  clearTopBar: () => void;
};

const AppTopBarContext = createContext<AppTopBarContextValue | null>(null);

export function AppTopBarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TopBarState>(defaultState);

  const setTopBar = useCallback((next: Partial<TopBarState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const clearTopBar = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({ ...state, setTopBar, clearTopBar }),
    [state, setTopBar, clearTopBar],
  );

  return <AppTopBarContext.Provider value={value}>{children}</AppTopBarContext.Provider>;
}

export function useAppTopBar(): AppTopBarContextValue {
  const ctx = useContext(AppTopBarContext);
  if (!ctx) {
    throw new Error('useAppTopBar must be used within AppTopBarProvider');
  }
  return ctx;
}

/** Registra título e ações na TopBar; limpa só ao desmontar (evita flash se `actions` mudar de referência). */
export function SetAppTopBar({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  const { setTopBar, clearTopBar } = useAppTopBar();

  useLayoutEffect(() => {
    setTopBar({ title, actions: actions ?? null });
  }, [title, actions, setTopBar]);

  useLayoutEffect(() => {
    return () => clearTopBar();
  }, [clearTopBar]);

  return null;
}
