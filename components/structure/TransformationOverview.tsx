'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Tooltip from '@/components/common/Tooltip';
import { useMarkdownPreview } from '@/app/hooks/useMarkdownPreview';
import { useTransformationOverview } from '@/components/structure/hooks/useTransformationOverview';
import TransformationFlowGraph from '@/components/structure/TransformationFlowGraph';
import type {
  QuickNavigateTarget,
  TransformationOverviewIndicator,
  TransformationOverviewStep,
  TransformationLinkKind,
  TransformationStepId,
  TransformationPrincipleObject,
  TransformationPrincipleStageNode,
  TransformationOverviewGraphData,
} from '@/components/structure/types';

type TransformationOverviewProps = {
  onQuickNavigate: (target: QuickNavigateTarget) => void;
};

const INDICATOR_STYLES: Record<TransformationOverviewIndicator['status'], string> = {
  good: 'border-green-200 bg-green-50 text-green-600',
  warn: 'border-amber-200 bg-amber-50 text-amber-600',
  alert: 'border-rose-200 bg-rose-50 text-rose-600',
};

const INDICATOR_ICONS: Record<TransformationOverviewIndicator['status'], string> = {
  good: 'ri-checkbox-circle-line',
  warn: 'ri-error-warning-line',
  alert: 'ri-alarm-warning-line',
};

const WARNING_COLOR: Record<'info' | 'warning' | 'error', string> = {
  info: 'bg-sky-50 text-sky-600 border-sky-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  error: 'bg-rose-50 text-rose-600 border-rose-200',
};

const PRINCIPLE_STAGE_ORDER: Array<{ id: TransformationStepId; label: string }> = [
  { id: 'rbom', label: 'RBOM · 需求' },
  { id: 'abom', label: 'ABOM · 方案' },
  { id: 'dbom', label: 'DBOM · 设计' },
  { id: 'caebom', label: 'CAEBOM · 仿真' },
  { id: 'tbom', label: 'TBOM · 试验' },
];

const PRINCIPLE_STATUS_META: Record<TransformationPrincipleObject['status'], { label: string; badge: string }> = {
  selected: { label: '选定', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  candidate: { label: '候选', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  retired: { label: '已退役', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PRINCIPLE_CATEGORY_META: Record<NonNullable<TransformationPrincipleObject['category']>, { label: string; icon: string }> = {
  system: { label: '系统级', icon: 'ri-stack-line' },
  subsystem: { label: '子系统', icon: 'ri-puzzle-2-line' },
  component: { label: '部组件', icon: 'ri-tools-line' },
  function: { label: '功能单元', icon: 'ri-flow-chart' },
};

const PRINCIPLE_NODE_STATUS_META: Record<NonNullable<TransformationPrincipleStageNode['status']>, { label: string; tone: string }> = {
  selected: { label: '选定', tone: 'bg-blue-100 text-blue-600 border-blue-200' },
  candidate: { label: '候选', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  retired: { label: '退役', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function normalizePrincipleNodeId(principleId: string) {
  return `pbom-${principleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function cloneGraph(graph: TransformationOverviewGraphData): TransformationOverviewGraphData {
  return JSON.parse(JSON.stringify(graph)) as TransformationOverviewGraphData;
}

function indexStageNodes(stages: TransformationOverviewGraphData['stages']) {
  const nodeSet = new Set<string>();
  const walk = (stageId: TransformationStepId, node: { id: string; children?: { id: string }[] }) => {
    nodeSet.add(`${stageId}:${node.id}`);
    node.children?.forEach((child) => walk(stageId, child));
  };

  stages.forEach((stage) => {
    walk(stage.id, stage.tree);
  });

  return nodeSet;
}

function buildPrincipleStage(principles: TransformationPrincipleObject[], highlightId?: string) {
  return {
    id: 'pbom' as TransformationStepId,
    title: 'PBOM · 原理对象',
    tree: {
      id: 'pbom-root',
      name: '原理对象',
      children: principles.map((principle) => ({
        id: normalizePrincipleNodeId(principle.principleId),
        name: principle.name,
        highlight: principle.principleId === highlightId,
      })),
    },
  } as const;
}

function augmentGraphWithPrinciples(
  graph: TransformationOverviewGraphData,
  principles: TransformationPrincipleObject[],
  highlightId?: string
): TransformationOverviewGraphData {
  if (!principles.length) {
    return graph;
  }

  const cloned = cloneGraph(graph);
  const pbomStage = buildPrincipleStage(principles, highlightId);
  const existingIndex = cloned.stages.findIndex((stage) => stage.id === 'pbom');
  if (existingIndex >= 0) {
    cloned.stages.splice(existingIndex, 1);
  }
  cloned.stages.unshift(pbomStage);

  const nodeSet = indexStageNodes(cloned.stages);
  const mapping: Record<string, string[]> = { ...(cloned.principleNodeMappings ?? {}) };

  const addMapping = (stageId: TransformationStepId, nodeId: string, principleId: string) => {
    const key = `${stageId}:${nodeId}`;
    if (!mapping[key]) {
      mapping[key] = [principleId];
      return;
    }
    if (!mapping[key].includes(principleId)) {
      mapping[key].push(principleId);
    }
  };

  const nonPrincipleLinks = (cloned.links ?? []).filter((link) => link.kind !== 'principle');
  const principleLinks = principles.flatMap((principle) => {
    const pbomNodeId = normalizePrincipleNodeId(principle.principleId);
    const pbomKey = `pbom:${pbomNodeId}`;
    if (!nodeSet.has(pbomKey)) {
      return [];
    }

    addMapping('pbom', pbomNodeId, principle.principleId);

    const links = [] as TransformationOverviewGraphData['links'];
    const stageOrder: TransformationStepId[] = ['rbom', 'abom', 'dbom', 'caebom', 'tbom'];

    stageOrder.forEach((stageId) => {
      const mappings = principle.stages?.[stageId];
      if (!mappings?.length) {
        return;
      }

      mappings.forEach((node) => {
        const nodeKey = `${stageId}:${node.nodeId}`;
        if (!nodeSet.has(nodeKey)) {
          return;
        }

        addMapping(stageId, node.nodeId, principle.principleId);

        if (stageId === 'rbom') {
          links.push({
            kind: 'principle',
            source: { stageId: 'rbom', nodeId: node.nodeId },
            target: { stageId: 'pbom', nodeId: pbomNodeId },
            principleId: principle.principleId,
          });
        } else {
          links.push({
            kind: 'principle',
            source: { stageId: 'pbom', nodeId: pbomNodeId },
            target: { stageId, nodeId: node.nodeId },
            principleId: principle.principleId,
          });
        }
      });
    });

    return links;
  });

  cloned.links = [...nonPrincipleLinks, ...principleLinks];
  cloned.principleNodeMappings = mapping;
  return cloned;
}

function formatDateTime(value: string | undefined) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyInlineFormatting(raw: string) {
  let text = escapeHtml(raw);

  const codeSnippets: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_, inner: string) => {
    const token = `@@CODE_${codeSnippets.length}@@`;
    codeSnippets.push(
      `<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">${escapeHtml(inner)}</code>`
    );
    return token;
  });

  const boldSnippets: string[] = [];
  text = text.replace(/(\*\*|__)(.+?)\1/g, (_, __, inner: string) => {
    const token = `@@BOLD_${boldSnippets.length}@@`;
    boldSnippets.push(`<span class="font-semibold text-slate-900">${applyInlineFormatting(inner)}</span>`);
    return token;
  });

  const italicSnippets: string[] = [];
  text = text.replace(/(\*|_)([^*_]+?)\1/g, (_, __, inner: string) => {
    const token = `@@ITALIC_${italicSnippets.length}@@`;
    italicSnippets.push(`<em class="italic text-slate-700">${applyInlineFormatting(inner)}</em>`);
    return token;
  });

  italicSnippets.forEach((snippet, index) => {
    text = text.replace(`@@ITALIC_${index}@@`, snippet);
  });
  boldSnippets.forEach((snippet, index) => {
    text = text.replace(`@@BOLD_${index}@@`, snippet);
  });
  codeSnippets.forEach((snippet, index) => {
    text = text.replace(`@@CODE_${index}@@`, snippet);
  });

  return text;
}

function parseTable(lines: string[], startIndex: number) {
  const tableLines: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const raw = lines[index];
    if (!raw.trim().startsWith('|')) {
      break;
    }
    if (raw.trim().length === 1) {
      break;
    }
    tableLines.push(raw.trim());
    index += 1;
  }

  if (tableLines.length < 2) {
    return { html: '', nextIndex: startIndex + 1 };
  }

  const headerCells = tableLines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);

  const bodyLines = tableLines.slice(1).filter((line) => !/^(\|\s*-+\s*)+\|?$/.test(line));
  const rows = bodyLines.map((line) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  if (!headerCells.length || !rows.length) {
    return { html: '', nextIndex: index };
  }

  const headerHtml = headerCells
    .map(
      (cell) =>
        `<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">${applyInlineFormatting(
          cell
        )}</th>`
    )
    .join('');
  const bodyHtml = rows
    .map((cells) => {
      const rowHtml = cells
        .map((cell) => `<td class="px-3 py-2 align-top text-xs text-slate-700">${applyInlineFormatting(cell)}</td>`)
        .join('');
      return `<tr class="border-t border-slate-200 last:border-b">${rowHtml}</tr>`;
    })
    .join('');

  const theadHtml = headerHtml
    ? `<thead class="bg-slate-50"><tr>${headerHtml}</tr></thead>`
    : '';
  const tableHtml = `<table class="w-full border-collapse text-sm">${theadHtml}<tbody>${bodyHtml}</tbody></table>`;
  const html = `<div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">${tableHtml}</div>`;

  return { html, nextIndex: index };
}

function simpleMarkdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let html = '';
  let inUl = false;
  let inOl = false;
  let inCode = false;
  const codeBuffer: string[] = [];

  const closeLists = () => {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
    if (inOl) {
      html += '</ol>';
      inOl = false;
    }
  };

  const flushParagraph = (content: string) => {
    if (!content.trim()) return;
    html += `<p class="mt-2 text-sm text-slate-600">${applyInlineFormatting(content.trim())}</p>`;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    if (inCode) {
      if (line.trim().startsWith('```')) {
        html += `<pre class="mt-4 overflow-x-auto rounded-xl bg-slate-900/90 p-4 text-xs text-slate-100"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
        codeBuffer.length = 0;
        inCode = false;
        continue;
      }
      codeBuffer.push(rawLine);
      continue;
    }

    if (line.trim().startsWith('```')) {
      closeLists();
      inCode = true;
      codeBuffer.length = 0;
      continue;
    }

    if (!line.trim()) {
      closeLists();
      html += '<div class="h-3"></div>';
      continue;
    }

    if (line.trim().startsWith('|')) {
      closeLists();
      const { html: tableHtml, nextIndex } = parseTable(lines, i);
      if (tableHtml) {
        html += tableHtml;
        i = nextIndex - 1;
        continue;
      }
    }

    if (line.startsWith('### ')) {
      closeLists();
      html += `<h3 class="mt-6 text-lg font-semibold text-slate-900">${escapeHtml(line.slice(4).trim())}</h3>`;
      continue;
    }
    if (line.startsWith('## ')) {
      closeLists();
      html += `<h2 class="mt-6 text-xl font-semibold text-slate-900">${escapeHtml(line.slice(3).trim())}</h2>`;
      continue;
    }
    if (line.startsWith('# ')) {
      closeLists();
      html += `<h1 class="mt-6 text-2xl font-semibold text-slate-900">${escapeHtml(line.slice(2).trim())}</h1>`;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inUl) {
        closeLists();
        html += '<ul class="mt-3 list-disc pl-5 text-sm text-slate-600">';
        inUl = true;
      }
      html += `<li class="mt-1 leading-relaxed">${applyInlineFormatting(line.slice(2).trim())}</li>`;
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      if (!inOl) {
        closeLists();
        html += '<ol class="mt-3 list-decimal pl-5 text-sm text-slate-600">';
        inOl = true;
      }
      html += `<li class="mt-1 leading-relaxed">${applyInlineFormatting(line.replace(/^\d+\.\s/, '').trim())}</li>`;
      continue;
    }

    closeLists();
    flushParagraph(line);
  }

  closeLists();

  if (inCode) {
    html += `<pre class="mt-4 overflow-x-auto rounded-xl bg-slate-900/90 p-4 text-xs text-slate-100"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
  }

  return html;
}

function StepCard({ step, onNavigate }: { step: TransformationOverviewStep; onNavigate: (target: QuickNavigateTarget) => void }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-blue-200">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <i className={`${step.icon} text-lg`} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
            <p className="text-[11px] text-slate-500">{step.subtitle}</p>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-slate-600">
          {step.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <i className="ri-checkbox-circle-line mt-0.5 text-blue-500"></i>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {step.warnings?.map((warn) => (
          <div
            key={warn.message}
            className={`mt-3 rounded-xl border px-3 py-2 text-[11px] font-medium ${WARNING_COLOR[warn.level]}`}
          >
            <i className="ri-alert-line mr-1" />
            {warn.message}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onNavigate(step.bomTarget)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        打开 {step.title.split(' · ')[0]}
        <i className="ri-arrow-right-line text-sm" />
      </button>
    </article>
  );
}

type PrincipleObjectCardProps = {
  principle: TransformationPrincipleObject;
  active?: boolean;
  onSelect?: (principleId: string | null) => void;
};

function PrincipleStageListItem({ node }: { node: TransformationPrincipleStageNode }) {
  const statusMeta = node.status ? PRINCIPLE_NODE_STATUS_META[node.status] : null;
  return (
    <li className="rounded-lg border border-slate-200 bg-white/90 px-3 py-2">
      <div className="text-sm font-medium text-slate-900">{node.nodeName}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span>{node.path.join(' / ')}</span>
        {statusMeta ? (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${statusMeta.tone}`}>
            {statusMeta.label}
          </span>
        ) : null}
      </div>
      {node.note ? <div className="mt-1 text-[11px] text-slate-400">{node.note}</div> : null}
    </li>
  );
}

function PrincipleObjectCard({ principle, active, onSelect }: PrincipleObjectCardProps) {
  const statusMeta = PRINCIPLE_STATUS_META[principle.status];
  const coverageRatio = principle.coverage?.ratio;
  const coverageText = typeof coverageRatio === 'number' && coverageRatio !== null ? `${Math.round(coverageRatio * 100)}%` : '—';
  const relatedNodes = principle.coverage?.relatedNodes ?? 0;
  const updatedAt = principle.coverage?.lastUpdatedAt ? formatDateTime(principle.coverage.lastUpdatedAt) : '—';
  const categoryMeta = principle.category ? PRINCIPLE_CATEGORY_META[principle.category] : null;

  const stageRows = PRINCIPLE_STAGE_ORDER.map(({ id, label }) => {
    const nodes = principle.stages?.[id] ?? [];
    if (!nodes || nodes.length === 0) {
      return null;
    }
    return {
      id,
      label,
      nodes,
    };
  }).filter(Boolean) as Array<{ id: TransformationStepId; label: string; nodes: TransformationPrincipleStageNode[] }>;

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border bg-white/95 p-4 shadow-sm transition ${
        active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'
      }`}
      role="button"
      tabIndex={onSelect ? 0 : -1}
      onClick={() => onSelect?.(principle.principleId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(principle.principleId);
        }
      }}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {categoryMeta ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <i className={`${categoryMeta.icon} text-sm`}></i>
              </span>
            ) : null}
            <h4 className="text-sm font-semibold text-slate-900">{principle.name}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${statusMeta.badge}`}>
              <i className="ri-checkbox-circle-line"></i>
              {statusMeta.label}
            </span>
            <span>覆盖率：{coverageText}</span>
            <span>覆盖节点：{relatedNodes}</span>
            <span>最近更新：{updatedAt}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <i className="ri-hashtag"></i>
            {principle.principleId}
          </span>
          {categoryMeta ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              {categoryMeta.label}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stageRows.map((stage) => (
          <section key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <h5 className="text-xs font-semibold text-slate-700">{stage.label}</h5>
            <ul className="mt-2 flex flex-col gap-2">
              {stage.nodes.map((node) => (
                <PrincipleStageListItem key={`${stage.id}-${node.nodeId}`} node={node} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {principle.evidenceRefs && principle.evidenceRefs.length ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700">
          <div className="flex items-center gap-2 font-semibold">
            <i className="ri-file-paper-2-line"></i>
            关联验证证据
          </div>
          <ul className="mt-2 space-y-1">
            {principle.evidenceRefs.map((ref) => (
              <li key={`${principle.principleId}-${ref.nodeId}`} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  {ref.stage.toUpperCase()}
                </span>
                <span className="text-slate-700">{ref.nodeName}</span>
                <span className="text-[11px] text-slate-500">{ref.docType === 'simulation' ? '仿真报告' : ref.docType === 'test' ? '试验结论' : '文档'}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {principle.gaps && principle.gaps.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <div className="flex items-center gap-2 font-semibold">
            <i className="ri-alert-line"></i>
            待补全项
          </div>
          <ul className="mt-2 space-y-1">
            {principle.gaps.map((gap, index) => (
              <li key={`${principle.principleId}-gap-${index}`} className="leading-relaxed">
                <span className="font-semibold">{PRINCIPLE_STAGE_ORDER.find((stage) => stage.id === gap.stage)?.label ?? gap.stage.toUpperCase()}：</span>
                {gap.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function IndicatorItem({ indicator, onNavigate }: { indicator: TransformationOverviewIndicator; onNavigate: (target: QuickNavigateTarget) => void }) {
  const style = INDICATOR_STYLES[indicator.status];
  const icon = INDICATOR_ICONS[indicator.status];
  const button = indicator.link ? (
    <button
      type="button"
      onClick={() => onNavigate(indicator.link!)}
      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
    >
      查看详情
      <i className="ri-arrow-right-up-line"></i>
    </button>
  ) : null;

  const content = (
    <div className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${style}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${icon}`}></i>
          <span className="font-semibold">{indicator.label}</span>
        </div>
        <span className="text-base font-semibold">{indicator.value}</span>
      </div>
      {indicator.hint ? <p className="mt-1 text-[11px] text-slate-600">{indicator.hint}</p> : null}
      {button}
    </div>
  );

  return indicator.hint ? (
    <Tooltip content={indicator.hint} className="block">
      <div>{content}</div>
    </Tooltip>
  ) : (
    content
  );
}

export default function TransformationOverview({ onQuickNavigate }: TransformationOverviewProps) {
  const { data, loading, error, refresh } = useTransformationOverview();
  const markdownPreview = useMarkdownPreview('xbom-transformation');
  const [showGraphFullscreen, setShowGraphFullscreen] = useState(false);
  const [linkVisibility, setLinkVisibility] = useState<Record<TransformationLinkKind, boolean>>({
    principle: false,
    baseline: false,
    evidence: false,
  });

  const linkKindLabels = useMemo<Record<TransformationLinkKind, string>>(
    () => ({
      principle: '原理映射',
      baseline: '设计继承',
      evidence: '验证证据',
    }),
    []
  );

  const linkKindStyles = useMemo<
    Record<TransformationLinkKind, { active: string; indicator: string; badge: string; border: string }>
  >(
    () => ({
      principle: {
        active: 'border-blue-100 bg-blue-50 text-blue-700',
        indicator: '#2563eb',
        badge: 'bg-blue-100 text-blue-700',
        border: 'border-blue-200 text-blue-600',
      },
      baseline: {
        active: 'border-orange-100 bg-orange-50 text-orange-700',
        indicator: '#f97316',
        badge: 'bg-orange-100 text-orange-700',
        border: 'border-orange-200 text-orange-600',
      },
      evidence: {
        active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        indicator: '#16a34a',
        badge: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200 text-emerald-600',
      },
    }),
    []
  );

  const toggleLinkKind = (kind: TransformationLinkKind) => {
    setLinkVisibility((prev) => ({
      ...prev,
      [kind]: !(prev[kind] ?? true),
    }));
  };

  const pathSummaries = useMemo(() => data?.graph?.summaries ?? [], [data?.graph?.summaries]);
  const principleObjects = useMemo(() => data?.principleObjects ?? [], [data?.principleObjects]);
  const [activePrincipleId, setActivePrincipleId] = useState<string | null>(null);
  const [hasUserSelectedPrinciple, setHasUserSelectedPrinciple] = useState(false);
  const [highlightAll, setHighlightAll] = useState(true);

  const handleSelectPrinciple = useCallback((principleId: string | null) => {
    if (principleId === null) {
      setHighlightAll(true);
      setActivePrincipleId(null);
      setHasUserSelectedPrinciple(true);
      return;
    }
    setHighlightAll(false);
    setActivePrincipleId(principleId);
    setHasUserSelectedPrinciple(true);
  }, []);

  useEffect(() => {
    if (!principleObjects.length) {
      setActivePrincipleId(null);
      setHighlightAll(true);
      setHasUserSelectedPrinciple(false);
      return;
    }

    if (hasUserSelectedPrinciple) {
      return;
    }

    const highlightId = data?.principleHighlight?.id;
    if (highlightId && principleObjects.some((obj) => obj.principleId === highlightId)) {
      setActivePrincipleId(highlightId);
      setHighlightAll(false);
      return;
    }

    setActivePrincipleId(null);
    setHighlightAll(true);
  }, [principleObjects, data?.principleHighlight?.id, hasUserSelectedPrinciple]);
  const graphWithPrinciples = useMemo(() => {
    if (!data?.graph) {
      return null;
    }
    return augmentGraphWithPrinciples(data.graph, principleObjects, data.principleHighlight?.id);
  }, [data?.graph, principleObjects, data?.principleHighlight?.id]);

  const principleCard = useMemo(() => {
    if (!data?.principleHighlight) {
      return (
        <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">原理对象 · 待配置</h3>
            <p className="mt-2 text-xs leading-relaxed">
              暂无高亮原理对象。请在方案或设计节点中补充原理对象映射，以启用全流程追溯。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickNavigate({ bomType: 'solution', tab: 'principle' })}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            前往配置
            <i className="ri-edit-line"></i>
          </button>
        </div>
      );
    }

    const highlight = data.principleHighlight;
    return (
      <div className="rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">原理对象 · 统一锚点</h3>
            <p className="mt-1 text-xs text-slate-500">最近活跃原理对象概览</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium text-blue-600">
            状态：{highlight.status === 'selected' ? '选定' : highlight.status === 'candidate' ? '候选' : '已退役'}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <p className="text-sm font-semibold text-slate-900">{highlight.name}</p>
          <p>覆盖节点：{highlight.relatedNodes} 个</p>
          <p>覆盖率：{Math.round(highlight.coverage * 100)}%</p>
          <p>最近更新：{formatDateTime(highlight.updatedAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => onQuickNavigate({ bomType: 'solution', tab: 'principle' })}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
        >
          查看原理对象词典
          <i className="ri-arrow-right-line"></i>
        </button>
      </div>
    );
  }, [data?.principleHighlight, onQuickNavigate]);

  
  const content = useMemo(() => {
    if (loading && !data) {
      return (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-600">
          <i className="ri-loader-2-line animate-spin" />
          <span>正在加载 XBOM 转化概览…</span>
        </div>
      );
    }

    if (error && !data) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          <p>加载失败：{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
          >
            <i className="ri-refresh-line"></i>
            重试
          </button>
        </div>
      );
    }

    if (!data) {
      return null;
    }

    const principleList = principleObjects.length ? (
      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">原理对象映射</h4>
            <p className="text-xs text-slate-500">同一工程实体在各阶段 BOM 的节点汇总</p>
          </div>
          <span className="text-[11px] text-slate-500">共 {principleObjects.length} 项映射</span>
        </div>
        <div className="grid gap-3">
          {principleObjects.map((principle) => (
            <PrincipleObjectCard
              key={principle.principleId}
              principle={principle}
              active={principle.principleId === activePrincipleId}
              onSelect={handleSelectPrinciple}
            />
          ))}
        </div>
      </div>
    ) : null;

    const graphPanel = graphWithPrinciples ? (
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">跨阶段结构映射</h3>
            <p className="mt-1 text-xs text-slate-500">原理对象驱动 RBOM→TBOM 的节点映射与流向</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1">
              {(Object.keys(linkKindLabels) as TransformationLinkKind[]).map((kind) => {
                const isActive = linkVisibility[kind] !== false;
                const styles = linkKindStyles[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => toggleLinkKind(kind)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                      isActive ? styles.active : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <span
                      className="inline-flex h-2 w-6 rounded-full"
                      style={{
                        background:
                          kind === 'principle'
                            ? 'repeating-linear-gradient(90deg, #2563eb, #2563eb 4px, transparent 4px, transparent 8px)'
                            : styles.indicator,
                      }}
                    ></span>
                    {linkKindLabels[kind]}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowGraphFullscreen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
            >
              <i className="ri-fullscreen-line"></i>
              最大化
            </button>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
            >
              <i className="ri-refresh-line"></i>
              刷新
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-3" style={{ minHeight: 540 }}>
          <TransformationFlowGraph
            data={graphWithPrinciples}
            className="h-full w-full rounded-2xl bg-white shadow-inner"
            visibleKinds={linkVisibility}
            activePrincipleId={activePrincipleId}
            onSelectPrinciple={handleSelectPrinciple}
            highlightAll={highlightAll}
          />
        </div>
        {principleList}
      </div>
    ) : null;

    return (
      <div className="space-y-6">
        {graphPanel}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.steps.map((step) => (
            <StepCard key={step.id} step={step} onNavigate={onQuickNavigate} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {principleCard}
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">转化健康度</h3>
                <p className="mt-1 text-xs text-slate-500">覆盖率、缺口与滞后指标一览</p>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
              >
                <i className="ri-refresh-line"></i>
                刷新
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {data.healthIndicators.map((indicator) => (
                <IndicatorItem key={indicator.label} indicator={indicator} onNavigate={onQuickNavigate} />
              ))}
            </div>
          </div>
        </div>
        {pathSummaries.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h3 className="text-sm font-semibold text-slate-900">重点链路摘要</h3>
              <p className="text-xs text-slate-500">原理对象、设计继承与验证证据的代表性链路</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pathSummaries.map((summary) => {
                const styles = linkKindStyles[summary.kind];
                return (
                  <article key={summary.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{summary.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                        {linkKindLabels[summary.kind]}
                      </span>
                    </div>
                    <ol className="space-y-2 text-xs text-slate-600">
                      {summary.steps.map((step, index) => (
                        <li key={`${summary.id}-${index}`} className="flex items-start gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${styles.border} bg-white text-[10px] font-semibold`}>
                            {index + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {summary.description ? <p className="text-xs text-slate-500">{summary.description}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    );
  }, [
    data,
    error,
    linkKindLabels,
    linkKindStyles,
    linkVisibility,
    loading,
    onQuickNavigate,
    pathSummaries,
    principleObjects,
    principleCard,
    graphWithPrinciples,
    activePrincipleId,
    handleSelectPrinciple,
    highlightAll,
    refresh,
    setShowGraphFullscreen,
  ]);


  return (
    <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/60 to-indigo-50/40 p-6 shadow-sm">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">XBOM 转化全景</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] text-blue-600">
              <i className="ri-history-line" />
              更新：{formatDateTime(data?.lastSyncedAt)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">从需求到试验的数字主线，原理对象贯穿每一步</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <i className="ri-refresh-line"></i>
            手动刷新
          </button>
          <button
            type="button"
            onClick={markdownPreview.open}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <i className="ri-book-open-line"></i>
            了解转化机制
          </button>
        </div>
      </header>

      <div className="mt-6">{content}</div>

      {showGraphFullscreen && (graphWithPrinciples ?? data?.graph) ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="flex h-full max-h-[95vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <header className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">XBOM 跨阶段结构映射</h3>
                <p className="text-xs text-slate-500">RBOM → TBOM 节点流向全景展示，可放大查看细节</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1">
                  {(Object.keys(linkKindLabels) as TransformationLinkKind[]).map((kind) => {
                    const isActive = linkVisibility[kind] !== false;
                    const styles = linkKindStyles[kind];
                    return (
                      <button
                        key={`fullscreen-${kind}`}
                        type="button"
                        onClick={() => toggleLinkKind(kind)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                          isActive ? styles.active : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        <span
                          className="inline-flex h-2 w-6 rounded-full"
                          style={{
                            background:
                              kind === 'principle'
                                ? 'repeating-linear-gradient(90deg, #2563eb, #2563eb 4px, transparent 4px, transparent 8px)'
                                : styles.indicator,
                          }}
                        ></span>
                        {linkKindLabels[kind]}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  <i className="ri-refresh-line"></i>
                  刷新
                </button>
                <button
                  type="button"
                  onClick={() => setShowGraphFullscreen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            </header>
            <div className="flex-1 bg-slate-50 p-6">
              <TransformationFlowGraph
                data={(graphWithPrinciples ?? data?.graph)!}
                className="h-full w-full rounded-2xl bg-white shadow-inner"
                visibleKinds={linkVisibility}
                activePrincipleId={activePrincipleId}
                onSelectPrinciple={handleSelectPrinciple}
                highlightAll={highlightAll}
              />
            </div>
          </div>
        </div>
      ) : null}

      {markdownPreview.visible ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 px-4">
          <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">XBOM 转化机制说明</h3>
                <p className="text-xs text-slate-500">内嵌预览文档 docs/xbom-transformation-mechanism.md</p>
              </div>
              <button
                type="button"
                onClick={markdownPreview.close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <i className="ri-close-line"></i>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-4">
              {markdownPreview.loading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600">
                  <i className="ri-loader-2-line animate-spin"></i>
                  <span>正在加载文档…</span>
                </div>
              ) : markdownPreview.error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  文档加载失败：{markdownPreview.error}
                </div>
              ) : (
                <article
                  className="text-sm leading-relaxed text-slate-700"
                  dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(markdownPreview.content) }}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
