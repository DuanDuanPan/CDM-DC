'use client';
/* eslint-disable @next/next/no-img-element */

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  height?: number;
  className?: string;
  caption?: ReactNode;
  allowMaximize?: boolean;
  comparisonSources?: string[];
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
  allowMaximize = false,
  comparisonSources
}: ImageViewerProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const prevHasCompare = useRef(false);

  const hasCompareModes = (comparisonSources?.length ?? 0) >= 2;
  const comparisonPair = hasCompareModes ? comparisonSources!.slice(0, 2) : undefined;
  const [primaryImage, secondaryImage] = comparisonPair ?? [];

  const [mode, setMode] = useState<'single' | 'slider' | 'side' | 'diff'>(() => (hasCompareModes ? 'slider' : 'single'));
  const [sliderValue, setSliderValue] = useState(50);
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

  useEffect(() => {
    if (!prevHasCompare.current && hasCompareModes && mode === 'single') {
      setMode('slider');
    }
    if (prevHasCompare.current && !hasCompareModes) {
      setMode('single');
    }
    prevHasCompare.current = hasCompareModes;
  }, [hasCompareModes, mode]);

  useEffect(() => {
    setSliderValue(50);
  }, [primaryImage, secondaryImage]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  useEffect(() => {
    resetView();
    if (mode === 'slider') {
      setSliderValue(50);
    }
  }, [mode, resetView]);

  const zoom = useCallback((delta: number) => {
    setFitMode('free');
    setScale(prev => clamp(Number((prev + delta).toFixed(2)), 0.3, 4));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'single') return;
    if (fitMode === 'contain') {
      setFitMode('free');
    }
    setIsPointerDown(true);
    dragRef.current = { x: event.clientX, y: event.clientY };
    surfaceRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'single') return;
    if (!isPointerDown || !dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'single') return;
    setIsPointerDown(false);
    dragRef.current = null;
    surfaceRef.current?.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (mode !== 'single') return;
    if (!event.ctrlKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    zoom(delta);
  };

  useEffect(() => {
    if (mode !== 'single') return;
    if (fitMode === 'contain') {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [fitMode, mode]);

  const effectiveAlt = alt || src.split('/').pop() || src;

  const handleReset = () => {
    if (mode === 'single') {
      resetView();
    } else {
      setSliderValue(50);
    }
  };

  const renderModeButton = (value: 'single' | 'slider' | 'side' | 'diff', label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`px-2 py-1 ${mode === value ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
      aria-pressed={mode === value}
      title={`切换至${label}模式`}
    >
      {label}
    </button>
  );

  const viewBadgeIcon = (
    mode === 'slider' ? 'ri-scissors-line' : mode === 'side' ? 'ri-layout-row-line' : mode === 'diff' ? 'ri-contrast-2-line' : 'ri-focus-2-line'
  );
  const viewBadgeLabel = (
    mode === 'slider'
      ? `滑块 ${sliderValue}%`
      : mode === 'side'
        ? '并排视图'
        : mode === 'diff'
          ? '差异视图'
          : (fitMode === 'contain' ? '自适应' : `${Math.round(scale * 100)}%`)
  );

  const renderToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900" title={effectiveAlt}>{effectiveAlt}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
            <i className={viewBadgeIcon}></i>
            {viewBadgeLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {hasCompareModes && (
          <>
            <span className="text-gray-500">视图</span>
            <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
              {renderModeButton('single', '单图')}
              {renderModeButton('slider', '滑块')}
              {renderModeButton('side', '并排')}
              {renderModeButton('diff', '差异')}
            </div>
            {mode === 'slider' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
                <i className="ri-scissors-cut-line"></i>
                {sliderValue}%
              </span>
            )}
          </>
        )}
        {mode === 'single' && (
          <>
            <span className="text-gray-500">缩放</span>
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
          </>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
        >
          <i className="ri-refresh-line"></i>
          重置
        </button>
        {allowMaximize && (
          <button
            type="button"
            onClick={() => setIsMaximized(prev => !prev)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            <i className={isMaximized ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}></i>
            {isMaximized ? '退出' : '最大化'}
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
          cursor: mode === 'single' ? (fitMode === 'contain' ? 'zoom-in' : isPointerDown ? 'grabbing' : 'grab') : 'default',
          maxWidth: fitMode === 'contain' ? '100%' : undefined,
          maxHeight: fitMode === 'contain' ? '100%' : undefined,
          objectFit: fitMode === 'contain' ? 'contain' : 'cover'
        }}
        onDoubleClick={() => {
          if (mode !== 'single') return;
          setFitMode(prev => (prev === 'contain' ? 'free' : 'contain'));
        }}
      />
    </div>
  );

  const renderMainSurface = (viewerHeight: number) => {
    if (!hasCompareModes || mode === 'single' || !primaryImage || !secondaryImage) {
      return viewerSurface(viewerHeight);
    }

    if (mode === 'side') {
      return (
        <div
          className="flex flex-1 gap-4 overflow-hidden rounded-lg border border-gray-200 bg-slate-900/10 p-3"
          style={{ minHeight: viewerHeight, maxHeight: viewerHeight, height: viewerHeight }}
        >
          {[{ label: '基线', src: primaryImage }, { label: '对比', src: secondaryImage }].map(item => (
            <figure key={item.label} className="relative flex flex-1 items-center justify-center rounded-lg bg-white shadow-inner">
              <img src={item.src} alt={`${effectiveAlt} · ${item.label}`} className="max-h-full max-w-full select-none object-contain" />
              <figcaption className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-medium text-white">
                {item.label}
              </figcaption>
            </figure>
          ))}
        </div>
      );
    }

    if (mode === 'diff') {
      return (
        <div
          className="relative flex-1 overflow-hidden rounded-lg border border-gray-200 bg-slate-900"
          style={{ minHeight: viewerHeight, maxHeight: viewerHeight, height: viewerHeight }}
        >
          <img src={primaryImage} alt={`${effectiveAlt} · 基线`} className="absolute inset-0 h-full w-full select-none object-contain opacity-60" />
          <img src={secondaryImage} alt={`${effectiveAlt} · 对比`} className="absolute inset-0 h-full w-full select-none object-contain mix-blend-difference" />
          <span className="absolute left-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            差异模式
          </span>
        </div>
      );
    }

    // slider 模式
    return (
      <div
        className="relative flex-1 overflow-hidden rounded-lg border border-gray-200 bg-slate-900/10"
        style={{ minHeight: viewerHeight, maxHeight: viewerHeight, height: viewerHeight }}
      >
        <img src={primaryImage} alt={`${effectiveAlt} · 基线`} className="absolute inset-0 h-full w-full select-none object-contain" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderValue}%` }}>
          <img src={secondaryImage} alt={`${effectiveAlt} · 对比`} className="h-full w-full select-none object-contain" />
        </div>
        <div
          className="absolute inset-y-3 w-px bg-blue-500/70 shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
          style={{ left: `${sliderValue}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border border-white bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {sliderValue}%
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={event => setSliderValue(Number(event.target.value))}
          className="absolute bottom-4 left-1/2 w-[240px] -translate-x-1/2 accent-blue-600"
          aria-label="滑块对比"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-medium text-white">基线</span>
        <span className="absolute right-3 top-3 rounded-full bg-blue-600/80 px-2 py-0.5 text-[11px] font-medium text-white">对比</span>
      </div>
    );
  };

  const footer = caption ? (
    <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-[11px] text-gray-500">{caption}</div>
  ) : null;

  const content = (
    <div
      className={combine('flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm', className)}
      style={{ minHeight: height }}
    >
      {renderToolbar()}
      {renderMainSurface(height)}
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
          <div className="flex h-[calc(100vh-64px)] w-[calc(100vw-48px)] max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            {renderToolbar()}
            {renderMainSurface(overlayHeight)}
            {footer}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {content}
      {overlay}
    </>
  );
}
