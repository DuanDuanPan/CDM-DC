'use client';

import { useCallback, useMemo, useState } from 'react';
import type { SolutionVerificationData } from './types';
import { exportVerificationEvidence, loadEvidenceExportLogs, type EvidenceExportLogEntry } from './evidenceExport';

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

interface VerificationEvidenceExportProps {
  verification: SolutionVerificationData;
  baseline?: string;
  productName?: string;
  captureElement?: HTMLElement | null;
}

const VerificationEvidenceExport = ({ verification, baseline, productName, captureElement }: VerificationEvidenceExportProps) => {
  const [stage, setStage] = useState<string>('');
  const [nodeId, setNodeId] = useState<string>('');
  const [includeImage, setIncludeImage] = useState(true);
  const [includePdf, setIncludePdf] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [logs, setLogs] = useState<EvidenceExportLogEntry[]>(() => loadEvidenceExportLogs());

  const stageOptions = useMemo(() => {
    const set = new Set((verification.maturity ?? []).map(item => item.phase));
    return Array.from(set);
  }, [verification.maturity]);

  const nodeOptions = useMemo(() => (verification.structureCoverage ?? []).map(item => ({ id: item.nodeId, name: item.nodeName })), [verification.structureCoverage]);

  const sectionsSelected = useMemo(() => {
    const baseSections = ['验证成熟度摘要', '方案资产', '资源与计量', '结构覆盖', '仿真对标计划'];
    return [
      ...baseSections,
      ...(includeImage ? ['试验驾驶舱截图'] : []),
      ...(includePdf ? ['试验驾驶舱 PDF'] : [])
    ];
  }, [includeImage, includePdf]);

  const triggerExport = useCallback(
    async (override?: { stage?: string; nodeId?: string }) => {
      setExporting(true);
      setFeedback(null);
      try {
        const result = await exportVerificationEvidence({
          verification,
          stage: override?.stage ?? (stage || undefined),
          nodeId: override?.nodeId ?? (nodeId || undefined),
          includeImage,
          includePdf,
          captureElement,
          baseline,
          productName
        });
        setLogs(result.logs);
        setFeedback({
          type: 'success',
          message: `证据包 ${result.filename} 导出完成（${(result.size / 1024).toFixed(1)} KB）。`
        });
      } catch (error) {
        console.warn('[VerificationEvidenceExport] 导出失败', error);
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : '导出失败，请稍后再试。'
        });
      } finally {
        setExporting(false);
      }
    },
    [baseline, captureElement, includeImage, includePdf, nodeId, productName, stage, verification]
  );

  const handleExport = useCallback(() => {
    void triggerExport();
  }, [triggerExport]);

  const handleReExport = useCallback(
    (entry: EvidenceExportLogEntry) => {
      void triggerExport({ stage: entry.stage, nodeId: entry.nodeId });
    },
    [triggerExport]
  );

  const refreshLogs = useCallback(() => {
    setLogs(loadEvidenceExportLogs());
  }, []);

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-900">试验证据包导出</p>
          <p className="text-xs text-blue-800">
            选择阶段或结构节点，一次导出验证摘要、资产、资源/计量与仿真对标数据，生成 zip（含 CSV / JSON / PDF / PNG）。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium shadow transition ${
              exporting ? 'cursor-not-allowed bg-blue-300 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <i className="ri-download-2-line"></i>
            {exporting ? '打包中…' : '生成证据包'}
          </button>
          <button
            type="button"
            onClick={refreshLogs}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <i className="ri-history-line"></i>
            刷新导出日志
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-blue-800">
          导出阶段
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">全部阶段</option>
            {stageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-blue-800">
          结构节点
          <select
            value={nodeId}
            onChange={(event) => setNodeId(event.target.value)}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">全部结构</option>
            {nodeOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-blue-900">
          <span className="font-semibold text-blue-700">附件选项</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              checked={includeImage}
              onChange={(event) => setIncludeImage(event.target.checked)}
            />
            导出驾驶舱截图（PNG）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              checked={includePdf}
              onChange={(event) => setIncludePdf(event.target.checked)}
            />
            导出驾驶舱 PDF
          </label>
          <p className="text-[11px] text-blue-500">包含：{sectionsSelected.join('、')}</p>
        </div>
      </div>

      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={feedback.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
            <span>{feedback.message}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-blue-100 bg-white px-4 py-4">
        <div className="flex items-center justify-between text-sm text-blue-900">
          <span className="font-semibold">最近导出记录</span>
          <span className="text-xs text-blue-500">保留最近 20 条，可点击“再次导出”重放打包动作。</span>
        </div>
        {logs.length ? (
          <ul className="mt-3 space-y-3">
            {logs.slice(0, 5).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-blue-900">{entry.filename}</div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-[11px] text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                    onClick={() => handleReExport(entry)}
                  >
                    <i className="ri-refresh-line"></i>
                    再次导出
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-blue-600">
                  <span>时间：{new Date(entry.timestamp).toLocaleString()}</span>
                  <span>阶段：{entry.stage ?? '全部'}</span>
                  <span>节点：{entry.nodeId ?? '全部'}</span>
                  <span>大小：{(entry.size / 1024).toFixed(1)} KB</span>
                  {entry.baseline ? <span>基线：{entry.baseline}</span> : null}
                  {entry.productName ? <span>对象：{entry.productName}</span> : null}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-blue-500">包含：{entry.sections.join('、')}</div>
              </li>
            ))}
            {logs.length > 5 ? (
              <li className="text-center text-[11px] text-blue-500">……共 {logs.length} 条记录，使用“刷新导出日志”查看最新。</li>
            ) : null}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/40 px-3 py-6 text-center text-xs text-blue-600">
            <i className="ri-inbox-line text-lg"></i>
            <p className="mt-1">暂无导出记录，点击「生成证据包」即可查看导出历史。</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VerificationEvidenceExport;
