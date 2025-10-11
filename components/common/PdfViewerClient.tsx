'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
// 我们的静态导出环境无法托管 worker bundle，直接在主线程渲染。
try {
  (GlobalWorkerOptions as any).disableWorker = true;
} catch {}

interface PdfViewerClientProps {
  sourceUrl: string;
  fileName: string;
  onError?: (error: Error) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const PdfViewerClient = ({ sourceUrl, fileName, onError }: PdfViewerClientProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [renderRevision, setRenderRevision] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [computedScale, setComputedScale] = useState(1);

  const scheduleRender = useCallback(() => {
    setRenderRevision(prev => prev + 1);
  }, []);

  const destroyDocument = useCallback(async () => {
    try {
      renderTaskRef.current?.cancel();
    } catch (err) {
      console.warn('取消 PDF 渲染失败', err);
    }
    renderTaskRef.current = null;
    const doc = pdfDocRef.current;
    pdfDocRef.current = null;
    if (doc) {
      try {
        await doc.destroy();
      } catch (err) {
        console.warn('销毁 PDF 文档失败', err);
      }
    }
  }, []);

  // 加载 PDF 文档
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setNumPages(0);
      setPageNumber(1);
      setScale(1);
      setComputedScale(1);
      setFitWidth(true);

      try {
        const loadingTask = getDocument({ url: sourceUrl, withCredentials: false, disableWorker: true });
        const pdfDoc = await loadingTask.promise;
        if (cancelled) {
          await pdfDoc.destroy();
          return;
        }
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
        setError(null);
        setTimeout(scheduleRender, 0);
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error('加载 PDF 失败');
        console.error('加载 PDF 失败', errorInstance);
        if (!cancelled) {
          setError(errorInstance.message || '加载 PDF 失败');
          setIsLoading(false);
          onError?.(errorInstance);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      destroyDocument();
    };
  }, [sourceUrl, reloadToken, destroyDocument, scheduleRender, onError]);

  // 渲染当前页
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!pdfDoc || !canvas || !container) return;

    let cancelled = false;
    setIsRendering(true);
    setError(null);

    const renderPage = async () => {
      try {
        try {
          renderTaskRef.current?.cancel();
        } catch (err) {
          console.warn('取消前一次渲染失败', err);
        }

        const page = await pdfDoc.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const padding = 32; // px-4 左右边距
        const containerWidth = container.clientWidth > padding ? container.clientWidth - padding : container.clientWidth;
        let targetScale = fitWidth && containerWidth > 0 ? containerWidth / baseViewport.width : scale;
        targetScale = clamp(targetScale, 0.5, 4);

        const viewport = page.getViewport({ scale: targetScale });
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('无法获取 Canvas 上下文');
        }
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = viewport.width * outputScale;
        canvas.height = viewport.height * outputScale;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderTask = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!cancelled) {
          setComputedScale(targetScale);
          setIsRendering(false);
        }
      } catch (err) {
        if (cancelled) return;
        const errorInstance = err instanceof Error ? err : new Error('渲染 PDF 失败');
        console.error('渲染 PDF 失败', errorInstance);
        setError(errorInstance.message || '渲染 PDF 失败');
        setIsRendering(false);
        onError?.(errorInstance);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel();
      } catch (err) {
        console.warn('取消渲染失败', err);
      }
    };
  }, [pageNumber, scale, fitWidth, renderRevision, onError]);

  // fitWidth 状态下监听窗口尺寸变化
  useEffect(() => {
    if (!fitWidth) return;
    const handleResize = () => scheduleRender();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitWidth, scheduleRender]);

  const handlePrevious = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  const handleZoomIn = useCallback(() => {
    setFitWidth(false);
    setScale(prev => clamp(prev + 0.25, 0.5, 4));
    setTimeout(scheduleRender, 0);
  }, [scheduleRender]);

  const handleZoomOut = useCallback(() => {
    setFitWidth(false);
    setScale(prev => clamp(prev - 0.25, 0.5, 4));
    setTimeout(scheduleRender, 0);
  }, [scheduleRender]);

  const handleResetScale = useCallback(() => {
    setFitWidth(false);
    setScale(1);
    setTimeout(scheduleRender, 0);
  }, [scheduleRender]);

  const handleFitWidth = useCallback(() => {
    setFitWidth(true);
    setTimeout(scheduleRender, 0);
  }, [scheduleRender]);

  const progressLabel = useMemo(() => {
    if (isLoading) return '正在加载文档...';
    if (isRendering) return '渲染中...';
    return `${pageNumber}/${numPages || 1}`;
  }, [isLoading, isRendering, pageNumber, numPages]);

  const zoomPercent = useMemo(() => `${Math.round(computedScale * 100)}%`, [computedScale]);

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <i className="ri-pages-line text-gray-400"></i>
            {progressLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="ri-zoom-in-line text-gray-400"></i>
            {zoomPercent}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-gray-400" title={fileName}>
            <i className="ri-file-line"></i>
            {fileName}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-gray-600">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isLoading || pageNumber <= 1}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading || pageNumber >= numPages}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-gray-600">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={isLoading || isRendering}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              <i className="ri-zoom-out-line"></i>
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={isLoading || isRendering}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              <i className="ri-zoom-in-line"></i>
            </button>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-gray-600">
            <button
              type="button"
              onClick={handleFitWidth}
              disabled={isLoading || isRendering || fitWidth}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              <i className="ri-fullscreen-line"></i>
              适应宽度
            </button>
            <button
              type="button"
              onClick={handleResetScale}
              disabled={isLoading || isRendering || (!fitWidth && Math.abs(scale - 1) < 0.01)}
              className="px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-100"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-auto bg-slate-100 px-4 py-4 max-h-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
              <i className="ri-loader-4-line animate-spin text-base text-blue-500"></i>
              <span>正在加载 PDF ...</span>
            </div>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600">
              <div className="mb-1 flex items-center gap-1 font-medium">
                <i className="ri-error-warning-line"></i>
                预览失败
              </div>
              <p className="text-xs text-rose-500">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setReloadToken(prev => prev + 1);
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
              >
                <i className="ri-refresh-line"></i>
                重试
              </button>
            </div>
          </div>
        )}
        {!isLoading && !error && (
          <div className="relative mx-auto flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full rounded-lg border border-gray-200 bg-white shadow-sm"
            />
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-600 shadow">
                  <i className="ri-loader-4-line animate-spin text-blue-500"></i>
                  渲染中
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewerClient;
