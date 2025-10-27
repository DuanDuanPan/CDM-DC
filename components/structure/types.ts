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
