export type Confidentiality = '公开' | '内部' | '秘密' | '机密';

export interface Effectivity {
  serialRange?: [string, string];
  dateRange?: [string, string];
  blockPoint?: string;
}

export type EbomParameterDimension = '0D' | '1D' | '2D' | 'matrix';

export type EbomParameterStatus = 'ok' | 'watch' | 'risk';

export interface EbomParameterSource {
  id: string;
  type: '仿真' | '试验' | '文档' | '推导' | '供应商' | '运行数据';
  reference: string;
  summary?: string;
  owner?: string;
  updatedAt?: string;
  confidence?: number;
  link?: string;
  reviewer?: string;
}

export interface EbomParameterDetail {
  id: string;
  name: string;
  value: string;
  unit?: string;
  dimension: EbomParameterDimension;
  status?: EbomParameterStatus;
  trend?: 'up' | 'down' | 'flat';
  target?: string;
  limit?: string;
  description?: string;
  lastUpdated?: string;
  owner?: string;
  tags?: string[];
  assumption?: string;
  verification?: string[];
  baselineContribution?: string;
  sparkline?: Array<{ label: string; value: number }>;
  sources?: EbomParameterSource[];
}

export interface EbomParameterGroup {
  id: string;
  title: string;
  caption?: string;
  focus?: string;
  parameters: EbomParameterDetail[];
}

export interface EbomParameterDeck {
  summary?: string;
  groups: EbomParameterGroup[];
}

export interface EbomPartRef {
  id: string; // unique node id in tree
  partNumber: string;
  name: string;
  revision: string;
  lifecycle: 'Draft' | 'Released' | 'Obsolete';
  confidentiality: Confidentiality;
  class?:
    | 'fan-blade'
    | 'fan-disk'
    | 'compressor-stage'
    | 'combustor-liner'
    | 'turbine-disk'
    | 'turbine-blade'
    | 'gearbox'
    | 'fuel-pump'
    | 'controller'
    | 'generic';
  findNo?: string; // 位置号/Find No.
  qty?: number;
  uom?: string; // EA, g, mL, etc.
  phantom?: boolean;
  safetyCritical?: boolean; // SC/CC 标记
  llp?: boolean; // 寿命限制件标记
  parentId?: string | null;
  effectivity?: Effectivity;
  substitutes?: Array<{ partNumber: string; reason?: string; priority?: number }>;
  links?: {
    designDocId?: string;
    cadId?: string;
    gltfUrl?: string; // 轻量化模型（glTF/GLB）
    posterUrl?: string; // 预览图
    simBomRef?: { id: string; label: string };
    testBomRef?: { id: string; label: string };
    docs?: Array<{
      id: string;
      name: string;
      type: 'spec' | 'drawing' | 'calc' | 'review' | 'report' | 'image';
      version?: string;
      updatedAt?: string;
      owner?: string;
      url?: string;
    }>;
  };
  designParams?: Array<{ name: string; value: string; unit?: string; status?: 'ok' | 'risk' | 'watch' }>;
  parameterDeckId?: string;
  parameterGroups?: EbomParameterGroup[];
}

export interface EbomTreeNode extends EbomPartRef {
  children?: EbomTreeNode[];
}

export interface EbomBaseline {
  id: string; // e.g., EBOM-BL-2025-01
  label: string; // 展示名
  date: string; // YYYY-MM-DD
  description?: string;
  root: EbomTreeNode;
}

export interface EbomDiffChange {
  id: string; // node id (path-like)
  partNumber: string;
  name: string;
  changeType: 'added' | 'removed' | 'modified';
  fields?: Array<{ field: string; from?: string; to?: string }>;
  path: string[]; // tree path names for display
}
