export type Trust = 'high' | 'mid' | 'low';

export interface CockpitKpiPoint {
  t: string;
  v: number;
}

export type DynamicRuleType = 'mu_sigma' | 'percentile' | 'stage';

export interface DynamicThresholdBounds {
  low?: number;
  high?: number;
  red?: number;
}

export interface DynamicThresholdRule {
  id: string;
  kpiId: string;
  label: string;
  type: DynamicRuleType;
  source: string;
  window?: string;
  stage?: string;
  bounds: DynamicThresholdBounds;
  parameters?: Record<string, unknown>;
  samples?: CockpitKpiPoint[];
  explanation?: string;
  lastEvaluatedAt: string;
}

export interface CockpitKpi {
  id: string;
  label: string;
  unit: string;
  series: CockpitKpiPoint[];
  threshold?: { high?: number; low?: number; rule?: string };
  freshnessSec: number;
  trust: Trust;
  dynamicRule?: DynamicThresholdRule;
}

export interface BaselineHealth {
  changes: { count: number; byType: { added: number; removed: number; modified: number } };
  approvals: { rate: number; pending: number };
  openItems: { count: number };
  maturityScore: number;
}

export interface RequirementSummaryItem {
  id: string;
  title: string;
  status: 'open' | 'done' | 'risk';
  owner?: string;
}

export interface XbomSummary {
  nodeId: string;
  source: { system: string; updatedAt: string; trust: Trust; freshnessSec: number };
  requirement?: { coverage: number; items: RequirementSummaryItem[] } | null;
  simulation?: {
    modelVer: string;
    cases: number;
    lastRunAt?: string;
    hotIssues?: number;
    queueLen?: number;
  } | null;
  test?: {
    plan: number;
    done: number;
    blockers?: number;
    last?: string;
    anomalies?: Array<{ type: string; count: number }>;
  } | null;
  links?: { detailUrl: string; context?: Record<string, string> } | null;
}

interface KnowledgeCardBase {
  id: string;
  title: string;
  snippet: string;
  tags: string[];
  link: string;
  updatedAt: string;
}

export interface ExperienceKnowledgeCard extends KnowledgeCardBase {
  type: 'experience';
  issue: string;
  impact: string;
  solution: string;
  stage?: string;
  owner?: string;
}

export interface StandardKnowledgeCard extends KnowledgeCardBase {
  type: 'standard';
  docId: string;
  version: string;
  scope: string;
  status: 'mandatory' | 'recommended';
  owner?: string;
}

export interface ReviewKnowledgeCard extends KnowledgeCardBase {
  type: 'review';
  meeting: string;
  date: string;
  conclusion: string;
  owner?: string;
  actions?: string[];
}

export interface MaterialKnowledgeCard extends KnowledgeCardBase {
  type: 'material';
  material: string;
  spec: string;
  process: string;
  temperature?: string;
  supplier?: string;
}

export type KnowledgeCard =
  | ExperienceKnowledgeCard
  | StandardKnowledgeCard
  | ReviewKnowledgeCard
  | MaterialKnowledgeCard;
