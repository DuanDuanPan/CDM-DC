"use client";

import { useEffect } from 'react';

interface Props {
  src?: string; // glTF/GLB URL
  poster?: string; // preview image
  className?: string;
}

// 轻量化 3D 预览：优先用 <model-viewer>（web component，懒加载脚本），
// 无依赖、适合 MVP。若脚本加载失败，展示占位提示。
export default function EbomModelViewer({ src, poster, className }: Props) {
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
    <div className={className}>
      {/* @ts-expect-error web component */}
      <model-viewer
        src={src}
        poster={poster}
        style={{ width: '100%', height: '280px', background: 'white', borderRadius: '0.75rem' }}
        camera-controls
        ar
        exposure="0.9"
        shadow-intensity="0.7"
        alt="3D 预览"
      />
    </div>
  );
}
