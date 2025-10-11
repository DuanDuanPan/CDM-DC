'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  height?: number;
  className?: string;
  caption?: ReactNode;
  allowMaximize?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const combine = (...tokens: Array<string | false | null | undefined>) => tokens.filter(Boolean).join(' ');

const overlayPadding = 48;

export default function ImageViewer({
  src,
  alt,
  height = 360,
  className,
  caption,
  allowMaximize = false
}: ImageViewerProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'free'>('contain');
  const [isMaximized, setIsMaximized] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(720);

  useEffect(() => {
    if (!isMaximized) return;
    const resize = () => {
      if (typeof window === 'undefined') return;
      const computed = Math.max(Math.min(window.innerHeight - overlayPadding * 2, 960), 400);
      setOverlayHeight(computed);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isMaximized]);

  useEffect(() => {
    if (!isMaximized) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMaximized]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  const zoom = useCallback((delta: number) => {
    setFitMode('free');
    setScale(prev => clamp(Number((prev + delta).toFixed(2)), 0.3, 4));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (fitMode === 'contain') {
      setFitMode('free');
    }
    setIsPointerDown(true);
    dragRef.current = { x: event.clientX, y: event.clientY };
    surfaceRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown || !dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDown(false);
    dragRef.current = null;
    surfaceRef.current?.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    zoom(delta);
  };

  useEffect(() => {
    if (fitMode === 'contain') {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [fitMode]);

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900" title={alt || src}>{alt || src.split('/').pop()}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
            <i className="ri-focus-2-line"></i>
            {fitMode === 'contain' ? '自适应' : `${Math.round(scale * 100)}%`}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => zoom(-0.2)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
        >
          <i className="ri-zoom-out-line"></i>
          缩小
        </button>
        <button
          type="button"
          onClick={() => zoom(0.2)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
        >
          <i className="ri-zoom-in-line"></i>
          放大
        </button>
        <button
          type="button"
          onClick={() => setFitMode(prev => (prev === 'contain' ? 'free' : 'contain'))}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
        >
          <i className={fitMode === 'contain' ? 'ri-fullscreen-line' : 'ri-focus-line'}></i>
          {fitMode === 'contain' ? '填充' : '自适应'}
        </button>
        <button
          type="button"
          onClick={resetView}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
        >
          <i className="ri-refresh-line"></i>
          重置
        </button>
        {allowMaximize && !isMaximized && (
          <button
            type="button"
            onClick={() => setIsMaximized(true)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            <i className="ri-fullscreen-line"></i>
            最大化
          </button>
        )}
      </div>
    </div>
  );

  const viewerSurface = (viewerHeight: number) => (
    <div
      ref={surfaceRef}
      className="relative flex-1 overflow-hidden bg-gray-900/5"
      style={{ minHeight: viewerHeight, maxHeight: viewerHeight, height: viewerHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsPointerDown(false)}
      onWheel={handleWheel}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={combine('select-none transition-transform', isPointerDown ? 'duration-0' : 'duration-100 ease-out')}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          cursor: fitMode === 'contain' ? 'zoom-in' : isPointerDown ? 'grabbing' : 'grab',
          maxWidth: fitMode === 'contain' ? '100%' : undefined,
          maxHeight: fitMode === 'contain' ? '100%' : undefined,
          objectFit: fitMode === 'contain' ? 'contain' : 'cover'
        }}
        onDoubleClick={() => setFitMode(prev => (prev === 'contain' ? 'free' : 'contain'))}
      />
    </div>
  );

  const footer = caption ? (
    <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-[11px] text-gray-500">{caption}</div>
  ) : null;

  const baseViewer = (
    <div
      className={combine('flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm', className)}
      style={{ minHeight: height }}
    >
      {toolbar}
      {viewerSurface(height)}
      {footer}
    </div>
  );

  const overlay = isMaximized && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsMaximized(false);
          }}
        >
          <div className="flex h-[calc(100vh-80px)] w-[calc(100vw-48px)] max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex flex-col gap-1">
                <div className="text-base font-semibold text-gray-900">图像预览</div>
                <div className="text-xs text-gray-500">{alt || src}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => zoom(-0.2)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <i className="ri-zoom-out-line"></i>
                  缩小
                </button>
                <button
                  type="button"
                  onClick={() => zoom(0.2)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <i className="ri-zoom-in-line"></i>
                  放大
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode(prev => (prev === 'contain' ? 'free' : 'contain'))}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <i className={fitMode === 'contain' ? 'ri-fullscreen-line' : 'ri-focus-line'}></i>
                  {fitMode === 'contain' ? '填充' : '自适应'}
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <i className="ri-refresh-line"></i>
                  重置
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaximized(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <i className="ri-close-fullscreen-line"></i>
                  退出全屏
                </button>
              </div>
            </div>
            {viewerSurface(overlayHeight)}
            {footer}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {baseViewer}
      {overlay}
    </>
  );
}
