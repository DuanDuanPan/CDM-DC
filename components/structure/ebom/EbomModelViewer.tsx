"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCompareSync } from '../simulation/CompareSyncContext';

interface Props {
  src?: string; // glTF/GLB URL
  poster?: string; // preview image
  className?: string;
  height?: number;
  syncKey?: string;
}

// 轻量化 3D 预览：优先用 <model-viewer>（web component，懒加载脚本），
// 无依赖、适合 MVP。若脚本加载失败，展示占位提示。
export default function EbomModelViewer({ src, poster, className, height = 280, syncKey }: Props) {
  const [section, setSection] = useState<'none' | 'xz' | 'yz'>('none');
  const [isolated, setIsolated] = useState(false);
  const [highlight, setHighlight] = useState<'manufacturing' | 'risk' | 'none'>('none');
  const viewerRef = useRef<any>(null);
  const applyingRef = useRef(false);
  const { syncEnabled, lastCamera, updateCamera } = useCompareSync();

  useEffect(() => {
    if ((window as any).ModelViewerElement) return; // 已加载
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      // 不移除，避免重复加载
    };
  }, []);

  const sectionLabel = useMemo(() => {
    switch (section) {
      case 'xz':
        return '剖切：XZ 平面';
      case 'yz':
        return '剖切：YZ 平面';
      default:
        return '剖切：关闭';
    }
  }, [section]);

  const highlightLabel = useMemo(() => {
    switch (highlight) {
      case 'manufacturing':
        return '高亮：制造特征';
      case 'risk':
        return '高亮：风险区域';
      default:
        return '高亮：关闭';
    }
  }, [highlight]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !syncKey) return;
    const handleCamera = () => {
      if (!syncEnabled || applyingRef.current) return;
      updateCamera(syncKey, {
        orbit: viewer.getAttribute('camera-orbit'),
        target: viewer.getAttribute('camera-target'),
        fieldOfView: viewer.getAttribute('field-of-view'),
        timestamp: Date.now()
      });
    };
    viewer.addEventListener('camera-change', handleCamera);
    return () => {
      viewer.removeEventListener('camera-change', handleCamera);
    };
  }, [syncEnabled, syncKey, updateCamera]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !syncKey || !lastCamera || !syncEnabled) return;
    if (lastCamera.sourceId === syncKey) return;
    applyingRef.current = true;
    if (lastCamera.state.orbit) viewer.setAttribute('camera-orbit', lastCamera.state.orbit);
    if (lastCamera.state.target) viewer.setAttribute('camera-target', lastCamera.state.target);
    if (lastCamera.state.fieldOfView) viewer.setAttribute('field-of-view', lastCamera.state.fieldOfView);
    const raf = window.requestAnimationFrame(() => {
      applyingRef.current = false;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [lastCamera, syncEnabled, syncKey]);

  if (!src) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-gray-400 ${className ?? ''}`}>
        <div className="text-center">
          <i className="ri-cube-line text-3xl" />
          <div className="mt-1 text-sm">无 3D 模型</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* @ts-expect-error web component */}
      <model-viewer
        ref={viewerRef}
        src={src}
        poster={poster}
        style={{ width: '100%', height: `${height}px`, background: 'white', borderRadius: '0.75rem' }}
        camera-controls
        ar
        exposure="0.9"
        shadow-intensity="0.7"
        alt="3D 预览"
      />
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">Mock 控件</span>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={isolated}
              onChange={(event) => setIsolated(event.target.checked)}
            />
            隔离子组件
          </label>
        </div>
        <div className="flex items-center gap-1">
          <span>剖切</span>
          <select
            value={section}
            onChange={(event) => setSection(event.target.value as typeof section)}
            className="rounded border border-gray-300 bg-white px-2 py-0.5"
          >
            <option value="none">关闭</option>
            <option value="xz">XZ</option>
            <option value="yz">YZ</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span>高亮</span>
          <select
            value={highlight}
            onChange={(event) => setHighlight(event.target.value as typeof highlight)}
            className="rounded border border-gray-300 bg-white px-2 py-0.5"
          >
            <option value="none">关闭</option>
            <option value="manufacturing">制造特征</option>
            <option value="risk">风险区域</option>
          </select>
        </div>
        <div className="ml-auto hidden text-[11px] text-gray-400 md:flex">
          <span className="mr-3"><i className="ri-slice-line mr-1" /> {sectionLabel}</span>
          <span className="mr-3"><i className="ri-focus-3-line mr-1" /> {isolated ? '隔离：叶尖副叶片' : '隔离：关闭'}</span>
          <span><i className="ri-lightbulb-line mr-1" /> {highlightLabel}</span>
        </div>
      </div>
    </div>
  );
}
