import type { TbomRunStatus } from '@/components/tbom/types';
import type { TbomDomainKey } from './constants';

export type TbomFilterSnapshot = {
  searchTerm: string;
  typeFilter: string;
  statusFilter: TbomRunStatus[];
  structureSelection?: string;
  expandedTreeIds?: string[];
};

export type TbomNavigationPersistedContext = {
  version: 1;
  timestamp: string;
  selection: {
    level: 'project' | 'test' | 'run';
    projectId: string;
    testId?: string;
    runId?: string;
  };
  filters?: TbomFilterSnapshot;
  anchor: {
    domain: TbomDomainKey;
    refId?: string;
    label?: string;
    ebomNodeId?: string;
    ebomPath?: string;
  };
  extras?: {
    testItemSn?: string;
    assemblyBomId?: string;
    comparePayloadKey?: string;
  };
};
