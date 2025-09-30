"use client";

import { useMemo, useState } from "react";
import type {
  ValidationMatrixData,
  ValidationMatrixRequirement,
  ValidationMatrixVerification,
  ValidationMatrixStatus,
} from "./cockpitTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  data: ValidationMatrixData | null;
}

export default function ValidationMatrixDrawer({ open, onClose, data }: Props) {
  const [phase, setPhase] = useState<string>("全部");
  const [owner, setOwner] = useState<string>("全部");
  const [viewMode, setViewMode] = useState<"heatmap" | "list">("heatmap");

  const legend = data?.legend ?? {};

  const requirements = useMemo<ValidationMatrixRequirement[]>(() => {
    if (!data) return [];
    return data.requirements.filter((req) => {
      const phasePass = phase === "全部" || req.phase === phase;
      const ownerPass = owner === "全部" || req.owner === owner;
      return phasePass && ownerPass;
    });
  }, [data, phase, owner]);

  const verifications = useMemo<ValidationMatrixVerification[]>(() => data?.verifications ?? [], [data]);

  const matrixLookup = useMemo(() => {
    if (!data) return new Map<string, ValidationMatrixStatus>();
    const map = new Map<string, ValidationMatrixStatus>();
    data.matrix.forEach((entry) => {
      map.set(`${entry.requirementId}|${entry.verificationId}`, entry.status);
    });
    return map;
  }, [data]);

  const statusToColor = (status: ValidationMatrixStatus): string => {
    const record = legend[status];
    if (record?.color) return record.color;
    switch (status) {
      case "pass":
        return "#22c55e";
      case "partial":
        return "#f97316";
      case "running":
        return "#0ea5e9";
      case "risk":
        return "#ef4444";
      case "planned":
        return "#6366f1";
      default:
        return "#e2e8f0";
    }
  };

  const statusLabel = (status: ValidationMatrixStatus): string => legend[status]?.label ?? status;

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">
              需求 × 验证矩阵（{data.nodeId} · {data.baseline ?? "未指定"}）
            </div>
            <div className="text-xs text-gray-500">
              更新于 {new Date(data.updatedAt).toLocaleString()} · 覆盖率 {(data.summary.coverage * 100).toFixed(1)}% · 风险 {data.summary.atRisk}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <button
              type="button"
              onClick={() => setViewMode("heatmap")}
              className={`rounded border px-3 py-1 ${
                viewMode === "heatmap"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-gray-200 bg-white"
              }`}
            >
              <i className="ri-grid-fill" /> 热力图
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded border px-3 py-1 ${
                viewMode === "list" ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-200 bg-white"
              }`}
            >
              <i className="ri-list-check" /> 清单
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-gray-300"
            >
              <i className="ri-close-line" /> 关闭
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b bg-slate-50/80 px-6 py-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>阶段</span>
            <select
              value={phase}
              onChange={(event) => setPhase(event.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
            >
              <option value="全部">全部</option>
              {(data.filters?.phases ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>责任人</span>
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
            >
              <option value="全部">全部</option>
              {(data.filters?.owners ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>状态图例</span>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(legend).map(([status, item]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color ?? "#e2e8f0" }}
                  ></span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {viewMode === "heatmap" ? (
            <div className="p-6">
              <div className="overflow-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500">需求 / 验证</th>
                      {verifications.map((verification) => (
                        <th key={verification.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700">{verification.title}</span>
                            <span className="text-[11px] text-gray-500">{verification.type.toUpperCase()} · {verification.status}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((requirement) => (
                      <tr key={requirement.id} className="even:bg-slate-50/40">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">{requirement.title}</div>
                          <div className="mt-1 text-[11px] text-gray-500">
                            {requirement.phase ?? "-"} · {requirement.owner ?? "未指派"} · {requirement.priority ?? "P-"}
                          </div>
                        </td>
                        {verifications.map((verification) => {
                          const key = `${requirement.id}|${verification.id}`;
                          const status = matrixLookup.get(key) ?? "empty";
                          return (
                            <td key={verification.id} className="px-4 py-3 text-center text-xs text-white">
                              <span
                                className="inline-flex min-w-[96px] items-center justify-center rounded-lg px-2 py-1"
                                style={{ backgroundColor: statusToColor(status) }}
                                title={statusLabel(status)}
                              >
                                {statusLabel(status)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {requirements.map((requirement) => (
                <div key={requirement.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">{requirement.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span>阶段：{requirement.phase ?? "-"}</span>
                    <span>责任：{requirement.owner ?? "未指派"}</span>
                    <span>优先级：{requirement.priority ?? "-"}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-gray-600">
                    {verifications.map((verification) => {
                      const key = `${requirement.id}|${verification.id}`;
                      const status = matrixLookup.get(key) ?? "empty";
                      if (status === "empty") return null;
                      return (
                        <div key={verification.id} className="rounded-lg border border-gray-200 bg-slate-50/70 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{verification.title}</span>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-white"
                              style={{ backgroundColor: statusToColor(status) }}
                            >
                              {statusLabel(status)}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-gray-500">
                            {verification.type.toUpperCase()} · 最近 {verification.lastRunAt ? new Date(verification.lastRunAt).toLocaleString() : "未运行"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
