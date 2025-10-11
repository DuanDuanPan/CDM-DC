import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SimulationFile, SimulationCondition } from './types';
import ConditionBar from './ConditionBar';
import KpiMatrix from './KpiMatrix';
import CurveComparePanel from './CurveComparePanel';
import ImageComparePanel from './ImageComparePanel';
import GeometryComparePanel from './GeometryComparePanel';
import PdfViewer from '../../common/PdfViewer';

interface Props {
  items: SimulationFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const renderCompareContent = (
  items: SimulationFile[],
  opts?: {
    conditions?: SimulationCondition[];
    selectedConditionIds?: string[];
    baselineId?: string;
    onChangeSelected?: (ids: string[]) => void;
    onChangeBaseline?: (id: string) => void;
    curveMode?: 'overlay' | 'grid';
    onChangeCurveMode?: (m: 'overlay' | 'grid') => void;
    maximized?: boolean;
  }
) => {
  if (items.length === 0) {
    return <div className="text-sm text-gray-500">请选择文件加入对比。</div>;
  }

  const types = new Set(items.map(item => item.type));

  if (types.size === 1) {
    const [type] = Array.from(types);
    switch (type) {
      case 'result': {
        const conditions = opts?.conditions ?? [];
        const selectedIds = opts?.selectedConditionIds ?? conditions.map(c => c.id);
        const baselineId = opts?.baselineId;
        const curveMode = opts?.curveMode || 'overlay';
        const normalizedItems = items.map(item => {
          if (item.activeConditionId) {
            const variant = item.conditionVariants?.[item.activeConditionId];
            if (variant) {
              return {
                ...item,
                preview: { ...variant }
              };
            }
          }
          return item;
        });
        const [haveImage] = [normalizedItems.some(it => /\.(png|jpg|jpeg|bmp|gif|webp|svg)$/i.test(it.name))];
        const [view, setView] = [
          (typeof window !== 'undefined' && (window as any).__sim_view_result__) || 'curve',
          (v: 'curve' | 'image') => { if (typeof window !== 'undefined') (window as any).__sim_view_result__ = v; }
        ] as const;
        const [alignMode, setAlignMode] = [
          (typeof window !== 'undefined' && (window as any).__sim_align_mode__) || 'original',
          (v: 'original' | 'normalizedX') => { if (typeof window !== 'undefined') (window as any).__sim_align_mode__ = v; }
        ] as const;
        const [yNormMode, setYNormMode] = [
          (typeof window !== 'undefined' && (window as any).__sim_ynorm_mode__) || 'none',
          (v: 'none' | 'delta' | 'percent') => { if (typeof window !== 'undefined') (window as any).__sim_ynorm_mode__ = v; }
        ] as const;
        const [imageMode, setImageMode] = [
          (typeof window !== 'undefined' && (window as any).__sim_image_mode__) || 'slider',
          (v: 'side' | 'slider' | 'diff') => { if (typeof window !== 'undefined') (window as any).__sim_image_mode__ = v; }
        ] as const;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto pr-2">
                <ConditionBar
                  conditions={conditions}
                  selectedIds={selectedIds}
                  baselineId={baselineId}
                  onChange={ids => opts?.onChangeSelected?.(ids)}
                  onBaselineChange={id => opts?.onChangeBaseline?.(id)}
                />
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-2 md:gap-3 flex-wrap justify-end">
                {haveImage && (
                  <>
                    <span className="text-gray-500">对比视图</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      <button className={`px-2 py-1 ${view==='curve'?'bg-blue-50 text-blue-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setView('curve')}>曲线</button>
                      <button className={`px-2 py-1 ${view==='image'?'bg-blue-50 text-blue-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setView('image')}>图像</button>
                    </div>
                  </>
                )}
                {view !== 'image' && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">曲线模式</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      <button className={`px-2 py-1 ${curveMode==='overlay' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => opts?.onChangeCurveMode?.('overlay')}>叠加</button>
                      <button className={`px-2 py-1 ${curveMode==='grid' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => opts?.onChangeCurveMode?.('grid')}>小网格</button>
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">对齐</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      <button className={`px-2 py-1 ${alignMode==='original'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setAlignMode('original')}>原始X</button>
                      <button className={`px-2 py-1 ${alignMode==='normalizedX'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setAlignMode('normalizedX')}>归一化X</button>
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">Y</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      <button className={`px-2 py-1 ${yNormMode==='none'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setYNormMode('none')}>原值</button>
                      <button className={`px-2 py-1 ${yNormMode==='delta'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setYNormMode('delta')}>Δ基准</button>
                      <button className={`px-2 py-1 ${yNormMode==='percent'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setYNormMode('percent')}>%基准</button>
                    </div>
                  </>
                )}
                {view === 'image' && haveImage && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">图像模式</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      <button className={`px-2 py-1 ${imageMode==='side'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setImageMode('side')}>并排</button>
                      <button className={`px-2 py-1 ${imageMode==='slider'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setImageMode('slider')}>滑块</button>
                      <button className={`px-2 py-1 ${imageMode==='diff'?'bg-gray-50 text-gray-700':'text-gray-600 hover:bg-gray-50'}`} onClick={() => setImageMode('diff')}>差异</button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              {view === 'image' && haveImage ? (
                <div className="flex-1 min-h-[220px] rounded-lg bg-slate-50">
                  <ImageComparePanel files={normalizedItems} mode={imageMode as any} />
                </div>
              ) : (
                <>
                  <div className="max-h-36 overflow-auto">
                    <KpiMatrix files={normalizedItems} conditions={conditions} selectedIds={selectedIds} baselineId={baselineId} />
                  </div>
                  <div className="flex-1 min-h-[220px] rounded-lg bg-white">
                    <CurveComparePanel files={normalizedItems} conditions={conditions} selectedIds={selectedIds} baselineId={baselineId} mode={curveMode} alignMode={alignMode as any} yNormMode={yNormMode as any} fillHeight />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
      case 'document':
      case 'report': {
        const gridClass = items.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1';
        const viewerHeight = opts?.maximized ? 580 : 360;
        const anyPreviewMissing = items.some(item => {
          const status = item.previewStatus ?? item.preview?.previewStatus;
          const pdfUrl = item.pdfUrl ?? item.preview?.pdfUrl;
          return (!pdfUrl && status !== 'processing');
        });
        return (
          <div className="space-y-3">
            <div className={`grid gap-3 ${gridClass}`}>
              {items.map(item => {
                const pdfUrl = item.pdfUrl ?? item.preview?.pdfUrl;
                const docxUrl = item.docxUrl ?? item.preview?.docxUrl;
                const previewStatus = item.previewStatus ?? item.preview?.previewStatus;
                const convertedAt = item.convertedAt ?? item.preview?.convertedAt;
                return (
                  <div key={item.compareKey ?? item.id} className="flex min-h-0 flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium text-gray-900 truncate" title={item.name}>{item.name}</span>
                      <span>版本 {item.compareVersion ?? item.belongsToVersion ?? item.version}</span>
                    </div>
                    <PdfViewer
                      className="flex-1"
                      fileName={item.name}
                      sourceUrl={pdfUrl}
                      docxUrl={docxUrl}
                      previewStatus={previewStatus}
                      convertedAt={convertedAt}
                      height={viewerHeight}
                      allowMaximize
                    />
                  </div>
                );
              })}
            </div>
            {anyPreviewMissing && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                部分文档尚未生成 PDF 预览，可先下载 DOCX 查看或稍后刷新转换状态。
              </div>
            )}
          </div>
        );
      }
      case 'geometry':
        return <GeometryComparePanel files={items} />;
      case 'model':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">仿真模型参数对比</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
              展示关键参数、网格设置、求解器配置差异。
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            当前类型暂未实现特定对比，可下载后线下比对。
          </div>
        );
    }
  }

  return (
    <div className="text-sm text-gray-600">
      多类型文件混合对比暂不支持，请选择相同类型的文件。
    </div>
  );
};

const SimulationCompareDrawer = ({ items, onRemove, onClear }: Props) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // 默认折叠
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [baselineConditionId, setBaselineConditionId] = useState<string | undefined>(undefined);
  const [curveMode, setCurveMode] = useState<'overlay' | 'grid'>('overlay');

  const allConditions = useMemo(() => {
    const map = new Map<string, SimulationCondition>();
    items.forEach(f => (f.conditions || []).forEach(c => { if (!map.has(c.id)) map.set(c.id, c); }));
    return Array.from(map.values());
  }, [items]);

  useEffect(() => {
    if (allConditions.length && selectedConditionIds.length === 0) {
      setSelectedConditionIds(allConditions.map(c => c.id));
      setBaselineConditionId(allConditions[0].id);
    }
  }, [allConditions, selectedConditionIds.length]);

  // 读取持久化状态
  useEffect(() => {
    try {
      const c = window.localStorage.getItem('sim.compare.collapsed');
      const m = window.localStorage.getItem('sim.compare.maximized');
      if (c !== null) setIsCollapsed(c === '1');
      if (m !== null) setIsMaximized(m === '1');
    } catch {}
  }, []);

  // 写入持久化状态
  useEffect(() => {
    try { window.localStorage.setItem('sim.compare.collapsed', isCollapsed ? '1' : '0'); } catch {}
  }, [isCollapsed]);
  useEffect(() => {
    try { window.localStorage.setItem('sim.compare.maximized', isMaximized ? '1' : '0'); } catch {}
  }, [isMaximized]);

  // 高亮反馈：加入项目时闪烁 + 首次加入自动展开
  useEffect(() => {
    if (items.length === 0) return;
    setIsHighlighted(true);
    const timer = window.setTimeout(() => setIsHighlighted(false), 800);
    // 首次加入对比自动展开一次
    try {
      const first = window.localStorage.getItem('sim.compare.firstExpanded');
      if (!first) {
        setIsCollapsed(false);
        window.localStorage.setItem('sim.compare.firstExpanded', '1');
      }
    } catch {}
    return () => window.clearTimeout(timer);
  }, [items.length]);

  // 键盘快捷键：C 折叠/展开；M 最大化；E 导出（>=2项）；Cmd/Ctrl+Backspace 清空
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'c') {
        // 折叠/展开（与最大化互斥）
        setIsCollapsed(prev => {
          if (!prev && isMaximized) setIsMaximized(false);
          return !prev;
        });
      }
      if (k === 'm') {
        setIsCollapsed(false);
        setIsMaximized(prev => !prev);
      }
      if (k === 'e' && items.length >= 2) {
        // 未来可触发导出
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') onClear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClear, isMaximized]);

  // 展开/最大化互斥逻辑
  const toggleCollapsed = () => {
    // 折叠时一定不是最大化
    if (!isCollapsed && isMaximized) setIsMaximized(false);
    setIsCollapsed(prev => !prev);
  };
  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
    } else {
      setIsCollapsed(false);
      setIsMaximized(true);
    }
  };

  // 高度策略
  // 折叠 44px；最大化 75vh；展开时：有内容固定 400px，无内容自适应（避免大面积留白）
  const containerHeightClass = isCollapsed
    ? 'h-11'
    : isMaximized
      ? 'h-[75vh]'
      : (items.length === 0 ? 'h-auto min-h-[140px]' : 'h-[400px]');

  const canExport = items.length >= 2;

  // 空态折叠时渲染一个轻量 pill，减少干扰
  if (!isMaximized && isCollapsed && items.length === 0) {
    return (
      <button
        role="region"
        aria-label="对比栏（空）"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-6 right-8 z-30 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/90 px-3 py-1 text-xs text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-600"
      >
        <i className="ri-arrow-up-s-line"></i>
        对比栏（0/6）
      </button>
    );
  }

  const renderChipRow = (variant: 'base' | 'overlay') => {
    if (items.length === 0) return null;
    const padding = variant === 'base' ? 'px-4 pb-3' : 'px-6 pb-4';
    return (
      <div className={padding}>
        <div className="flex gap-2 overflow-x-auto">
          {items.map(item => {
            const versionLabel = item.compareVersion ?? item.belongsToVersion ?? item.version;
            return (
              <div
                key={item.compareKey ?? item.id}
                className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="max-w-[120px] truncate sm:max-w-[160px]">{item.name}</span>
                  {versionLabel && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600">{versionLabel}</span>
                  )}
                  {item.activeConditionName && (
                    <span className="text-[10px] text-blue-500">· {item.activeConditionName}</span>
                  )}
                </div>
                <button className="text-blue-500 hover:text-blue-700" onClick={() => onRemove(item.compareKey ?? item.id)}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMainPanel = (variant: 'base' | 'overlay') => {
    const wrapperMargin = variant === 'base' ? 'mx-4 my-2' : 'mx-6 my-4';
    const padding = variant === 'base' ? 'p-3' : 'p-4';
    const minHeightClass = items.length === 0 ? 'min-h-[220px]' : 'h-full';
    return (
      <div className={`flex-1 min-h-0 border-t border-gray-100 bg-gray-50`}> 
        <div className={`flex flex-col overflow-hidden rounded-lg border border-dashed border-gray-300 bg-white ${wrapperMargin} ${padding} ${minHeightClass}`}>
          {renderCompareContent(items, {
            conditions: allConditions,
            selectedConditionIds,
            baselineId: baselineConditionId,
            onChangeSelected: setSelectedConditionIds,
            onChangeBaseline: setBaselineConditionId,
            curveMode,
            onChangeCurveMode: setCurveMode,
            maximized: variant === 'overlay',
          })}
        </div>
      </div>
    );
  };

  const renderContentBlock = (variant: 'base' | 'overlay') => (
    <div className="flex h-full flex-col overflow-hidden">
      {renderChipRow(variant)}
      {renderMainPanel(variant)}
    </div>
  );

  const renderHeader = (variant: 'base' | 'overlay') => {
    if (variant === 'base') {
      return (
        <div className="flex items-center justify-between px-4 py-2 select-none">
          <div className="flex items-center gap-2">
            <button
              aria-label={isCollapsed ? '展开对比栏' : '折叠对比栏'}
              onClick={toggleCollapsed}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              <i className={isCollapsed ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
            </button>
            <div className="text-sm font-semibold text-gray-900">对比栏（{items.length}/6）</div>
            {!isCollapsed && (
              <div className="hidden items-center text-xs text-gray-500 md:flex">
                <span className="mx-2">|</span>
                <span>已选择 {items.length} 项</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {!isCollapsed && (
              <>
                <button
                  aria-label={isMaximized ? '退出最大化' : '最大化对比栏'}
                  onClick={toggleMaximize}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 px-2 text-gray-600 hover:bg-gray-100"
                >
                  <i className={isMaximized ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}></i>
                  <span className="hidden text-xs sm:inline">{isMaximized ? '退出' : '最大化'}</span>
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-[11px] sm:px-3 sm:text-xs hover:bg-gray-100"
                  onClick={onClear}
                >
                  <i className="ri-eraser-line"></i>
                  <span className="hidden xs:inline">清空</span>
                </button>
                <button
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] sm:px-3 sm:text-xs ${
                    canExport ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'cursor-not-allowed border-gray-200 text-gray-400'
                  }`}
                  disabled={!canExport}
                  title={canExport ? '导出对比' : '至少选择 2 项可导出'}
                >
                  <i className="ri-upload-2-line"></i>
                  <span className="hidden xs:inline">导出对比</span>
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold text-gray-900">对比栏</div>
          <div className="text-xs text-gray-500">已选择 {items.length} 项 · 按 Esc 可退出全屏</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
            onClick={onClear}
          >
            <i className="ri-eraser-line"></i>
            清空
          </button>
          <button
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs ${
              canExport ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'cursor-not-allowed border-gray-200 text-gray-400'
            }`}
            disabled={!canExport}
            title={canExport ? '导出对比' : '至少选择 2 项可导出'}
          >
            <i className="ri-upload-2-line"></i>
            导出对比
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMaximized(false)}
          >
            <i className="ri-fullscreen-exit-line"></i>
            退出全屏
          </button>
        </div>
      </div>
    );
  };

  const overlayPortal = isMaximized && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsMaximized(false);
          }}
        >
          <div className="flex h-[calc(100vh-64px)] w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            {renderHeader('overlay')}
            <div className="flex-1 overflow-hidden bg-gray-50">
              {renderContentBlock('overlay')}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const baseDrawer = isMaximized ? null : (
    <div
      role="region"
      aria-label="对比栏"
      className={`sticky bottom-0 left-0 right-0 z-20 w-full border-t border-gray-200 ${isCollapsed ? 'bg-white/80' : 'bg-white'} flex flex-col transition-all duration-300 ease-out ${
        isHighlighted ? 'shadow-[0_-4px_20px_rgba(37,99,235,0.15)]' : ''
      } ${containerHeightClass} pb-[env(safe-area-inset-bottom)]`}
    >
      {renderHeader('base')}
      <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        {renderContentBlock('base')}
      </div>
    </div>
  );

  return (
    <>
      {baseDrawer}
      {overlayPortal}
    </>
  );
};

export default SimulationCompareDrawer;
