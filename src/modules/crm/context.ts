import { createContext, useContext } from 'react';
import type { ConfigCtxValue, CrmConfig } from '@/types';
import { DEFAULT_STAGES, LOST_REASONS } from '@/styles/theme';

export const ConfigCtx = createContext<ConfigCtxValue>({
  config: { stages: DEFAULT_STAGES, lostReasons: LOST_REASONS },
  setConfig: (_c: CrmConfig) => {},
  isAdmin: false,
});

export const useConfig = () => useContext(ConfigCtx);
