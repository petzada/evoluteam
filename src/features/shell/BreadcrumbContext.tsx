'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LabelsMap = Record<string, string>;

type Dispatch = {
  setLabel: (segment: string, label: string) => void;
  clearLabel: (segment: string) => void;
};

const LabelsContext = createContext<LabelsMap>({});
const DispatchContext = createContext<Dispatch | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<LabelsMap>({});

  const dispatch = useMemo<Dispatch>(() => ({
    setLabel: (segment, label) => {
      setLabels((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
    },
    clearLabel: (segment) => {
      setLabels((prev) => {
        if (!(segment in prev)) return prev;
        const next = { ...prev };
        delete next[segment];
        return next;
      });
    },
  }), []);

  return (
    <DispatchContext.Provider value={dispatch}>
      <LabelsContext.Provider value={labels}>
        {children}
      </LabelsContext.Provider>
    </DispatchContext.Provider>
  );
}

export function useBreadcrumbLabels(): LabelsMap {
  return useContext(LabelsContext);
}

export function useRegisterBreadcrumbLabel(segment: string | null | undefined, label: string | null | undefined) {
  const dispatch = useContext(DispatchContext);
  useEffect(() => {
    if (!dispatch || !segment || !label) return;
    dispatch.setLabel(segment, label);
    return () => dispatch.clearLabel(segment);
  }, [dispatch, segment, label]);
}
