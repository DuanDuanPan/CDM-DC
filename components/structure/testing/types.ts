export type TestProjectStatus = 'planned' | 'in-progress' | 'completed' | 'blocked';

export type TestRiskLevel = 'low' | 'medium' | 'high';

export interface TestStructureNode {
  id: string;
  name: string;
  level: number;
  description?: string;
  children?: TestStructureNode[];
}

export interface TestStructureIndexEntry {
  id: string;
  name: string;
  level: number;
  path: string[];
  parentId?: string;
  description?: string;
}

export interface TestTypeDescriptor {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  tone: 'blue' | 'orange' | 'emerald' | 'violet' | 'amber';
  defaultMethods: string[];
  keyMetrics: string[];
}

export interface TestAttachment {
  id: string;
  name: string;
  type: 'spec' | 'report' | 'dataset' | 'video' | 'image' | 'calibration';
  size: string;
  updatedAt: string;
  owner: string;
  url?: string;
  description?: string;
}

export interface TestItemMetric {
  id: string;
  name: string;
  value: string;
  status: 'within-limit' | 'warning' | 'exceeded';
  unit?: string;
  target?: string;
}

export interface TestSchedule {
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  chamber?: string;
}

export interface TestItem {
  id: string;
  name: string;
  status: TestProjectStatus | 'scheduled';
  method: string;
  fixture: string;
  sampleBatch: string;
  environment: string;
  criteria: string;
  instrumentation: string[];
  schedule: TestSchedule;
  metrics: TestItemMetric[];
  attachments: TestAttachment[];
  remarks?: string;
}

export interface TestInsight {
  id: string;
  title: string;
  status: 'risk' | 'blocker' | 'action' | 'info';
  description: string;
  owners: string[];
  dueDate?: string;
}

export interface TestProject {
  id: string;
  code: string;
  name: string;
  structurePath: string[];
  typeId: string;
  status: TestProjectStatus;
  owner: string;
  team: string;
  objective: string;
  scope: string;
  coverage: number;
  readiness: number;
  riskLevel: TestRiskLevel;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  summary: string;
  dependencies: string[];
  instrumentation: string[];
  documents: TestAttachment[];
  items: TestItem[];
  insights: TestInsight[];
}

export interface TestingStats {
  totalProjects: number;
  statusCounts: Record<TestProjectStatus, number>;
  highRiskProjects: number;
  averageCoverage: number;
  averageReadiness: number;
}

export type TestingNodeType = 'structure' | 'type' | 'project' | 'item';

export interface TestingNodeReference {
  type: TestingNodeType;
  id: string;
  structurePath: string[];
  typeId?: string;
  projectId?: string;
  itemId?: string;
}
