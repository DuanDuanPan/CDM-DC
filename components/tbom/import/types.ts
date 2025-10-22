export type TbomImportContractType = 'minimum-package';

export const TBOM_IMPORT_CONTRACTS: Array<{
  id: TbomImportContractType;
  label: string;
  version: string;
  description: string;
  docsAnchor: string;
}> = [
  {
    id: 'minimum-package',
    label: '最小上载包',
    version: 'v0.4',
    description:
      '包含 TBOM 项目、试验、运行以及核心 CSV 附件的最小可用数据包，满足客户端即时校验与导入需求。',
    docsAnchor: 'minimum-package',
  },
];

export type TbomImportStep =
  | 'contract'
  | 'validation'
  | 'mapping'
  | 'summary'
  | 'logs';

export type TbomImportStrategy = 'incremental' | 'overwrite';

export type TbomImportEntity = 'project' | 'test' | 'run' | 'attachment' | 'event' | 'timeseries';

export interface TbomImportIssue {
  id: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
  hint?: string;
  fileName?: string;
  entity?: TbomImportEntity;
  path?: string;
  row?: number;
  column?: string;
}

export interface TbomImportValidationReport {
  issues: TbomImportIssue[];
  missingFiles: string[];
  inspectedFiles: Array<{
    name: string;
    kind: TbomImportEntity;
    recordCount: number;
    byteSize: number;
  }>;
  sampleDownloadUrl?: string;
}

export interface TbomImportDifference {
  id: string;
  entity: TbomImportEntity;
  status: 'new' | 'updated' | 'conflict' | 'unchanged';
  label: string;
  detail?: string;
}

export interface TbomImportMappingState {
  strategy: TbomImportStrategy;
  differences: TbomImportDifference[];
  counters: Record<
    TbomImportEntity,
    {
      total: number;
      new: number;
      updated: number;
      conflicts: number;
      unchanged: number;
    }
  >;
}

export interface TbomImportSummary {
  logId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  strategy: TbomImportStrategy;
  contractType: TbomImportContractType;
  counters: Record<
    TbomImportEntity,
    {
      imported: number;
      updated: number;
      skipped: number;
      failed: number;
    }
  >;
  errors: TbomImportIssue[];
  warnings: TbomImportIssue[];
  errorCsv?: string;
  logJson?: string;
}

export interface TbomImportLogEntry extends TbomImportSummary {
  createdAt: string;
  title: string;
}

export interface TbomImportWizardState {
  isOpen: boolean;
  step: TbomImportStep;
  isProcessing: boolean;
  progressMessage: string | null;
  contractType: TbomImportContractType | null;
  selectedFiles: File[];
  validationReport: TbomImportValidationReport | null;
  mappingState: TbomImportMappingState | null;
  summary: TbomImportSummary | null;
  error: string | null;
  logs: TbomImportLogEntry[];
}
