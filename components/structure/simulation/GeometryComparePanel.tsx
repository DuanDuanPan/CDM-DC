"use client";

import { useState } from 'react';
import type { SimulationFile } from './types';

interface Props {
  files: SimulationFile[];
}

export default function GeometryComparePanel({ files }: Props) {
  const count = files.length; // 使用以消除未用变量告警
  const [mode, setMode] = useState<'overlay' | 'translucent' | 'flash'>('overlay');
  const [syncCam, setSyncCam] = useState(true);
  const [showDelta, setShowDelta] = useState(false);
  const [slice, setSlice] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span className="text-gray-500">显示</span>
          <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
            {(['overlay','translucent','flash'] as const).map(m => (
              <button key={m} className={`px-2 py-1 ${mode===m?'bg-blue-50 text-blue-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setMode(m)}>
                {m==='overlay'?'叠加':m==='translucent'?'半透':'闪烁'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <label className="inline-flex items-center gap-1"><input type="checkbox" className="h-3.5 w-3.5" checked={syncCam} onChange={e=>setSyncCam(e.target.checked)} />同步相机</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" className="h-3.5 w-3.5" checked={showDelta} onChange={e=>setShowDelta(e.target.checked)} />差值场</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" className="h-3.5 w-3.5" checked={slice} onChange={e=>setSlice(e.target.checked)} />剖切</label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['A','B'].map((label, idx) => (
          <div key={idx} className={`h-56 border border-gray-200 rounded-lg relative overflow-hidden ${mode==='flash'?'animate-pulse':''}`}>
            <div className={`absolute inset-0 ${mode==='translucent' ? 'bg-blue-300/20' : 'bg-blue-100/30'}`}></div>
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">3D 视口 {label}</div>
          </div>
        ))}
        <div className="col-span-2 h-56 border border-gray-200 rounded-lg relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-purple-50/30"></div>
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">差值视口（A - B）{showDelta ? '· 显示差值场' : ''} {slice ? '· 剖切启用' : ''}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500">占位视图用于展示交互方案；可替换为实际 3D 组件并复用同样的控制逻辑。文件数：{count}</div>
    </div>
  );
}
