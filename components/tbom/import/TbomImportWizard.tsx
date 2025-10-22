'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  TbomImportWizardState,
  TbomImportValidationReport,
  TbomImportMappingState,
  TbomImportSummary,
  TbomImportContractType,
} from './types';
import { TBOM_IMPORT_CONTRACTS } from './types';
import type { TbomImportActions } from '../hooks/useTbomImportState';

const STEP_ITEMS: Array<{ id: TbomImportWizardState['step']; label: string; description: string }> = [
  { id: 'contract', label: '契约类型', description: '选择导入契约并了解覆盖范围' },
  { id: 'validation', label: '客户端校验', description: '上传文件并即时校验结构' },
  { id: 'mapping', label: '映射确认', description: '确认新增/更新策略与冲突' },
  { id: 'summary', label: '导入结果', description: '查看导入摘要与错误日志' },
  { id: 'logs', label: '导入日志', description: '回看历史导入记录' },
];

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1073741824) return `${(size / 1048576).toFixed(1)} MB`;
  return `${(size / 1073741824).toFixed(1)} GB`;
};

const formatDateTime = (iso: string) => {
  try {
    const date = new Date(iso);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch {
    return iso;
  }
};

interface WizardProps {
  state: TbomImportWizardState;
  actions: TbomImportActions;
}

const renderSeverityBadge = (severity: 'error' | 'warning') => {
  const tone =
    severity === 'error'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <i className={severity === 'error' ? 'ri-error-warning-line' : 'ri-alert-line'} aria-hidden />
      {severity === 'error' ? '错误' : '警告'}
    </span>
  );
};

const renderStepIndicator = (step: TbomImportWizardState['step']) => (
  <ol className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    {STEP_ITEMS.map((item, index) => {
      const isActive = item.id === step;
      const isCompleted = STEP_ITEMS.slice(0, STEP_ITEMS.findIndex((entry) => entry.id === step)).some(
        (entry) => entry.id === item.id,
      );
      return (
        <li key={item.id} className="flex flex-1 items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
              isActive
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : isCompleted
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
              {item.label}
            </div>
            <div className="text-xs text-gray-400">{item.description}</div>
          </div>
          {index < STEP_ITEMS.length - 1 && (
            <div className="hidden flex-1 border-t border-dashed border-gray-200 md:block" aria-hidden />
          )}
        </li>
      );
    })}
  </ol>
);

const ContractStep = ({
  contractType,
  onSelect,
  onNext,
}: {
  contractType: TbomImportContractType | null;
  onSelect: (type: TbomImportContractType) => void;
  onNext: () => void;
}) => {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        {TBOM_IMPORT_CONTRACTS.map((contract) => {
          const isActive = contractType === contract.id;
          return (
            <button
              key={contract.id}
              type="button"
              onClick={() => onSelect(contract.id)}
              className={`flex w-full items-start justify-between rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <i className="ri-database-2-line text-lg" aria-hidden />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {contract.label}
                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {contract.version}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{contract.description}</div>
                  </div>
                </div>
              </div>
              {isActive && (
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                  <i className="ri-check-line" aria-hidden />
                  <span className="sr-only">已选择</span>
                </span>
              )}
            </button>
          );
        })}
      </section>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          onClick={onNext}
          disabled={!contractType}
        >
          下一步
          <i className="ri-arrow-right-line" aria-hidden />
        </button>
      </div>
    </div>
  );
};

const ValidationStep = ({
  state,
  onFilesSelected,
  onRunValidation,
}: {
  state: TbomImportWizardState;
  onFilesSelected: (files: FileList | null) => void;
  onRunValidation: () => Promise<void>;
}) => {
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasReport = Boolean(state.validationReport);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = event.dataTransfer.files;
    if (files?.length) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="space-y-6">
      <section
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition ${
          isDragging ? 'border-blue-400 bg-blue-50/60' : 'border-gray-200 bg-white hover:border-blue-300'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="上传 TBOM 数据包"
      >
        <i className="ri-upload-cloud-2-line text-4xl text-blue-500" aria-hidden />
        <div className="mt-3 text-base font-medium text-gray-900">拖放 ZIP / JSON / CSV 文件</div>
        <p className="mt-2 text-sm text-gray-500">
          支持一次选择多个文件或 ZIP 压缩包。文件将仅在本地校验过程中解析。
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".json,.csv,.zip"
          className="hidden"
          onChange={(event) => onFilesSelected(event.target.files)}
        />
      </section>

      {state.selectedFiles.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">已选文件</h3>
            <span className="text-xs text-gray-400">{state.selectedFiles.length} 个文件</span>
          </div>
          <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto text-sm">
            {state.selectedFiles.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <span className="text-gray-400">
                    <i className="ri-file-line" aria-hidden />
                  </span>
                  <span className="truncate font-medium text-gray-900" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          尚未选择文件。
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          校验将解析 JSON 与 CSV 内容，检查字段完整性与跨文件引用，不会离开浏览器。
        </p>
        <button
          type="button"
          onClick={onRunValidation}
          disabled={!state.selectedFiles.length}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          <i className="ri-search-eye-line" aria-hidden />
          运行校验
        </button>
      </div>

      {hasReport && state.validationReport ? (
        <ValidationReport report={state.validationReport} />
      ) : null}
    </div>
  );
};

const ValidationReport = ({ report }: { report: TbomImportValidationReport }) => {
  const errorCount = report.issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = report.issues.filter((issue) => issue.severity === 'warning').length;
  const hasIssues = report.issues.length > 0 || report.missingFiles.length > 0;

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">校验结果</h3>
          <p className="text-xs text-gray-500">共解析 {report.inspectedFiles.length} 个文件</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>错误 {errorCount}</span>
          <span>警告 {warningCount}</span>
          <span>缺失 {report.missingFiles.length}</span>
        </div>
      </div>

      {report.missingFiles.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-700">
          <div className="font-semibold">缺失文件</div>
          <ul className="mt-2 list-disc pl-5">
            {report.missingFiles.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {report.inspectedFiles.map((file) => (
          <div key={file.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{file.name}</span>
              <span>{formatBytes(file.byteSize)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>类型：{file.kind}</span>
              <span>记录数：{file.recordCount}</span>
            </div>
          </div>
        ))}
      </div>

      {hasIssues ? (
        <div className="space-y-3">
          {report.issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    {renderSeverityBadge(issue.severity)}
                    <span className="text-xs text-gray-400">{issue.code}</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-gray-700">{issue.message}</p>
                  {issue.hint ? <p className="mt-1 text-xs text-gray-500">{issue.hint}</p> : null}
                </div>
                {issue.fileName ? (
                  <span className="text-xs font-medium text-gray-500">{issue.fileName}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <i className="ri-checkbox-circle-line mr-2" aria-hidden />
          文件结构通过校验，可以继续进行映射确认。
        </div>
      )}
    </section>
  );
};

const MappingStep = ({
  mapping,
  onStrategyChange,
  onExecute,
  isProcessing,
}: {
  mapping: TbomImportMappingState;
  onStrategyChange: (strategy: 'incremental' | 'overwrite') => void;
  onExecute: () => Promise<void>;
  isProcessing: boolean;
}) => {
  const diffByStatus = useMemo(() => {
    return mapping.differences.reduce<Record<string, typeof mapping.differences>>((acc, diff) => {
      const next = acc[diff.status] ?? [];
      next.push(diff);
      acc[diff.status] = next;
      return acc;
    }, {});
  }, [mapping]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => onStrategyChange('incremental')}
          className={`flex flex-1 min-w-[14rem] flex-col rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            mapping.strategy === 'incremental'
              ? 'border-blue-400 bg-blue-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          <span className="text-sm font-semibold text-gray-900">增量导入</span>
          <p className="mt-1 text-xs text-gray-500">仅追加新增数据，冲突项跳过，保持现有节点不变。</p>
        </button>
        <button
          type="button"
          onClick={() => onStrategyChange('overwrite')}
          className={`flex flex-1 min-w-[14rem] flex-col rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            mapping.strategy === 'overwrite'
              ? 'border-blue-400 bg-blue-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          <span className="text-sm font-semibold text-gray-900">覆盖导入</span>
          <p className="mt-1 text-xs text-gray-500">新增内容追加，已存在条目将覆盖更新，冲突项仍保持不变。</p>
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {Object.entries(mapping.counters).map(([entity, counter]) => (
          <div key={entity} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 uppercase">{entity}</span>
              <span className="text-xs text-gray-400">总计 {counter.total}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <dt className="font-medium text-emerald-600">新增</dt>
                <dd>{counter.new}</dd>
              </div>
              <div>
                <dt className="font-medium text-blue-600">更新</dt>
                <dd>{counter.updated}</dd>
              </div>
              <div>
                <dt className="font-medium text-amber-600">冲突</dt>
                <dd>{counter.conflicts}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">保持</dt>
                <dd>{counter.unchanged}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">差异详情</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>新增 {diffByStatus.new?.length ?? 0}</span>
            <span>更新 {diffByStatus.updated?.length ?? 0}</span>
            <span>冲突 {diffByStatus.conflict?.length ?? 0}</span>
          </div>
        </header>
        <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
          {mapping.differences.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">暂无差异。</div>
          ) : (
            mapping.differences.map((diff) => (
              <article key={`${diff.entity}-${diff.id}`} className="px-4 py-3 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-gray-400">{diff.entity}</span>
                      <span className="font-semibold text-gray-900">{diff.label}</span>
                    </div>
                    {diff.detail ? <p className="mt-1 text-xs text-gray-500">{diff.detail}</p> : null}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      diff.status === 'new'
                        ? 'bg-emerald-100 text-emerald-700'
                        : diff.status === 'updated'
                        ? 'bg-blue-100 text-blue-700'
                        : diff.status === 'conflict'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {diff.status === 'new'
                      ? '新增'
                      : diff.status === 'updated'
                      ? '更新'
                      : diff.status === 'conflict'
                      ? '冲突'
                      : '保持'}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onExecute}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Fragment>
              <i className="ri-loader-4-line animate-spin" aria-hidden />
              正在导入...
            </Fragment>
          ) : (
            <Fragment>
              <i className="ri-rocket-2-line" aria-hidden />
              执行导入
            </Fragment>
          )}
        </button>
      </div>
    </div>
  );
};

const SummaryStep = ({
  summary,
  onViewLogs,
}: {
  summary: TbomImportSummary;
  onViewLogs: () => void;
}) => {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
        <div className="flex items-start gap-3">
          <i className="ri-checkbox-circle-line text-lg" aria-hidden />
          <div>
            <p className="font-medium">导入任务完成</p>
            <p className="mt-1 text-xs text-emerald-800">
              开始于 {formatDateTime(summary.startedAt)}，完成于 {formatDateTime(summary.completedAt)}，耗时{' '}
              {summary.durationMs} ms。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {Object.entries(summary.counters).map(([entity, counter]) => (
          <div key={entity} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 uppercase">{entity}</span>
              <span className="text-xs text-gray-400">
                导入 {counter.imported} / 更新 {counter.updated}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <dt>新增成功</dt>
                <dd className="font-medium text-emerald-600">{counter.imported}</dd>
              </div>
              <div>
                <dt>覆盖更新</dt>
                <dd className="font-medium text-blue-600">{counter.updated}</dd>
              </div>
              <div>
                <dt>跳过</dt>
                <dd>{counter.skipped}</dd>
              </div>
              <div>
                <dt>失败</dt>
                <dd className="text-amber-600">{counter.failed}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      {summary.errors.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-amber-800">存在冲突需要处理</div>
            {summary.errorCsv ? (
              <button
                type="button"
                onClick={() => window.open(summary.errorCsv ?? '#', '_blank')}
                className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                下载错误 CSV
                <i className="ri-download-2-line" aria-hidden />
              </button>
            ) : null}
          </div>
          {summary.errors.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{issue.message}</div>
                  {issue.entity ? <div className="mt-1 text-[11px] text-amber-600">实体：{issue.entity}</div> : null}
                </div>
                {issue.code ? <span className="text-[11px] text-amber-500">{issue.code}</span> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {summary.warnings.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <div className="text-sm font-semibold text-blue-800">提醒</div>
          {summary.warnings.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700">
              {issue.message}
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onViewLogs}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          查看导入日志
          <i className="ri-history-line" aria-hidden />
        </button>
      </div>
    </div>
  );
};

const LogsStep = ({
  logs,
  activeLogId,
  onSelectLog,
}: {
  logs: TbomImportSummary[];
  activeLogId: string | null;
  onSelectLog: (logId: string) => void;
}) => {
  const activeLog = logs.find((log) => log.logId === activeLogId) ?? logs[0];

  return (
    <div className="grid gap-4 md:grid-cols-[18rem,1fr]">
      <aside className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">日志历史</header>
        <ul className="divide-y divide-gray-100 text-sm">
          {logs.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-gray-500">暂无导入日志。</li>
          ) : (
            logs.map((log) => {
              const isActive = activeLog?.logId === log.logId;
              return (
                <li key={log.logId}>
                  <button
                    type="button"
                    onClick={() => onSelectLog(log.logId)}
                    className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{formatDateTime(log.completedAt)}</span>
                    <span className="text-xs">{log.contractType}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="rounded-xl border border-gray-200 bg-white px-4 py-4">
        {activeLog ? (
          <div className="space-y-4 text-sm text-gray-700">
            <header className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">导入摘要</h3>
                <p className="text-xs text-gray-500">
                  开始于 {formatDateTime(activeLog.startedAt)}，完成于 {formatDateTime(activeLog.completedAt)}
                </p>
              </div>
              <span className="text-xs text-gray-400">{activeLog.strategy === 'overwrite' ? '覆盖导入' : '增量导入'}</span>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(activeLog.counters).map(([entity, counter]) => (
                <div key={entity} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 uppercase">{entity}</span>
                    <span>失败 {counter.failed}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <span>新增 {counter.imported}</span>
                    <span>更新 {counter.updated}</span>
                    <span>跳过 {counter.skipped}</span>
                  </div>
                </div>
              ))}
            </div>

            {activeLog.errors.length ? (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <div className="font-semibold">冲突</div>
                {activeLog.errors.map((issue) => (
                  <div key={issue.id} className="rounded border border-amber-100 bg-white px-2 py-1 text-xs text-amber-700">
                    {issue.message}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">请选择日志查看详情。</div>
        )}
      </section>
    </div>
  );
};

export const TbomImportWizard = ({ state, actions }: WizardProps) => {
  const [mounted, setMounted] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (state.summary && state.step === 'summary') {
      setActiveLogId(state.summary.logId);
    }
  }, [state.summary, state.step]);

  useEffect(() => {
    if (state.step === 'logs' && state.logs.length && !activeLogId) {
      setActiveLogId(state.logs[0].logId);
    }
  }, [state.step, state.logs, activeLogId]);

  useEffect(() => {
    if (state.isProcessing && liveRegionRef.current) {
      liveRegionRef.current.textContent = '导入任务进行中';
    } else if (!state.isProcessing && liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, [state.isProcessing]);

  if (!state.isOpen || !mounted) {
    return null;
  }

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tbom-import-wizard-title"
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 id="tbom-import-wizard-title" className="text-lg font-semibold text-gray-900">
              TBOM 数据导入向导
            </h2>
            <p className="text-sm text-gray-500">遵循契约进行校验、映射与导入，支持导入日志追踪。</p>
          </div>
          <button
            type="button"
            onClick={actions.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-gray-300 hover:text-gray-600"
            aria-label="关闭导入向导"
          >
            <i className="ri-close-line text-lg" aria-hidden />
          </button>
        </header>

        <div className="relative flex flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
          {renderStepIndicator(state.step)}

          {state.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-error-warning-line text-lg" aria-hidden />
                  <span>{state.error}</span>
                </div>
                <button
                  type="button"
                  onClick={actions.dismissError}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  我已知晓
                </button>
              </div>
            </div>
          ) : null}

          {state.progressMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <i className="ri-loader-4-line animate-spin" aria-hidden />
              <span>{state.progressMessage}</span>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/60 px-6 py-6">
            {state.step === 'contract' ? (
              <ContractStep
                contractType={state.contractType}
                onSelect={actions.selectContract}
                onNext={() => actions.goToStep('validation')}
              />
            ) : null}

            {state.step === 'validation' ? (
              <ValidationStep
                state={state}
                onFilesSelected={(files) => actions.selectFiles(files ? Array.from(files) : [])}
                onRunValidation={async () => {
                  try {
                    await actions.validate();
                  } catch {
                    // 错误已通过状态反馈
                  }
                }}
              />
            ) : null}

            {state.step === 'mapping' && state.mappingState ? (
              <MappingStep
                mapping={state.mappingState}
                onStrategyChange={actions.setStrategy}
                onExecute={async () => {
                  try {
                    await actions.execute();
                  } catch {
                    // 错误反馈由全局状态处理
                  }
                }}
                isProcessing={state.isProcessing}
              />
            ) : null}

            {state.step === 'summary' && state.summary ? (
              <SummaryStep
                summary={state.summary}
                onViewLogs={() => {
                  actions.goToStep('logs');
                  setActiveLogId(state.summary?.logId ?? null);
                }}
              />
            ) : null}

            {state.step === 'logs' ? (
              <LogsStep
                logs={state.logs}
                activeLogId={activeLogId}
                onSelectLog={(logId) => {
                  setActiveLogId(logId);
                  const log = state.logs.find((entry) => entry.logId === logId);
                  if (log) {
                    actions.showLog(logId);
                  }
                }}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400">
            <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
            <div>
              第 {STEP_ITEMS.findIndex((item) => item.id === state.step) + 1} 步，共 {STEP_ITEMS.length} 步
            </div>
            <div className="flex items-center gap-2">
              {state.step === 'validation' && state.validationReport ? (
                <button
                  type="button"
                  onClick={() => actions.prepareMapping()}
                  disabled={state.validationReport?.issues.some((issue) => issue.severity === 'error')}
                  className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                >
                  进入映射确认
                  <i className="ri-arrow-right-line" aria-hidden />
                </button>
              ) : null}

              {state.step === 'mapping' ? (
                <button
                  type="button"
                  onClick={() => actions.goToStep('validation')}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <i className="ri-arrow-left-line" aria-hidden />
                  返回校验
                </button>
              ) : null}

              {state.step === 'logs' ? (
                <button
                  type="button"
                  onClick={() => actions.goToStep('contract')}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <i className="ri-refresh-line" aria-hidden />
                  重新导入
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default TbomImportWizard;
