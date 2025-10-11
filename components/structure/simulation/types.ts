export type SimulationFileType = 'geometry' | 'model' | 'document' | 'result' | 'report' | 'dataset';

export type SimulationPreviewStatus = 'ready' | 'processing' | 'unavailable' | 'mock';

export type SimulationDimension = 'structure' | 'time' | 'type';

export interface SimulationSavedView {
  id: string;
  name: string;
  createdAt: string;
  dimensions: SimulationDimension[];
  searchKeyword: string;
  filters: SimulationFilters;
}

export interface SimulationTimeBucket {
  id: string;
  month: string;
  year: string;
  label: string;
  totalInstances: number;
  undefinedCount?: number;
}

export interface SimulationStructureNode {
  id: string;
  label: string;
  level: number;
  parentId?: string;
  path: string[];
  instanceIds: string[];
  children?: SimulationStructureNode[];
}

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
  meshInfo?: { nodes: number; elements: number; previewImage: string; viewerUrl?: string; format?: string };
  documentSummary?: string;
  reportSections?: Array<{ title: string; excerpt: string }>;
  pdfUrl?: string;
  docxUrl?: string;
  previewStatus?: SimulationPreviewStatus;
  convertedAt?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageUrls?: string[];
}

export interface SimulationFile {
  id: string;
  name: string;
  type: SimulationFileType;
  version: string;
  belongsToVersion?: string;
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
  docxUrl?: string;
  pdfUrl?: string;
  previewStatus?: SimulationPreviewStatus;
  convertedAt?: string;
  previewVersion?: string;
  preview?: {
    curveData?: Array<{ x: number; y: number }[]>; // multiple curves
    meshInfo?: { nodes: number; elements: number; previewImage: string; viewerUrl?: string; format?: string };
    documentSummary?: string;
    reportSections?: Array<{ title: string; excerpt: string }>;
    pdfUrl?: string;
    docxUrl?: string;
    previewStatus?: SimulationPreviewStatus;
    convertedAt?: string;
    imageUrl?: string;
    imageCaption?: string;
    imageUrls?: string[];
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
  compareVersion?: string;
}

export interface SimulationFolder {
  id: string;
  name: string;
  type: SimulationFileType;
  belongsToVersion?: string;
  description?: string;
  files: SimulationFile[];
  statusSummary?: SimulationStatusSummary[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface SimulationInstanceSnapshot {
  version: string;
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
  tags?: string[];
  riskCount?: number;
  statusSummary?: SimulationStatusSummary[];
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  ownerAvatar?: string;
  owner?: string;
  reviewers?: string[];
  notes?: string;
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
  executedAt?: string;
  timeBucket?: string;
  primaryStructureId?: string;
  structurePath?: string[];
  alternateStructureIds?: string[];
  typeCode?: string;
  typeAnnotationSource?: 'manual' | 'auto';
  versions?: Record<string, SimulationInstanceSnapshot>;
}

export interface SimulationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  instances: SimulationInstance[];
  color?: string;
  summary?: string;
  typeCode?: string;
}
