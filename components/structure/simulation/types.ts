export type SimulationFileType = 'geometry' | 'model' | 'document' | 'result' | 'report' | 'dataset';

export type SimulationFileStatus = 'draft' | 'running' | 'completed' | 'failed' | 'archived';

export interface SimulationStatusSummary {
  status: SimulationFileStatus;
  count: number;
  label?: string;
}

export interface SimulationFilters {
  statuses: SimulationFileStatus[];
  owners: string[];
  tags: string[];
  timeRange?: '7d' | '30d' | '90d' | 'all';
}

export interface SimulationCondition {
  id: string;
  name: string;
  description?: string;
  parameters: Array<{
    name: string;
    value: string | number;
    unit?: string;
  }>;
}

export interface SimulationFileVariantPreview {
  curveData?: Array<{ x: number; y: number }[]>;
  meshInfo?: { nodes: number; elements: number; previewImage: string };
  documentSummary?: string;
  reportSections?: Array<{ title: string; excerpt: string }>;
}

export interface SimulationFile {
  id: string;
  name: string;
  type: SimulationFileType;
  version: string;
  size: string;
  status: SimulationFileStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  statusReason?: string;
  ownerAvatar?: string;
  lastRunAt?: string;
  preview?: {
    curveData?: Array<{ x: number; y: number }[]>; // multiple curves
    meshInfo?: { nodes: number; elements: number; previewImage: string };
    documentSummary?: string;
    reportSections?: Array<{ title: string; excerpt: string }>;
  };
  contexts?: {
    project?: string;
    requirementLinks?: string[];
    testLinks?: string[];
  };
  conditions?: SimulationCondition[];
  conditionVariants?: Record<string, SimulationFileVariantPreview>;
  activeConditionId?: string;
  activeConditionName?: string;
  compareKey?: string;
}

export interface SimulationFolder {
  id: string;
  name: string;
  type: SimulationFileType;
  description?: string;
  files: SimulationFile[];
  statusSummary?: SimulationStatusSummary[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface SimulationInstance {
  id: string;
  name: string;
  version: string;
  status: 'approved' | 'in-progress' | 'draft' | 'archived';
  owner: string;
  reviewers: string[];
  createdAt: string;
  updatedAt: string;
  summary: string;
  resources: {
    cpuHours: number;
    memoryGB: number;
    gpuHours?: number;
    costEstimate?: number;
  };
  conditions: SimulationCondition[];
  highlights: Array<{ metric: string; value: string; trend: string; status: 'good' | 'warning' | 'risk' }>;
  folders: SimulationFolder[];
  versionHistory?: Array<{
    version: string;
    date: string;
    change: string;
    owner: string;
  }>;
  compareBaselines?: Array<{ id: string; name: string; type: 'version' | 'condition'; referenceVersion?: string; referenceCondition?: string }>;
  tags?: string[];
  riskCount?: number;
  statusSummary?: SimulationStatusSummary[];
  ownerAvatar?: string;
}

export interface SimulationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  instances: SimulationInstance[];
  color?: string;
  summary?: string;
}
