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

export interface KpiMultiViewSeriesPoint {
  t: string;
  value: number;
}

export interface KpiMultiViewData {
  nodeId: string;
  baseline?: string;
  timeWindows: Array<{
    label: string;
    series: KpiMultiViewSeriesPoint[];
  }>;
  radar?: {
    dimensions: Array<{ id: string; label: string; value: number; threshold?: number }>;
  };
  heatmap?: {
    rows: string[];
    cols: string[];
    values: number[][];
  };
  stability?: {
    changeFrequency?: number;
    approvalRate?: number;
    unclosed?: number;
    trend?: Array<{ t: string; value: number }>;
  };
  threshold?: {
    rule?: string;
    mu?: number;
    sigma?: number;
    overrides?: Record<string, { high?: number; low?: number }>;
  };
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
  links?: {
    detailUrl?: string;
    context?: Record<string, string>;
    simBomRef?: { id: string; label: string };
  } | null;
}

export interface XbomSummaryDrawerData {
  summary: XbomSummary;
  drawer?: {
    requirement?: {
      groups: Array<{ title: string; items: Array<{ id: string; description: string }> }>;
    };
    simulation?: {
      cases: Array<{
        caseId: string;
        title: string;
        status: string;
        owner?: string;
        eta?: string;
        completedAt?: string;
        result?: string;
        metrics?: Array<{ name: string; value: number | null; unit?: string }>;
      }>;
    };
    test?: {
      executions: Array<{
        testId: string;
        title: string;
        status: string;
        owner?: string;
        eta?: string;
        completedAt?: string;
        result?: string;
        blockers?: string[];
      }>;
    };
  } | null;
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

export interface JumpLogEntry {
  id: string;
  ts: string;
  system: string;
  target: string;
  actor: {
    type: 'user' | 'ui';
    id: string;
    role?: string;
  };
  context?: Record<string, unknown>;
  status?: string;
}

export interface JumpLogData {
  nodeId: string;
  baseline?: string;
  entries: JumpLogEntry[];
}

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface PageAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type ValidationMatrixStatus = 'pass' | 'partial' | 'running' | 'risk' | 'planned' | 'empty';

export interface ValidationMatrixRequirement {
  id: string;
  title: string;
  phase?: string;
  owner?: string;
  priority?: string;
  status?: 'covered' | 'partial' | 'planned';
  updatedAt?: string;
}

export interface ValidationMatrixVerification {
  id: string;
  title: string;
  type: 'simulation' | 'test' | 'analysis';
  status: 'pass' | 'running' | 'blocked' | 'planned';
  owner?: string;
  lastRunAt?: string | null;
  coverage?: number;
}

export interface ValidationMatrixEntry {
  requirementId: string;
  verificationId: string;
  status: ValidationMatrixStatus;
  evidence?: string;
  note?: string;
}

export interface ValidationMatrixData {
  nodeId: string;
  baseline?: string;
  updatedAt: string;
  summary: {
    coverage: number;
    requirements: number;
    verified: number;
    atRisk: number;
    owners?: string[];
    window?: string;
  };
  filters?: {
    phases?: string[];
    tags?: string[];
    owners?: string[];
  };
  requirements: ValidationMatrixRequirement[];
  verifications: ValidationMatrixVerification[];
  matrix: ValidationMatrixEntry[];
  legend: Record<string, { label: string; color: string }>;
}

export interface ReviewBoardMetrics {
  total: number;
  inProgress: number;
  completed: number;
  atRisk: number;
  nextMilestone?: string;
}

export type ReviewRiskLevel = 'red' | 'amber' | 'green';

export interface ReviewBoardItem {
  id: string;
  title: string;
  status: 'planning' | 'inProgress' | 'decision' | 'closed';
  stage?: string;
  owner?: string;
  scheduledAt?: string;
  risk?: ReviewRiskLevel;
  tags?: string[];
  nextAction?: string;
  decision?: string;
  participants?: string[];
  attachments?: string[];
  remarks?: string;
  checklist?: Array<{ label: string; done: boolean }>;
}

export interface ReviewBoardColumn {
  id: string;
  title: string;
  items: ReviewBoardItem[];
}

export interface ReviewBoardData {
  updatedAt: string;
  metrics: ReviewBoardMetrics;
  columns: ReviewBoardColumn[];
  list: ReviewBoardItem[];
}

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface ImpactGraphNode {
  id: string;
  label: string;
  type: 'part' | 'requirement' | 'simulation' | 'test' | 'process' | 'supplier' | 'document' | 'risk';
  impact: ImpactLevel;
  change?: string;
  owner?: string;
  status?: string;
}

export interface ImpactGraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface ImpactGraphData {
  nodeId: string;
  baseline?: string;
  updatedAt: string;
  factors: Record<ImpactLevel, number>;
  nodes: ImpactGraphNode[];
  edges: ImpactGraphEdge[];
  recommendations?: string[];
}

export interface RiskHeatmap {
  rows: string[];
  cols: string[];
  values: number[][];
}

export interface RiskItem {
  id: string;
  title: string;
  owner?: string;
  severity: 'high' | 'medium' | 'low';
  due: string;
  status: 'open' | 'inProgress' | 'closed' | 'overdue';
  actions?: string[];
  lastUpdated?: string;
}

export interface RiskClosureData {
  updatedAt: string;
  summary: {
    open: number;
    dueSoon: number;
    overdue: number;
    closedRate: number;
    lastReview?: string;
    owners?: string[];
    channels?: string[];
  };
  heatmap: RiskHeatmap;
  risks: RiskItem[];
  contacts?: Record<string, string>;
}

export interface KnowledgeCatalogNode {
  id: string;
  label: string;
  items?: string[];
  children?: KnowledgeCatalogNode[];
}

export interface KnowledgeCollection {
  id: string;
  label: string;
  items: string[];
  description?: string;
}

export interface KnowledgeCatalogData {
  updatedAt: string;
  tree: KnowledgeCatalogNode[];
  collections?: KnowledgeCollection[];
}

export interface TimelineMilestone {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  owner?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  status?: string;
  owner?: string;
  description?: string;
}

export interface TimelineData {
  nodeId: string;
  updatedAt: string;
  milestones?: TimelineMilestone[];
  events: TimelineEvent[];
  categories?: Record<string, { label: string; color: string }>;
}

export interface MessageCenterBucket {
  id: string;
  label: string;
  count: number;
}

export interface MessageAction {
  label: string;
  target?: string;
}

export interface MessageCenterItem {
  id: string;
  type: 'alert' | 'task' | 'info';
  level: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  category?: string;
  createdAt: string;
  status: 'read' | 'unread';
  owner?: string;
  dueAt?: string;
  actions?: MessageAction[];
}

export interface MessageCenterData {
  updatedAt: string;
  channels?: string[];
  buckets?: MessageCenterBucket[];
  messages: MessageCenterItem[];
}

export interface RefreshStrategyItem {
  id: string;
  label: string;
  frequency: string;
  autoRefresh: boolean;
  nextRefreshAt: string | null;
  owner?: string;
  sla?: string;
  status?: 'healthy' | 'warning' | 'blocked';
  channels?: string[];
  notes?: string;
}

export interface ReminderRule {
  id: string;
  condition: string;
  level: AlertLevel;
  channel: string[];
  owner?: string;
  cooldown?: string;
  templates?: string[];
}

export interface PreviewAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
}

export interface RefreshStrategyData {
  updatedAt: string;
  strategies: RefreshStrategyItem[];
  reminderRules?: ReminderRule[];
  previewAlerts?: PreviewAlert[];
}
