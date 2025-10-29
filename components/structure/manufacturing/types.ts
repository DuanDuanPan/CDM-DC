export type ReadinessStatus = 'good' | 'warning' | 'risk';

export interface ManufacturingReadinessMetric {
  label: string;
  value: number; // 0-1 normalized
  status: ReadinessStatus;
  note?: string;
}

export interface ManufacturingReadinessSummary {
  score: number; // overall readiness 0-1
  gateCompletion: number; // stage-gate completion 0-1
  riskHeat: number; // aggregated risk exposure 0-1
  metrics: ManufacturingReadinessMetric[];
}

export type StageGateStatus = 'open' | 'in-progress' | 'done';

export interface StageGateChecklistItem {
  id: string;
  title: string;
  owner: string;
  status: StageGateStatus;
  updatedAt: string; // ISO or readable date string
  note?: string;
}

export type ManufacturingAssumptionConfidence = 'low' | 'medium' | 'high';
export type ManufacturingAssumptionStatus = 'pending' | 'validating' | 'validated';

export interface ManufacturingAssumption {
  id: string;
  topic: string;
  source: string;
  confidence: ManufacturingAssumptionConfidence;
  status: ManufacturingAssumptionStatus;
  nextAction?: string;
  dueAt?: string;
}

export type ManufacturingRiskSeverity = 'amber' | 'red';

export interface ManufacturingRiskHighlight {
  id: string;
  title: string;
  severity: ManufacturingRiskSeverity;
  impact: string;
  mitigation: string;
  owner: string;
  reviewAt: string;
  updatedAt: string;
}

export type CollaborationTriggerId = 'review' | 'request-input' | 'sync-baseline';

export interface ManufacturingCollaborationTrigger {
  id: CollaborationTriggerId;
  label: string;
  description: string;
  owner: string;
  lastTriggeredAt?: string;
}

export interface ManufacturingCollaborationInfo {
  triggers: ManufacturingCollaborationTrigger[];
  updatedAt: string;
  note?: string;
}

export interface ManufacturingSnapshotMeta {
  version: string;
  publishedAt: string;
  author: string;
  note?: string;
}

export interface ManufacturingOverviewData {
  readinessSummary: ManufacturingReadinessSummary;
  stageGates: StageGateChecklistItem[];
  assumptions: ManufacturingAssumption[];
  riskHighlights: ManufacturingRiskHighlight[];
  riskRegisterLink?: string;
  collaboration: ManufacturingCollaborationInfo;
  snapshot: ManufacturingSnapshotMeta;
}
