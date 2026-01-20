export type QuickNavigateTarget = {
  bomType: 'solution' | 'simulation' | 'test' | 'design' | 'requirement';
  tab?: string;
};

export type TransformationStepId = 'rbom' | 'pbom' | 'abom' | 'dbom' | 'caebom' | 'tbom';
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

export interface TransformationPrincipleStageNode {
  nodeId: string;
  nodeName: string;
  path: string[];
  status?: 'selected' | 'candidate' | 'retired';
  note?: string;
}

export type TransformationPrincipleStageMappings = Partial<Record<TransformationStepId, TransformationPrincipleStageNode[]>>;

export interface TransformationPrincipleEvidenceRef {
  stage: 'simulation' | 'test' | 'design' | 'requirement' | 'solution';
  nodeId: string;
  nodeName: string;
  docType: 'simulation' | 'test' | 'analysis' | 'document';
}

export interface TransformationPrincipleGap {
  stage: TransformationStepId;
  description: string;
}

export interface TransformationPrincipleObject {
  principleId: string;
  name: string;
  status: 'selected' | 'candidate' | 'retired';
  category?: 'system' | 'subsystem' | 'component' | 'function';
  coverage?: {
    ratio: number | null;
    relatedNodes: number;
    lastUpdatedAt?: string | null;
  };
  stages: TransformationPrincipleStageMappings;
  evidenceRefs?: TransformationPrincipleEvidenceRef[];
  gaps?: TransformationPrincipleGap[];
}

export interface TransformationGraphNode {
  id: string;
  name: string;
  children?: TransformationGraphNode[];
  highlight?: boolean;
  principleIds?: string[];
  isRoot?: boolean;
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
  principleId?: string;
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
  principleNodeMappings?: Record<string, string[]>;
}

export interface TransformationOverviewData {
  lastSyncedAt: string;
  steps: TransformationOverviewStep[];
  principleHighlight?: TransformationOverviewPrincipleHighlight;
  healthIndicators: TransformationOverviewIndicator[];
  graph?: TransformationOverviewGraphData;
  principleObjects?: TransformationPrincipleObject[];
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

export type RequirementRoleKey =
  | 'system-team'
  | 'assembly-team'
  | 'component-lead'
  | 'simulation-team'
  | 'test-team'
  | 'quality-team'
  | 'management'
  | 'data-steward';

export interface RequirementRoleMetric {
  label: string;
  value: string;
  trend: string;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  note: string;
  source: string;
  updatedAt: string;
}

export interface RequirementRoleFocusArea {
  label: string;
  detail: string;
  icon: string;
}

export interface RequirementRoleStructuredParameter {
  name: string;
  requirement: string;
  current: string;
  gap: string;
  status: 'met' | 'watch' | 'risk';
  note: string;
  source: string;
  updatedAt: string;
}

export interface RequirementRoleActionItem {
  title: string;
  owner: string;
  due: string;
  status: 'open' | 'in-progress' | 'done';
  remark?: string;
}

export interface RequirementRoleInsight {
  title: string;
  overview: string;
  metrics: RequirementRoleMetric[];
  focusAreas: RequirementRoleFocusArea[];
  structuredParameters: RequirementRoleStructuredParameter[];
  linkedRequirements: string[];
  actions: RequirementRoleActionItem[];
}

export interface RequirementItemParameter {
  name: string;
  value: string;
  unit: string;
  range: string;
}

export interface RequirementItemAttachment {
  type: 'document' | 'table' | 'image';
  name: string;
}

export interface RequirementItem {
  id: string;
  name: string;
  type: 'performance' | 'functional' | 'interface' | 'quality';
  priority: 'high' | 'medium' | 'low';
  status: 'in-progress' | 'pending' | 'completed';
  content: string;
  parameters: RequirementItemParameter[];
  attachments?: RequirementItemAttachment[];
}
