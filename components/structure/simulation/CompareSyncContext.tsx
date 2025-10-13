import { createContext, useContext } from 'react';

export interface CameraStateSnapshot {
  orbit?: string | null;
  target?: string | null;
  fieldOfView?: string | null;
  timestamp: number;
}

export interface CompareSyncContextValue {
  syncEnabled: boolean;
  setSyncEnabled: (next: boolean) => void;
  lastCamera?: { sourceId: string; state: CameraStateSnapshot };
  updateCamera: (sourceId: string, state: CameraStateSnapshot) => void;
}

const defaultValue: CompareSyncContextValue = {
  syncEnabled: false,
  setSyncEnabled: () => {},
  updateCamera: () => {}
};

export const CompareSyncContext = createContext<CompareSyncContextValue>(defaultValue);

export const useCompareSync = () => useContext(CompareSyncContext);

