import { useEffect, useState } from 'react';
import { SimulationFile } from './types';

interface Props {
  items: SimulationFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const renderCompareContent = (items: SimulationFile[]) => {
  if (items.length === 0) {
    return <div className="text-sm text-gray-500">请选择文件加入对比。</div>;
  }

  const types = new Set(items.map(item => item.type));

  if (types.size === 1) {
    const [type] = Array.from(types);
    switch (type) {
      case 'result':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">结果文件曲线对比</h4>
            <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-xs text-blue-600">
              曲线叠加对比占位图（可接入图表组件）
            </div>
          </div>
        );
      case 'geometry':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">几何模型叠加对比</h4>
            <div className="h-48 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-xs text-purple-600">
              3D 模型叠加对比占位图（可接入三维组件）
            </div>
          </div>
        );
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
      if (e.key.toLowerCase() === 'c') toggleCollapsed();
      if (e.key.toLowerCase() === 'm') toggleMaximize();
      if (e.key.toLowerCase() === 'e' && items.length >= 2) {
        // 未来可触发导出
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') onClear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

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

  // 高度策略：折叠 44px；展开 320px；最大化 75vh
  const containerHeightClass = isCollapsed
    ? 'h-11'
    : isMaximized
      ? 'h-[75vh]'
      : 'h-[320px]';

  const canExport = items.length >= 2;

  // 空态折叠时渲染一个轻量 pill，减少干扰
  if (isCollapsed && items.length === 0) {
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

  return (
    <div
      role="region"
      aria-label="对比栏"
      className={`sticky bottom-0 left-0 right-0 z-20 w-full border-t border-gray-200 ${isCollapsed ? 'bg-white/80' : 'bg-white'} flex flex-col transition-all duration-300 ease-out ${
        isHighlighted ? 'shadow-[0_-4px_20px_rgba(37,99,235,0.15)]' : ''
      } ${containerHeightClass} pb-[env(safe-area-inset-bottom)]`}
    >
      {/* Header */}
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
            <div className="hidden md:flex items-center text-xs text-gray-500">
              <span className="mx-2">|</span>
              <span>已选择 {items.length} 项</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <>
              <button
                aria-label={isMaximized ? '退出最大化' : '最大化对比栏'}
                onClick={toggleMaximize}
                className="inline-flex h-7 px-2 items-center gap-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <i className={isMaximized ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}></i>
                <span className="hidden sm:inline text-xs">{isMaximized ? '退出' : '最大化'}</span>
              </button>
              <button
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={onClear}
              >
                清空
              </button>
              <button
                className={`text-xs px-3 py-1.5 rounded-md border ${
                  canExport ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!canExport}
                title={canExport ? '导出对比' : '至少选择 2 项可导出'}
              >
                导出对比
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="px-4 pb-3">
          <div className="flex space-x-2 overflow-x-auto">
            {items.map(item => (
              <div key={item.id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center space-x-2">
                <span className="truncate max-w-[140px]">{item.name}</span>
                <button className="text-blue-500 hover:text-blue-700" onClick={() => onRemove(item.id)}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 border-t border-gray-100 bg-gray-50">
          <div className="h-full overflow-auto border border-dashed border-gray-300 rounded-lg m-4 p-4 bg-white">
            {renderCompareContent(items)}
            <div className="mt-2 text-xs text-gray-500">对比栏位于页面底部，可随时展开导出结果。</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationCompareDrawer;
