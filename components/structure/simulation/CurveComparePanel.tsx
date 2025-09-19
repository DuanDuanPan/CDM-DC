"use client";

import { useMemo } from 'react';
import type { SimulationCondition, SimulationFile } from './types';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Props {
  files: SimulationFile[];
  conditions: SimulationCondition[];
  selectedIds: string[];
  baselineId?: string;
  mode: 'overlay' | 'grid';
  alignMode?: 'original' | 'normalizedX';
  yNormMode?: 'none' | 'delta' | 'percent';
  fillHeight?: boolean;
}

const palette = ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#0ea5e9','#22c55e','#a855f7'];

export default function CurveComparePanel({ files, conditions, selectedIds, baselineId, mode, alignMode = 'original', yNormMode = 'none', fillHeight = false }: Props) {
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    conditions.forEach((c, i) => (map[c.id] = palette[i % palette.length]));
    return map;
  }, [conditions]);

  const series = useMemo(() => {
    // 为每个工况选一个有曲线数据的文件
    const result: Array<{ id: string; name: string; color: string; data: Array<{ x: number; y: number }> } > = [];
    const candidates = files.filter(f => f.preview?.curveData && (f.conditions || []).length > 0);
    const selectedConds = selectedIds.length ? selectedIds : conditions.map(c => c.id);
    selectedConds.forEach(cid => {
      const file = candidates.find(f => (f.conditions || []).some(c => c.id === cid));
      const data = file?.preview?.curveData?.[0];
      if (file && data) {
        result.push({ id: cid, name: (conditions.find(c => c.id === cid)?.name) || cid, color: colorMap[cid], data });
      }
    });
    return result;
  }, [files, conditions, selectedIds, colorMap]);

  if (series.length === 0) {
    return <div className="text-sm text-gray-500">当前选择下无可用曲线。</div>;
  }

  if (mode === 'grid') {
    const cols = 2;
    return (
      <div className={`grid gap-4 ${fillHeight ? 'h-full' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {series.map(s => (
          <div key={s.id} className={`${fillHeight ? 'h-full' : 'h-48'} bg-white border border-gray-200 rounded-lg p-2`}>
            <div className="flex items-center justify-between px-1 pb-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                {s.name}
              </div>
              {baselineId === s.id && <span className="text-blue-600">基准</span>}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Line type="monotone" dataKey="y" stroke={s.color} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    );
  }

  // overlay 数据组装：支持 X 对齐与 Y 归一化到基准
  const overlayDataLen = Math.max(...series.map(s => s.data.length));
  const baselineSeries = baselineId ? series.find(s => s.id === baselineId) : undefined;
  const overlayData = Array.from({ length: overlayDataLen }).map((_, i) => {
    const row: any = { i };
    let xVal: number | undefined = undefined;
    series.forEach(s => {
      const len = s.data.length;
      const point = s.data[i];
      const xOriginal = point?.x ?? i;
      const xNormalized = len > 1 ? i / (len - 1) : 0;
      const x = alignMode === 'normalizedX' ? xNormalized : xOriginal;
      xVal = xVal ?? x;

      let y = point?.y ?? null;
      if (y != null && baselineSeries && yNormMode !== 'none') {
        const bLen = baselineSeries.data.length;
        const bIndex = Math.min(i, bLen - 1);
        const bY = baselineSeries.data[bIndex]?.y ?? null;
        if (bY != null && typeof bY === 'number') {
          if (yNormMode === 'delta') y = (y as number) - bY;
          if (yNormMode === 'percent') y = bY === 0 ? 0 : (((y as number) / bY) - 1) * 100;
        }
      }
      row[s.id] = y;
    });
    row.x = xVal ?? i;
    return row;
  });

  return (
    <div className={`${fillHeight ? 'h-full' : 'h-64'} bg-white border border-gray-200 rounded-lg`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={overlayData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip />
          <Legend />
          {series.map(s => (
            <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
