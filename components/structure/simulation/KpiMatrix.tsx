"use client";

import { useMemo } from 'react';
import type { SimulationCondition, SimulationFile } from './types';

interface Props {
  files: SimulationFile[];
  conditions: SimulationCondition[];
  selectedIds: string[];
  baselineId?: string;
}

type MetricKey = 'peak' | 'avg' | 'end';

export default function KpiMatrix({ files, conditions, selectedIds, baselineId }: Props) {
  const byCondition = useMemo(() => {
    const map: Record<string, number[]> = {};
    conditions.forEach(c => (map[c.id] = []));
    files.forEach(file => {
      const fileConds = file.conditions || [];
      const curve = file.preview?.curveData?.[0];
      if (!curve || curve.length === 0) return;
      const peak = Math.max(...curve.map(p => Number(p.y) || 0));
      const avg = curve.reduce((s, p) => s + (Number(p.y) || 0), 0) / curve.length;
      const end = Number(curve[curve.length - 1]?.y) || 0;
      const value = (peak + avg + end) / 3; // 简易综合分
      fileConds.forEach(c => {
        if (map[c.id]) map[c.id].push(value);
      });
    });
    const summary: Record<string, { peak: number; avg: number; end: number }> = {};
    // 再算各指标
    conditions.forEach(c => {
      const related = files.filter(f => (f.conditions || []).some(cc => cc.id === c.id));
      const curves = related.map(f => f.preview?.curveData?.[0]).filter(Boolean) as Array<{ x: number; y: number }[]>;
      if (curves.length === 0) {
        summary[c.id] = { peak: NaN, avg: NaN, end: NaN };
      } else {
        const allY = curves.flat().map(p => Number(p.y) || 0);
        const peak = Math.max(...allY);
        const avg = allY.reduce((s, v) => s + v, 0) / allY.length;
        const end = curves.reduce((s, arr) => s + (Number(arr[arr.length - 1]?.y) || 0), 0) / curves.length;
        summary[c.id] = { peak, avg, end };
      }
    });
    return summary;
  }, [files, conditions]);

  const metrics: Array<{ key: MetricKey; label: string }> = [
    { key: 'peak', label: '峰值' },
    { key: 'avg', label: '平均' },
    { key: 'end', label: '末值' }
  ];

  const selected = selectedIds.length ? conditions.filter(c => selectedIds.includes(c.id)) : conditions;

  const ranges = useMemo(() => {
    const r: Record<MetricKey, { min: number; max: number }> = {
      peak: { min: Infinity, max: -Infinity },
      avg: { min: Infinity, max: -Infinity },
      end: { min: Infinity, max: -Infinity }
    };
    // 取 summary
    selected.forEach(c => {
      const s = (byCondition as any)[c.id] as { peak: number; avg: number; end: number } | undefined;
      if (!s) return;
      (Object.keys(r) as MetricKey[]).forEach(k => {
        const val = (s as any)[k];
        if (Number.isFinite(val)) {
          r[k].min = Math.min(r[k].min, val);
          r[k].max = Math.max(r[k].max, val);
        }
      });
    });
    return r;
  }, [selected, byCondition]);

  const baseline = baselineId && (byCondition as any)[baselineId];

  const bgFor = (k: MetricKey, val: number) => {
    const { min, max } = ranges[k];
    if (!Number.isFinite(val) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return 'bg-gray-50';
    const t = (val - min) / (max - min);
    const alpha = 0.15 + t * 0.25;
    return `bg-blue-500/[$alpha]`.replace('$alpha', String(alpha));
  };

  const fmt = (n: number) => (Number.isFinite(n) ? (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2)) : '—');

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[560px] w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 w-24">指标/工况</th>
            {selected.map(c => (
              <th key={c.id} className="text-left text-xs font-medium text-gray-600 px-3 py-2">
                {c.name}
                {baselineId === c.id && <span className="ml-1 rounded px-1 py-0.5 text-[10px] border border-blue-300 text-blue-600">基准</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => (
            <tr key={m.key} className="border-t border-gray-100">
              <td className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap">{m.label}</td>
              {selected.map(c => {
                const s = (byCondition as any)[c.id] as { peak: number; avg: number; end: number } | undefined;
                const val = s ? (s as any)[m.key] : NaN;
                const baseVal = baseline ? (baseline as any)[m.key] : undefined;
                const delta = Number.isFinite(val) && Number.isFinite(baseVal as number)
                  ? (val as number) - (baseVal as number)
                  : undefined;
                return (
                  <td key={c.id} className={`px-3 py-2 text-xs ${bgFor(m.key, val as number)} whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{fmt(val as number)}</span>
                      {delta !== undefined && delta !== 0 && (
                        <span className={`text-[10px] ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>{delta > 0 ? '+' : ''}{fmt(delta)}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
