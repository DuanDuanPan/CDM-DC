'use client';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';
import type { TbomRun, TbomTest } from '@/components/tbom/types';

type TbomNodeDetailProps = {
  selection: TbomSelection | null;
  tests: TbomTest[];
  runs: TbomRun[];
};

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function TbomNodeDetail({ selection, tests, runs }: TbomNodeDetailProps) {
  if (!selection) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-sm text-slate-500 space-y-2">
        <i className="ri-mind-map text-3xl text-slate-400"></i>
        <p>请选择左侧树中的项目 / 试验 / 运行查看详情。</p>
      </div>
    );
  }

  if (selection.level === 'project') {
    const projectTests = tests.filter((test) => test.project_id === selection.project.project_id);
    const projectRuns = runs.filter((run) => projectTests.some((test) => test.test_id === run.test_id));
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            项目
          </span>
          <h2 className="text-2xl font-semibold text-slate-900">{selection.project.title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{selection.project.objectives}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <div className="text-slate-500">所属类型</div>
            <div className="text-base font-semibold text-slate-900 mt-1">{selection.project.type}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <div className="text-slate-500">基线版本</div>
            <div className="text-base font-semibold text-slate-900 mt-1">{selection.project.baseline_id}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <div className="text-slate-500">试验 / 运行</div>
            <div className="text-base font-semibold text-slate-900 mt-1">
              {projectTests.length} / {projectRuns.length}
            </div>
          </div>
        </div>

        <Section title="输入资料">
          {selection.project.input_docs.length === 0 ? (
            <p className="text-sm text-slate-500">暂无输入资料。</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {selection.project.input_docs.map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <i className="ri-file-text-line text-slate-400"></i>
                  <span className="truncate">{doc}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="跨域关联">
          {selection.project.relations.length === 0 ? (
            <p className="text-sm text-slate-500">尚未关联需求、设计或仿真项目。</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {selection.project.relations.map((relation, index) => (
                <li key={`${relation.kind}-${relation.ref_id}-${index}`} className="flex items-center gap-2">
                  <i className="ri-link text-slate-400"></i>
                  <span className="font-medium">{relation.kind.toUpperCase()}</span>
                  <span className="text-slate-500">{relation.ref_id}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    );
  }

  if (selection.level === 'test') {
    const runStats = runs.filter((run) => run.test_id === selection.test.test_id);
    const latestRun = runStats
      .filter((run) => Boolean(run.executed_at))
      .sort((a, b) => new Date(b.executed_at ?? '').getTime() - new Date(a.executed_at ?? '').getTime())[0];

    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
            试验
          </span>
          <h2 className="text-2xl font-semibold text-slate-900">{selection.test.name}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{selection.test.purpose}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="标准与方法">
            {selection.test.spec_refs.length === 0 ? (
              <p className="text-sm text-slate-500">暂无规范引用。</p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {selection.test.spec_refs.map((ref) => (
                  <li key={ref} className="flex items-center gap-2">
                    <i className="ri-bookmark-line text-slate-400"></i>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="挂接结构节点">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <i className="ri-node-tree text-slate-400"></i>
                <span>{selection.test.ebom_node_id ?? '—'}</span>
              </div>
              <div className="text-slate-500 bg-slate-100 rounded-lg px-3 py-2 text-xs leading-relaxed">
                {selection.test.ebom_path ?? '未提供结构路径'}
              </div>
            </div>
          </Section>
        </div>

        <Section title="运行概况">
          <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <div className="text-slate-500">运行次数</div>
              <div className="text-lg font-semibold text-slate-900 mt-1">{runStats.length}</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <div className="text-slate-500">最近执行</div>
              <div className="text-sm font-medium text-slate-900 mt-1">{formatDate(latestRun?.executed_at)}</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <div className="text-slate-500">运行状态</div>
              <div className="text-sm font-medium text-slate-900 mt-1">
                {latestRun?.status ? latestRun.status : '—'}
              </div>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  const run = selection.run;
  const attachmentsCount = run.attachments?.length ?? 0;
  const environmentEntries = Object.entries(run.environment ?? {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
          运行
        </span>
        <h2 className="text-2xl font-semibold text-slate-900">{run.run_id}</h2>
        <span className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white">
          状态：{run.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
          <div className="text-slate-500">计划时间</div>
          <div className="text-base font-semibold text-slate-900 mt-1">{formatDate(run.planned_at)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
          <div className="text-slate-500">执行时间</div>
          <div className="text-base font-semibold text-slate-900 mt-1">{formatDate(run.executed_at)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
          <div className="text-slate-500">操作员</div>
          <div className="text-base font-semibold text-slate-900 mt-1">{run.operator ?? '—'}</div>
        </div>
      </div>

      <Section title="试验环境">
        {environmentEntries.length === 0 ? (
          <p className="text-sm text-slate-500">未提供环境参数。</p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700">
            {environmentEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <dt className="text-slate-500">{key}</dt>
                <dd className="font-medium text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section title="附件 / 记录">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <i className="ri-attachment-2 text-slate-400"></i>
          <span>
            附件 <span className="font-semibold text-slate-900">{attachmentsCount}</span> 项
          </span>
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
          title="运行详情页将在 Story 1.6 实现"
        >
          <i className="ri-time-line" />
          查看运行详情（预计 Story 1.6）
        </button>
      </div>
    </div>
  );
}
