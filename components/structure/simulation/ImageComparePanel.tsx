"use client";

import { useMemo, useState } from 'react';
import type { SimulationFile } from './types';

interface Props {
  files: SimulationFile[];
  mode: 'side' | 'slider' | 'diff';
}

export default function ImageComparePanel({ files, mode }: Props) {
  // 取前两张图片作为示意
  const [ratio, setRatio] = useState(50);
  const images = useMemo(() => {
    const pics = files.filter(f => /\.(png|jpg|jpeg|bmp|gif|webp|svg)$/i.test(f.name));
    const fa = pics[0];
    const fb = pics[1] || pics[0];
    const phA = '/mock/previews/placeholder-a.png';
    const phB = '/mock/previews/placeholder-b.png';
    // 没有真实图就用渐变块占位
    return [fa?.name || '图像A', fb?.name || '图像B', phA, phB];
  }, [files]);

  if (mode === 'side') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0,1].map(i => (
          <div key={i} className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
            {images[i]}
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'slider') {
    return (
      <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden bg-slate-50">
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">{images[1]}</div>
        <div className="absolute inset-0" style={{ clipPath: `polygon(0 0, ${ratio}% 0, ${ratio}% 100%, 0 100%)` }}>
          <div className="h-full w-full flex items-center justify-center bg-white/70 text-sm text-gray-700">{images[0]}</div>
        </div>
        <input type="range" min={0} max={100} value={ratio} onChange={e => setRatio(Number(e.target.value))} className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2"/>
      </div>
    );
  }

  // diff
  return (
    <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(59,130,246,.20)_0_10px,rgba(59,130,246,.10)_10px_20px)] animate-pulse" />
      <div className="relative h-full w-full flex items-center justify-center text-sm text-gray-600">像素差异热图（占位）</div>
    </div>
  );
}

