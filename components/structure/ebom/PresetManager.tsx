"use client";

import { useEffect, useMemo, useState } from "react";

export default function PresetManager({
  open,
  onClose,
  onApply,
  baseConfig,
  currentPreset,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (newPresetKey?: string) => void;
  baseConfig: any;
  currentPreset: string;
}) {
  const [conf, setConf] = useState<any>(baseConfig);
  useEffect(()=> setConf(baseConfig), [baseConfig, open]);

  const presetEntries = useMemo(() => Object.entries(conf.presets || {}), [conf]);
  const defaults = { dev: 0.25, sim: 0.25, test: 0.25, risk: 0.25 };
  const curWeights = (conf.presets?.[currentPreset]?.weights) || defaults;
  const sum = (curWeights.dev ?? 0) + (curWeights.sim ?? 0) + (curWeights.test ?? 0) + (curWeights.risk ?? 0);

  const saveOverrides = (nextConf: any) => {
    try { window.localStorage.setItem('kpiConfigOverrides', JSON.stringify(nextConf)); } catch {}
    setConf(nextConf);
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(conf, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kpi-threshold-config.export.json'; a.click(); URL.revokeObjectURL(url);
  };

  const importConfig = async (file: File) => {
    const txt = await file.text();
    try { const obj = JSON.parse(txt); saveOverrides(obj); } catch {}
  };

  const copyCurrentAsNew = () => {
    const key = prompt('新预设 key（字母数字/下划线）：', 'custom');
    if (!key) return;
    const label = prompt('展示名称：', '自定义');
    const next = structuredClone(conf);
    next.presets = next.presets || {}; next.presets[key] = { label: label || key, weights: next.presets[currentPreset]?.weights || { dev:0.25, sim:0.25, test:0.25, risk:0.25 } };
    next.thresholds = next.thresholds || {};
    Object.keys(next.thresholds).forEach(kpi => {
      const cur = next.thresholds[kpi][currentPreset] || next.thresholds[kpi]['default'];
      next.thresholds[kpi][key] = cur ? { ...cur } : { low: 0, high: 0 };
    });
    saveOverrides(next);
    onApply(key);
  };

  const renamePreset = (key: string) => {
    const label = prompt('新的展示名称：', conf.presets[key]?.label || key);
    if (!label) return;
    const next = structuredClone(conf); next.presets[key].label = label; saveOverrides(next);
  };

  const deletePreset = (key: string) => {
    if (key === 'default') { alert('默认预设不可删除'); return; }
    if (!confirm(`确认删除预设 ${key} ?`)) return;
    const next = structuredClone(conf);
    delete next.presets[key];
    Object.keys(next.thresholds || {}).forEach(kpi => { delete next.thresholds[kpi][key]; });
    saveOverrides(next);
    onApply('default');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold text-gray-800"><i className="ri-database-2-line mr-1"/>KPI 预设管理</div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-blue-300">
              <i className="ri-upload-2-line"/> 导入
              <input type="file" accept="application/json" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) importConfig(f); }}/>
            </label>
            <button onClick={exportConfig} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-blue-300"><i className="ri-download-2-line"/> 导出</button>
            <button onClick={onClose} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-gray-300"><i className="ri-close-line"/> 关闭</button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">当前预设：<span className="font-medium text-gray-800">{currentPreset}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={copyCurrentAsNew} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-indigo-300 hover:text-indigo-600"><i className="ri-file-copy-line"/> 复制当前为新预设</button>
            </div>
          </div>
          <div className="rounded border border-gray-100 p-3">
            <div className="mb-2 text-xs font-medium text-gray-700">健康度权重（0-1）</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['dev','sim','test','risk'] as const).map(key => (
                <label key={key} className="flex items-center gap-2">
                  <span className="w-16 text-gray-500">{ key==='dev'?'研发': key==='sim'?'仿真': key==='test'?'试验':'风险' }</span>
                  <input type="number" min={0} max={1} step={0.05} value={curWeights[key]}
                    onChange={(e)=>{
                      const v = Number(e.target.value);
                      const next = structuredClone(conf);
                      next.presets = next.presets || {};
                      next.presets[currentPreset] = next.presets[currentPreset] || { label: currentPreset, weights: {} };
                      next.presets[currentPreset].weights[key] = v;
                      try{ window.localStorage.setItem('kpiConfigOverrides', JSON.stringify(next)); }catch{}
                      setConf(next);
                    }}
                    className="w-24 rounded border border-gray-300 px-2 py-1"/>
                </label>
              ))}
            </div>
            <div className={`mt-2 text-[11px] ${Math.abs(sum-1)<=0.05 ? 'text-gray-500' : 'text-rose-600'}`}>当前总和：{sum.toFixed(2)} · 建议≈1（未强制）。该权重用于健康度提示说明并为后端接入做占位。</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-amber-300 hover:text-amber-700"
                onClick={()=>{
                  const next = structuredClone(conf);
                  next.presets = next.presets || {};
                  next.presets[currentPreset] = next.presets[currentPreset] || { label: currentPreset, weights: {} };
                  next.presets[currentPreset].weights = { ...defaults };
                  try{ window.localStorage.setItem('kpiConfigOverrides', JSON.stringify(next)); }catch{}
                  setConf(next);
                }}
              >
                <i className="ri-restart-line"/> 重置为默认
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Key</th>
                  <th className="px-3 py-2 text-left">名称</th>
                  <th className="px-3 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {presetEntries.map(([key, val]: any) => (
                  <tr key={key} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">{key}</td>
                    <td className="px-3 py-2 text-sm text-gray-800">{val?.label ?? key} {key===currentPreset && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">当前</span>}</td>
                    <td className="px-3 py-2 text-xs">
                      <button onClick={()=>onApply(key)} className="mr-2 rounded border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:border-blue-300 hover:text-blue-600">设为当前</button>
                      <button onClick={()=>renamePreset(key)} className="mr-2 rounded border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:border-indigo-300 hover:text-indigo-600">重命名</button>
                      <button onClick={()=>deletePreset(key)} className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:border-rose-300 hover:text-rose-600" disabled={key==='default'}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500">提示：预设及其阈值配置仅存储在浏览器本地，可随时导入/导出。</div>
        </div>
      </div>
    </div>
  );
}
