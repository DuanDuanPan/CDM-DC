'use client';

import { ensureHtml2Canvas } from '@/components/structure/ebom/exportUtils';
import type { SolutionVerificationData, VerificationMaturityPhase, VerificationStructureCoverage, SimulationCorrelationPlan } from './types';

interface CsvColumn<T> {
  key: keyof T | ((row: T) => string | number | null | undefined);
  header: string;
}

export interface EvidenceExportOptions {
  verification: SolutionVerificationData;
  stage?: string;
  nodeId?: string;
  includeImage?: boolean;
  includePdf?: boolean;
  captureElement?: HTMLElement | null;
  baseline?: string;
  productName?: string;
}

export interface EvidenceExportLogEntry {
  id: string;
  timestamp: string;
  filename: string;
  size: number;
  stage?: string;
  nodeId?: string;
  baseline?: string;
  productName?: string;
  sections: string[];
}

export interface EvidenceExportResult {
  filename: string;
  size: number;
  logs: EvidenceExportLogEntry[];
}

const LOG_STORAGE_KEY = 'testEvidenceExportLogs';

const toCsv = <T extends Record<string, any>>(rows: T[], columns: CsvColumn<T>[]): string => {
  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const header = columns.map(col => escapeValue(col.header)).join(',');
  const body = rows
    .map(row =>
      columns
        .map(col => {
          if (typeof col.key === 'function') {
            return escapeValue(col.key(row));
          }
          return escapeValue(row[col.key as keyof T]);
        })
        .join(',')
    )
    .join('\r\n');
  return `\uFEFF${header}\r\n${body}`;
};

const ensureJsPdf = async (): Promise<any | null> => {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  if (w.jspdf?.jsPDF) {
    return w.jspdf.jsPDF;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('jspdf load failed'));
    document.head.appendChild(script);
  });
  return (window as any).jspdf?.jsPDF ?? null;
};

const filterMaturity = (maturity: VerificationMaturityPhase[], stage?: string) =>
  stage ? maturity.filter(item => item.phase === stage) : maturity;

const filterCoverage = (coverage: VerificationStructureCoverage[], nodeId?: string) =>
  nodeId ? coverage.filter(item => item.nodeId === nodeId) : coverage;

const filterSimulationPlans = (plans: SimulationCorrelationPlan[], stage?: string) => {
  if (!stage) return plans;
  const keywords = ['概念', '初样', '试样', '正样'];
  if (!keywords.includes(stage)) return plans;
  return plans.filter(plan => (plan.guidance || '').includes(stage) || (plan.lastSyncedAt || '').includes(stage));
};

const createManifest = (options: EvidenceExportOptions, summaryCount: number, assetCount: number, resourceCount: number, measurementCount: number, planCount: number) => ({
  generatedAt: new Date().toISOString(),
  stage: options.stage ?? '全部阶段',
  nodeId: options.nodeId ?? '全部结构',
  baseline: options.baseline ?? null,
  productName: options.productName ?? null,
  includeImage: options.includeImage ?? false,
  includePdf: options.includePdf ?? false,
  counts: {
    maturity: summaryCount,
    assets: assetCount,
    resources: resourceCount,
    measurementAssets: measurementCount,
    simulationPlans: planCount
  }
});

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const readLogs = (): EvidenceExportLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EvidenceExportLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLogs = (logs: EvidenceExportLogEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 20)));
  } catch {
    // ignore write errors (quota, private mode etc.)
  }
};

const appendLog = (entry: EvidenceExportLogEntry): EvidenceExportLogEntry[] => {
  const logs = [entry, ...readLogs()];
  writeLogs(logs);
  return logs;
};

export const loadEvidenceExportLogs = (): EvidenceExportLogEntry[] => readLogs();

export async function exportVerificationEvidence(options: EvidenceExportOptions): Promise<EvidenceExportResult> {
  const { verification, stage, nodeId, includeImage = true, includePdf = true, captureElement, baseline, productName } = options;
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const maturity = filterMaturity(verification.maturity ?? [], stage);
  const assets = verification.assets ?? [];
  const resources = verification.resourceDependencies ?? [];
  const measurement = verification.measurementAssets ?? [];
  const simulationPlans = filterSimulationPlans(verification.simulationPlan ?? [], stage);
  const coverage = filterCoverage(verification.structureCoverage ?? [], nodeId);

  const manifest = createManifest(options, maturity.length, assets.length, resources.length, measurement.length, simulationPlans.length);
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  if (maturity.length) {
    zip.file(
      'tables/maturity.csv',
      toCsv(maturity, [
        { header: '阶段', key: 'phase' },
        { header: '目标覆盖率', key: row => Math.round(row.target * 100) + '%' },
        { header: '当前覆盖率', key: row => Math.round(row.actual * 100) + '%' },
        { header: '预计闭环时间', key: 'eta' },
        { header: '状态', key: 'status' },
        { header: '负责人', key: 'owner' }
      ])
    );
  }

  if (assets.length) {
    zip.file(
      'tables/assets.csv',
      toCsv(assets, [
        { header: 'ID', key: 'id' },
        { header: '名称', key: 'name' },
        { header: '责任人', key: 'owner' },
        { header: '版本', key: 'version' },
        { header: '状态', key: 'status' },
        { header: '更新时间', key: 'updatedAt' }
      ])
    );
  }

  if (resources.length) {
    zip.file(
      'tables/resources.csv',
      toCsv(resources, [
        { header: '类型', key: 'type' },
        { header: '名称', key: 'name' },
        { header: '窗口', key: 'availability' },
        { header: '状态', key: 'status' },
        { header: '负责人', key: 'owner' },
        { header: '影响', key: 'impact' },
        { header: '缓解', key: row => row.mitigation ?? '' }
      ])
    );
  }

  if (measurement.length) {
    zip.file(
      'tables/measurement.csv',
      toCsv(measurement, [
        { header: '仪器', key: 'instrument' },
        { header: '校准到期', key: 'calibrationDue' },
        { header: '不确定度', key: 'uncertainty' },
        { header: '状态', key: 'status' },
        { header: '责任人', key: 'owner' }
      ])
    );
  }

  if (simulationPlans.length) {
    zip.file(
      'tables/simulation_plan.csv',
      toCsv(simulationPlans, [
        { header: '计划ID', key: 'id' },
        { header: '名称', key: 'name' },
        { header: '模型', key: 'model' },
        { header: '指标', key: 'metric' },
        { header: '目标偏差', key: 'targetDelta' },
        { header: '窗口', key: 'window' },
        { header: '状态', key: 'status' },
        { header: '同步时间', key: row => row.lastSyncedAt ?? '' },
        { header: '指引', key: row => row.guidance ?? '' },
        { header: 'Compare 运行', key: row => row.comparePayload?.runId ?? '' }
      ])
    );
  }

  if (coverage.length) {
    zip.file(
      'tables/structure_coverage.csv',
      toCsv(coverage, [
        { header: '节点 ID', key: 'nodeId' },
        { header: '节点名称', key: 'nodeName' },
        { header: '目标覆盖率', key: row => Math.round(row.target * 100) + '%' },
        { header: '实际覆盖率', key: row => Math.round(row.actual * 100) + '%' },
        { header: '阻塞数', key: 'blockers' },
        { header: '风险', key: 'risk' }
      ])
    );
  }

  zip.file(
    'tables/summary.json',
    JSON.stringify(
      {
        manifest,
        maturity,
        assets,
        resources,
        measurement,
        simulationPlans,
        coverage
      },
      null,
      2
    )
  );

  let capturedCanvas: HTMLCanvasElement | null = null;
  if (includeImage && captureElement) {
    const html2canvas = await ensureHtml2Canvas();
    if (html2canvas) {
      capturedCanvas = await html2canvas(captureElement, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const pngData = capturedCanvas.toDataURL('image/png');
      const base64 = pngData.split(',')[1];
      zip.file('visuals/test-cockpit.png', base64, { base64: true });
    }
  }

  if (includePdf && capturedCanvas) {
    const JsPDF = await ensureJsPdf();
    if (JsPDF) {
      const orientation = capturedCanvas.width >= capturedCanvas.height ? 'landscape' : 'portrait';
      const pdf = new JsPDF({
        orientation,
        unit: 'px',
        format: [capturedCanvas.width, capturedCanvas.height]
      });
      pdf.addImage(
        capturedCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        capturedCanvas.width,
        capturedCanvas.height
      );
      const blob = pdf.output('blob');
      const buffer = await blob.arrayBuffer();
      zip.file('visuals/test-cockpit.pdf', buffer);
    }
  }

  const filenameParts = ['TestEvidencePackage'];
  if (stage) filenameParts.push(stage);
  if (nodeId) filenameParts.push(nodeId.replace(/[^\w-]+/g, '_'));
  const timestamp = manifest.generatedAt.replace(/[:.]/g, '').replace('T', '-').slice(0, 15);
  filenameParts.push(timestamp);
  const filename = `${filenameParts.join('_')}.zip`;

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, filename);

  const logEntry: EvidenceExportLogEntry = {
    id: `${Date.now()}`,
    timestamp: manifest.generatedAt,
    filename,
    size: blob.size,
    stage,
    nodeId,
    baseline: baseline ?? undefined,
    productName: productName ?? undefined,
    sections: [
      '验证成熟度摘要',
      '方案资产',
      '资源与计量',
      '结构覆盖',
      '仿真对标计划',
      ...(options.includeImage ? ['试验驾驶舱截图'] : []),
      ...(options.includePdf ? ['试验驾驶舱 PDF'] : [])
    ]
  };

  const logs = appendLog(logEntry);

  return { filename, size: blob.size, logs };
}
