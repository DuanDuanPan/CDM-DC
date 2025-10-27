import type {
  SummaryMetric,
  CoverageItem,
  CampaignItem,
  EvidencePackage,
  BlockerItem
} from './VerificationOverview';

export type VerificationPhaseStatus = 'done' | 'warning' | 'risk';
export type VerificationAssetStatus = 'approved' | 'in-review' | 'draft';
export type VerificationStructureRisk = '高' | '中' | '低';
export type RequirementCoverageStatus = 'gap' | 'planned' | 'partial';
export type VerificationResourceStatus = 'conflict' | 'ok';
export type MeasurementStatus = 'warning' | 'ok';
export type SimulationPlanStatus = 'scheduled' | 'risk' | 'done';

export interface VerificationMaturityPhase {
  phase: string;
  target: number;
  actual: number;
  eta: string;
  status: VerificationPhaseStatus;
  owner: string;
}

export interface VerificationAsset {
  id: string;
  name: string;
  owner: string;
  version: string;
  status: VerificationAssetStatus;
  updatedAt: string;
}

export interface VerificationStructureCoverage {
  nodeId: string;
  nodeName: string;
  target: number;
  actual: number;
  blockers: number;
  risk: VerificationStructureRisk;
}

export interface VerificationRequirementMapping {
  requirementId: string;
  title: string;
  linkedTests: number;
  status: RequirementCoverageStatus;
  owner: string;
}

export interface VerificationResourceDependency {
  type: string;
  name: string;
  availability: string;
  status: VerificationResourceStatus;
  owner: string;
  impact: string;
  mitigation?: string;
}

export interface VerificationMeasurementAsset {
  instrument: string;
  calibrationDue: string;
  uncertainty: string;
  status: MeasurementStatus;
  owner: string;
}

export interface SimulationCompareChannel {
  channel: string;
  unit?: string;
  sampleRate?: number;
  min?: number | null;
  max?: number | null;
}

export interface SimulationComparePayload {
  runId: string;
  projectId: string;
  testId: string;
  channels: SimulationCompareChannel[];
  generatedAt?: string;
}

export interface SimulationCorrelationPlan {
  id: string;
  name: string;
  model: string;
  metric: string;
  window: string;
  status: SimulationPlanStatus;
  targetDelta: string;
  lastSyncedAt?: string;
  guidance?: string;
  comparePayload?: SimulationComparePayload | null;
}

export interface SolutionVerificationData {
  summary: SummaryMetric[];
  coverage: CoverageItem[];
  campaigns: CampaignItem[];
  packages: EvidencePackage[];
  blockers: BlockerItem[];
  maturity: VerificationMaturityPhase[];
  assets: VerificationAsset[];
  structureCoverage: VerificationStructureCoverage[];
  requirementMappings: VerificationRequirementMapping[];
  resourceDependencies: VerificationResourceDependency[];
  measurementAssets: VerificationMeasurementAsset[];
  simulationPlan: SimulationCorrelationPlan[];
}
