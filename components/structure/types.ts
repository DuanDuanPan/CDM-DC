export type QuickNavigateTarget = {
  bomType: 'solution' | 'simulation' | 'test' | 'design' | 'requirement';
  tab?: string;
};

export type TransformationStepId = 'rbom' | 'abom' | 'dbom' | 'caebom' | 'tbom';
export type TransformationLinkKind = 'principle' | 'baseline' | 'evidence';
export type TransformationLinkVisibility = Partial<Record<TransformationLinkKind, boolean>>;

export interface TransformationOverviewStep {
  id: TransformationStepId;
  title: string;
  subtitle: string;
  icon: string;
  highlights: string[];
  bomTarget: QuickNavigateTarget;
  warnings?: Array<{ level: 'info' | 'warning' | 'error'; message: string }>;
}

export interface TransformationOverviewPrincipleHighlight {
  id: string;
  name: string;
  status: 'candidate' | 'selected' | 'retired';
  coverage: number;
  relatedNodes: number;
  updatedAt: string;
}

export interface TransformationOverviewIndicator {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
  status: 'good' | 'warn' | 'alert';
  hint?: string;
  link?: QuickNavigateTarget;
}

export interface TransformationGraphNode {
  id: string;
  name: string;
  children?: TransformationGraphNode[];
  highlight?: boolean;
}

export interface TransformationGraphStage {
  id: TransformationStepId;
  title: string;
  tree: TransformationGraphNode;
}

export interface TransformationGraphLinkEndpoint {
  stageId: TransformationStepId;
  nodeId: string;
}

export interface TransformationGraphLink {
  source: TransformationGraphLinkEndpoint;
  target: TransformationGraphLinkEndpoint;
  kind?: TransformationLinkKind;
}

export interface TransformationPathSummary {
  id: string;
  title: string;
  kind: TransformationLinkKind;
  steps: string[];
  description?: string;
}

export interface TransformationOverviewGraphData {
  stages: TransformationGraphStage[];
  links: TransformationGraphLink[];
  summaries?: TransformationPathSummary[];
}

export interface TransformationOverviewData {
  lastSyncedAt: string;
  steps: TransformationOverviewStep[];
  principleHighlight?: TransformationOverviewPrincipleHighlight;
  healthIndicators: TransformationOverviewIndicator[];
  graph?: TransformationOverviewGraphData;
}

export interface BomNode {
  id: string;
  name: string;
  level: number;
  bomType?: string;
  unitType?: string;
  nodeCategory?: string;
  schemeType?: string;
  description?: string;
  subsystemType?: string;
  children?: BomNode[];
}

export interface BomType {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
}

export interface Version {
  id: string;
  name: string;
  date: string;
  author: string;
  description: string;
  status: 'current' | 'baseline' | 'archived';
}

export interface InputData {
  id: string;
  name: string;
  type: 'parameter' | 'file';
  value?: string;
  unit?: string;
  category?: 'design' | 'performance' | 'material' | 'geometry';
  source?: 'manual' | 'calculation' | 'simulation' | 'test';
  fileType?: 'cad' | 'document' | 'simulation' | 'test_data' | 'image';
  size?: string;
  version?: string;
  status?: 'active' | 'archived' | 'draft';
  lastUpdated: string;
  updatedBy: string;
}

export interface OutputData {
  id: string;
  name: string;
  category: 'scheme_doc' | 'condition_lib' | 'performance_budget' | 'power_balance' | 'control_sequence' | 'vv_plan' | 'risk_reliability' | 'icd_xbom' | 'baseline_strategy';
  type: 'document' | 'model' | 'data' | 'chart' | 'table' | 'plan' | 'matrix';
  format: string;
  status: 'draft' | 'review' | 'approved' | 'baseline';
  completeness: number;
  version: string;
  lastUpdated: string;
  updatedBy: string;
  description: string;
  parameters?: Array<{
    name: string;
    value: string;
    unit: string;
    description: string;
  }>;
  dependencies?: string[];
  deliverables?: string[];
}
