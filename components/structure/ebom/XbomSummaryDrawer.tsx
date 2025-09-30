"use client";

import { useEffect } from "react";
import EmptyState from "@/components/common/EmptyState";
import type { XbomSummaryDrawerData } from "./cockpitTypes";

export type SummarySection = "requirement" | "simulation" | "test";

interface Props {
  open: boolean;
  section: SummarySection | null;
  data: XbomSummaryDrawerData | null;
  onClose: () => void;
}

export default function XbomSummaryDrawer({ open, section, data, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const renderContent = () => {
    if (!data?.drawer || !section) {
      return <EmptyState dense title="暂无详情" icon="ri-file-info-line" />;
    }
    if (section === "requirement") {
      const groups = data.drawer.requirement?.groups ?? [];
      if (!groups.length) return <EmptyState dense title="暂无需求详情" icon="ri-file-list-2-line" />;
      return (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.title} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="text-sm font-medium text-gray-800">{group.title}</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-emerald-500"></i>
                    <span>{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    if (section === "simulation") {
      const cases = data.drawer.simulation?.cases ?? [];
      if (!cases.length) return <EmptyState dense title="暂无仿真详情" icon="ri-computer-line" />;
      return (
        <div className="space-y-3">
          {cases.map((sim) => (
            <div key={sim.caseId} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{sim.title}</div>
                  <div className="text-xs text-gray-500">{sim.caseId}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">
                  {sim.status}
                </span>
              </div>
              {sim.owner && (
                <div className="mt-2 text-xs text-gray-500">
                  负责人：<span className="font-medium text-gray-700">{sim.owner}</span>
                </div>
              )}
              {sim.metrics?.length ? (
                <ul className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  {sim.metrics.map((metric) => (
                    <li key={metric.name} className="rounded border border-gray-100 bg-slate-50/80 px-2 py-1">
                      <span className="font-medium text-gray-700">{metric.name}</span>
                      <span className="ml-2 text-gray-500">
                        {metric.value ?? "—"}
                        {metric.unit ? ` ${metric.unit}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      );
    }
    if (section === "test") {
      const executions = data.drawer.test?.executions ?? [];
      if (!executions.length) return <EmptyState dense title="暂无试验详情" icon="ri-test-tube-line" />;
      return (
        <div className="space-y-3">
          {executions.map((test) => (
            <div key={test.testId} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{test.title}</div>
                  <div className="text-xs text-gray-500">{test.testId}</div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                  test.status === "done"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : test.status === "blocked"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  {test.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {test.owner && <div>负责人：{test.owner}</div>}
                {test.eta && <div>预计完成：{test.eta}</div>}
                {test.completedAt && <div>完成时间：{test.completedAt}</div>}
                {test.result && <div>结果：{test.result}</div>}
              </div>
              {test.blockers?.length ? (
                <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <div className="font-medium">阻塞原因</div>
                  <ul className="mt-1 list-disc pl-4">
                    {test.blockers.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">XBOM 详情</div>
            <h3 className="text-lg font-semibold text-gray-900">
              {section === "requirement" && "需求详情"}
              {section === "simulation" && "仿真详情"}
              {section === "test" && "试验详情"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-gray-600">
            <div>节点：{data?.summary.nodeId ?? "—"}</div>
            <div>来源：{data?.summary.source.system ?? "—"}</div>
            <div>更新时间：{data?.summary.source.updatedAt ?? "—"}</div>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
