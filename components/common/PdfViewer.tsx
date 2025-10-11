'use client';

import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
      正在加载 PDF 预览...
    </div>
  )
});

export type PdfPreviewStatus = 'ready' | 'processing' | 'unavailable' | 'mock';

export interface PdfViewerProps {
  fileName: string;
  sourceUrl?: string | null;
  docxUrl?: string | null;
  previewStatus?: PdfPreviewStatus;
  convertedAt?: string | null;
  className?: string;
  height?: number;
  onRetry?: () => void;
  footerSlot?: ReactNode;
  allowMaximize?: boolean;
}

const statusLabelMap: Record<PdfPreviewStatus, { label: string; tone: string; text: string }> = {
  ready: { label: 'PDF 就绪', tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: '预览已生成，可直接在线浏览。' },
  mock: { label: 'Mock PDF', tone: 'bg-amber-50 text-amber-600 border-amber-200', text: '当前为占位 PDF，可替换为真实转换结果。' },
  processing: { label: '转换中', tone: 'bg-blue-50 text-blue-600 border-blue-200', text: '文件正在转换为 PDF，稍后可重试刷新。' },
  unavailable: { label: '暂不可用', tone: 'bg-rose-50 text-rose-600 border-rose-200', text: '未生成 PDF 预览，请下载原始文档。' }
};

const combine = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const PdfViewer = ({
  fileName,
  sourceUrl,
  docxUrl,
  previewStatus,
  convertedAt,
  className,
  height = 480,
  onRetry,
  footerSlot,
  allowMaximize = false
}: PdfViewerProps) => {
  const resolvedStatus: PdfPreviewStatus = previewStatus ?? (sourceUrl ? 'ready' : 'unavailable');
  const statusMeta = statusLabelMap[resolvedStatus];
  const [isMaximized, setIsMaximized] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(720);

  useEffect(() => {
    if (!isMaximized) return;
    const compute = () => {
      if (typeof window === 'undefined') return;
      const computed = Math.max(Math.min(window.innerHeight - 160, 960), 400);
      setOverlayHeight(computed);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isMaximized]);

  useEffect(() => {
    if (!isMaximized) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMaximized]);

  const renderDownloadButtons = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-blue-600 transition hover:bg-blue-50"
        >
          <i className="ri-file-pdf-line"></i>
          下载 PDF
        </a>
      )}
      {docxUrl && (
        <a
          href={docxUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50"
        >
          <i className="ri-file-word-line"></i>
          下载 DOCX
        </a>
      )}
    </div>
  );

  const renderUnavailable = () => (
    <div
      className={combine(
        'flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-gray-50 text-center',
        'px-6 py-8 text-sm text-gray-500'
      )}
      style={{ minHeight: height, maxHeight: height, height }}
    >
      <div className="text-base font-medium text-gray-700">未生成 PDF 预览</div>
      <p className="max-w-sm text-xs leading-relaxed text-gray-500">
        当前文件尚未完成 DOCX → PDF 转换。您可以下载原始文档查看内容，或稍后重试。
      </p>
      <div className="flex items-center gap-2">
        {docxUrl && (
          <a
            href={docxUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <i className="ri-download-2-line"></i>
            下载 DOCX
          </a>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            <i className="ri-refresh-line"></i>
            刷新状态
          </button>
        )}
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div
      className="flex h-full flex-col justify-between rounded-xl border border-blue-100 bg-white"
      style={{ minHeight: height, maxHeight: height, height }}
    >
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <i className="ri-loader-4-line animate-spin text-xl"></i>
        </div>
        <div className="text-base font-medium text-gray-900">正在生成 PDF 预览</div>
        <p className="max-w-sm text-xs leading-relaxed text-gray-500">
          后端正在转换 <span className="font-medium text-gray-700">{fileName}</span>，完成后该位置将自动展示在线预览。您也可以下载原始 DOCX 查看。
        </p>
        {docxUrl && (
          <a
            href={docxUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <i className="ri-file-word-2-line"></i>
            下载 DOCX
          </a>
        )}
      </div>
      <div className="border-t border-blue-100 bg-blue-50/40 px-6 py-3 text-xs text-blue-700">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-blue-700 underline-offset-4 hover:underline"
          >
            <i className="ri-refresh-line"></i>
            手动刷新状态
          </button>
        ) : (
          '请稍后刷新列表以获取最新进度。'
        )}
      </div>
    </div>
  );

  if (resolvedStatus === 'unavailable' || !sourceUrl) {
    return (
      <div className={combine('flex flex-col gap-4', className)}>
        {renderUnavailable()}
        {footerSlot}
      </div>
    );
  }

  if (resolvedStatus === 'processing') {
    return (
      <div className={combine('flex flex-col gap-4', className)}>
        {renderProcessing()}
        {footerSlot}
      </div>
    );
  }

  const viewerHeight = height;

  const renderHeader = (extraButtons?: ReactNode) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900" title={fileName}>
            {fileName}
          </span>
          <span className={combine('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', statusMeta.tone)}>
            <i className="ri-file-pdf-2-line"></i>
            {statusMeta.label}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          {resolvedStatus === 'mock' ? '当前展示为 Mock PDF，将随后端接入自动替换。' : statusMeta.text}
          {convertedAt && (
            <span className="ml-2 text-gray-400">转换时间：{convertedAt}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {allowMaximize && sourceUrl && !isMaximized && (
          <button
            type="button"
            onClick={() => setIsMaximized(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-100"
          >
            <i className="ri-fullscreen-line"></i>
            最大化
          </button>
        )}
        {renderDownloadButtons()}
        {extraButtons}
      </div>
    </div>
  );

  const viewerBody = (
    <div className="flex-1 bg-gray-50" style={{ minHeight: viewerHeight, maxHeight: viewerHeight, height: viewerHeight }}>
      {sourceUrl ? (
        <PdfViewerClient sourceUrl={sourceUrl} fileName={fileName} />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          无可用 PDF 资源
        </div>
      )}
    </div>
  );

  const baseViewer = (
    <div
      className={combine(
        'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        className
      )}
      style={{ minHeight: viewerHeight }}
    >
      {renderHeader()}
      {viewerBody}
      {footerSlot && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">{footerSlot}</div>
      )}
    </div>
  );

  const overlay = allowMaximize && isMaximized && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setIsMaximized(false);
            }
          }}
        >
          <div className="flex h-[calc(100vh-80px)] w-[min(1100px,calc(100vw-48px))] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            {renderHeader(
              <button
                type="button"
                onClick={() => setIsMaximized(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
              >
                <i className="ri-close-fullscreen-line"></i>
                退出全屏
              </button>
            )}
            <div className="flex-1 bg-gray-50" style={{ minHeight: overlayHeight, maxHeight: overlayHeight, height: overlayHeight }}>
              {sourceUrl ? (
                <PdfViewerClient sourceUrl={sourceUrl} fileName={fileName} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  无可用 PDF 资源
                </div>
              )}
            </div>
            {footerSlot && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">{footerSlot}</div>
            )}
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
};

export default PdfViewer;
