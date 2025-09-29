"use client";

import { useEffect, useState } from 'react';
import type { CockpitKpi } from './cockpitTypes';

type Overrides = Record<string, { low?: number; high?: number }>;

export default function ThresholdPanel({
  kpis,
  open,
  onClose,
  onApply,
  initialOverrides,
  defaultThresholds,
  presetLabel,
}: {
  kpis: CockpitKpi[];
  open: boolean;
  onClose: () => void;
  onApply: (ov: Overrides) => void;
  initialOverrides?: Overrides;
  defaultThresholds?: Record<string,{low?:number;high?:number}>;
  presetLabel?: string;
}) {
  const [ov, setOv] = useState<Overrides>(initialOverrides ?? {});
  useEffect(() => setOv(initialOverrides ?? {}), [initialOverrides, open]);

  if (!open) return null;

  const rows = kpis.map((k) => {
    const cur = ov[k.id] ?? {};
    const def = (defaultThresholds?.[k.id]) ?? (k.threshold ?? {});
    return (
      <tr key={k.id} className="border-t">
        <td className="px-3 py-2 text-sm text-gray-700">{k.label}</td>
        <td className="px-3 py-2 text-xs text-gray-500">默认低 {def.low ?? '-'} / 高 {def.high ?? '-'}</td>
        <td className="px-3 py-2">
          <input type="number" className="w-24 rounded border border-gray-300 px-2 py-1 text-sm" value={cur.low ?? ''} placeholder="覆盖低阈值" onChange={(e)=>setOv(v=>({ ...v, [k.id]: { ...v[k.id], low: e.target.value === '' ? undefined : Number(e.target.value) } }))} />
        </td>
        <td className="px-3 py-2">
          <input type="number" className="w-24 rounded border border-gray-300 px-2 py-1 text-sm" value={cur.high ?? ''} placeholder="覆盖高阈值" onChange={(e)=>setOv(v=>({ ...v, [k.id]: { ...v[k.id], high: e.target.value === '' ? undefined : Number(e.target.value) } }))} />
        </td>
        <td className="px-3 py-2">
          <button className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-blue-300" onClick={()=>setOv(v=>({ ...v, [k.id]: {} }))}>恢复默认</button>
        </td>
      </tr>
    );
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold text-gray-800"><i className="ri-sliders-line mr-1"/>KPI 阈值（预设：{presetLabel ?? '—'}）</div>
          <button onClick={onClose} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-gray-300"><i className="ri-close-line"/>关闭</button>
        </div>
        <div className="max-h-[60vh] overflow-auto p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-1">KPI</th>
                <th className="px-3 py-1">默认</th>
                <th className="px-3 py-1">低阈值</th>
                <th className="px-3 py-1">高阈值</th>
                <th className="px-3 py-1">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300">取消</button>
          <button onClick={()=>onApply(ov)} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">保存</button>
        </div>
      </div>
    </div>
  );
}
