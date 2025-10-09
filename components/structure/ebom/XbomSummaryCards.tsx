"use client";

import type { JumpLogEntry, XbomSummary } from "./cockpitTypes";
import JumpButton from "./JumpButton";
import SourceTag from "./SourceTag";
import EmptyState from "@/components/common/EmptyState";

interface Props {
  summary: XbomSummary | null;
  overrideUpdatedAt?: string;
  showReq?: boolean;
  showSim?: boolean;
  showTest?: boolean;
  onOpenDetail?: (section: "requirement" | "simulation" | "test") => void;
  nodeId?: string;
  baseline?: string;
  onJumpLogged?: () => void;
  onViewRequirement?: (payload: { requirementIds: string[]; sourceNodeId?: string | null; sourceNodeName?: string | null }) => void;
  sourceNodeId?: string | null;
  sourceNodeName?: string | null;
}

export default function XbomSummaryCards({
  summary,
  overrideUpdatedAt,
  showReq = true,
  showSim = true,
  showTest = true,
  onOpenDetail,
  nodeId,
  baseline,
  onJumpLogged,
  onViewRequirement,
  sourceNodeId,
  sourceNodeName,
}: Props) {
  if (!summary) {
    return <EmptyState title="暂无 XBOM 摘要数据" icon="ri-links-line" />;
  }

  const head = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
          <i className="ri-node-tree" /> XBOM 摘要
        </span>
      </div>
      <SourceTag
        sources={[
          {
            system: summary.source.system,
            updatedAt: overrideUpdatedAt ?? summary.source.updatedAt,
            freshnessSec: summary.source.freshnessSec,
            trust: summary.source.trust,
          },
        ]}
        compact
      />
    </div>
  );

  const requirementItems = summary.requirement?.items ?? [];
  const anomalyCount = Array.isArray(summary.test?.anomalies)
    ? summary.test!.anomalies!.reduce((sum, item) => sum + item.count, 0)
    : 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {head}
      <div className="grid gap-3 md:grid-cols-3">
        {showReq && (
          <article className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-1">
                <i className="ri-file-list-2-line" /> 需求
              </span>
              <button
                type="button"
                onClick={() => onOpenDetail?.("requirement")}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                详情
                <i className="ri-arrow-right-up-line" />
              </button>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {Math.round((summary.requirement?.coverage ?? 0) * 100)}%
            </div>
            <ul className="space-y-1 text-sm text-gray-700">
              {requirementItems.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      item.status === "open"
                        ? "bg-amber-500"
                        : item.status === "risk"
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    }`}
                  ></span>
                  <span className="truncate" title={item.title}>
                    {item.title}
                  </span>
                </li>
              ))}
              {!requirementItems.length && <li className="text-xs text-gray-400">暂无需求项</li>}
            </ul>
            <div className="mt-auto">
              <JumpButton
                label="查看需求详情"
                system="REQSYS"
                nodeId={nodeId}
                baseline={baseline}
                context={{ scope: "requirement" }}
                requireConfirm={false}
                onLogged={(entry: JumpLogEntry) => {
                  onJumpLogged?.();
                  if (entry.status !== "success") {
                    return;
                  }
                  const ids = requirementItems.map((item) => item.id).filter((id): id is string => Boolean(id));
                  if (!ids.length) {
                    return;
                  }
                  onViewRequirement?.({
                    requirementIds: ids,
                    sourceNodeId: sourceNodeId ?? nodeId ?? null,
                    sourceNodeName,
                  });
                }}
              />
            </div>
          </article>
        )}

        {showSim && (
          <article className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-1">
                <i className="ri-computer-line" /> 仿真
              </span>
              <button
                type="button"
                onClick={() => onOpenDetail?.("simulation")}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                详情
                <i className="ri-arrow-right-up-line" />
              </button>
            </div>
            <div className="text-sm text-gray-700">模型：{summary.simulation?.modelVer ?? "—"}</div>
            <div className="text-2xl font-semibold text-gray-900">
              {summary.simulation?.cases ?? 0}
              <span className="ml-1 text-sm text-gray-500">算例</span>
            </div>
            <div className="text-xs text-gray-500">
              最近：{summary.simulation?.lastRunAt ?? "—"}
              {typeof summary.simulation?.queueLen === "number" ? ` · 队列：${summary.simulation?.queueLen}` : ""}
            </div>
            <div className="mt-auto">
              <JumpButton
                label="查看仿真详情"
                url={summary.links?.detailUrl}
                system="SIMSYS"
                nodeId={nodeId}
                baseline={baseline}
                context={{ scope: "simulation", model: summary.simulation?.modelVer }}
                onLogged={() => onJumpLogged?.()}
              />
            </div>
          </article>
        )}

        {showTest && (
          <article className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-1">
                <i className="ri-test-tube-line" /> 试验
              </span>
              <button
                type="button"
                onClick={() => onOpenDetail?.("test")}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                详情
                <i className="ri-arrow-right-up-line" />
              </button>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {summary.test?.done ?? 0}
              <span className="ml-1 text-sm text-gray-500">/ {summary.test?.plan ?? 0}</span>
            </div>
            <div className="text-xs text-gray-500">
              阻塞：{summary.test?.blockers ?? 0} · 最近：{summary.test?.last ?? "—"}
              {anomalyCount ? ` · 异常：${anomalyCount}` : ""}
            </div>
            <div className="mt-auto">
              <JumpButton
                label="查看试验详情"
                url={summary.links?.detailUrl}
                system="TESTSYS"
                nodeId={nodeId}
                baseline={baseline}
                context={{ scope: "test" }}
                onLogged={() => onJumpLogged?.()}
              />
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
