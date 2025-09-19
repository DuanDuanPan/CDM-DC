"use client";

import { useMemo } from 'react';
import type { SimulationCondition } from './types';

interface Props {
  conditions: SimulationCondition[];
  selectedIds: string[];
  baselineId?: string;
  onChange: (ids: string[]) => void;
  onBaselineChange: (id: string) => void;
}

const palette = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#0ea5e9',
  '#22c55e',
  '#a855f7'
];

export default function ConditionBar({ conditions, selectedIds, baselineId, onChange }: Props) {
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    conditions.forEach((c, idx) => (map[c.id] = palette[idx % palette.length]));
    return map;
  }, [conditions]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const allSelected = selectedIds.length === conditions.length && conditions.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-xs text-gray-500">工况</div>
      {conditions.map(cond => (
        <button
          key={cond.id}
          onClick={() => toggle(cond.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            selectedIds.includes(cond.id)
              ? 'bg-white border-gray-300 text-gray-800 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
          }`}
          title={cond.parameters?.map(p => `${p.name}:${p.value}${p.unit ? p.unit : ''}`).join(' · ')}
          type="button"
        >
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorMap[cond.id] }}></span>
            {cond.name}
          </span>
          {baselineId === cond.id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
              <i className="ri-flag-2-line"></i>
              基准
            </span>
          )}
        </button>
      ))}

      <span className="mx-1 text-gray-300">|</span>
      <button
        className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
        onClick={() => onChange(conditions.map(c => c.id))}
        disabled={allSelected}
        title={allSelected ? '已全选' : '全选'}
      >全选</button>
      <button
        className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
        onClick={() => onChange([])}
      >清空</button>
    </div>
  );
}
