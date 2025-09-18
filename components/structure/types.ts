export type RequirementRoleKey =
  | 'system-team'
  | 'assembly-team'
  | 'component-lead'
  | 'simulation-team'
  | 'test-team'
  | 'quality-team'
  | 'management'
  | 'data-steward';

export interface RequirementMetric {
  label: string;
  value: string;
  trend: string;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  note: string;
  source?: string;
  updatedAt?: string;
}

export interface RequirementFocusArea {
  label: string;
  detail: string;
  icon: string;
}

export interface RequirementStructuredParameter {
  name: string;
  requirement: string;
  current: string;
  gap: string;
  status: 'met' | 'risk' | 'watch';
  note: string;
  source?: string;
  updatedAt?: string;
}

export interface RequirementAction {
  title: string;
  owner: string;
  due: string;
  status: 'open' | 'in-progress' | 'done';
  remark?: string;
}

export interface RequirementRoleInsight {
  title: string;
  overview: string;
  metrics: RequirementMetric[];
  focusAreas: RequirementFocusArea[];
  structuredParameters: RequirementStructuredParameter[];
  linkedRequirements: string[];
  actions: RequirementAction[];
}

export interface RequirementParameter {
  name: string;
  value: string;
  unit: string;
  range?: string;
}

export interface RequirementAttachment {
  type: 'image' | 'document' | 'table';
  name: string;
  url?: string;
}

export interface RequirementItem {
  id: string;
  name: string;
  type: 'performance' | 'functional' | 'interface' | 'quality';
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'pending';
  content: string;
  parameters: RequirementParameter[];
  attachments?: RequirementAttachment[];
}
