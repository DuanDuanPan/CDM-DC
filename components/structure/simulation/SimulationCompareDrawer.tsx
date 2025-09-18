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

  useEffect(() => {
    if (items.length === 0) return;
    setIsHighlighted(true);
    const timer = window.setTimeout(() => setIsHighlighted(false), 800);
    return () => window.clearTimeout(timer);
  }, [items.length]);

  return (
    <div
      className={`w-full border-t border-gray-200 bg-white px-6 py-4 flex flex-col space-y-3 transition-shadow ${
        isHighlighted ? 'shadow-[0_-4px_20px_rgba(37,99,235,0.15)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">
          对比栏（{items.length}/6）
        </div>
        <div className="space-x-2">
          <button
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100"
            onClick={onClear}
          >
            清空
          </button>
          <button className="text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
            导出对比
          </button>
        </div>
      </div>
      <div className="flex space-x-2 overflow-x-auto">
        {items.map(item => (
          <div key={item.id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center space-x-2">
            <span className="truncate max-w-[120px]">{item.name}</span>
            <button className="text-blue-500 hover:text-blue-700" onClick={() => onRemove(item.id)}>
              <i className="ri-close-line"></i>
            </button>
          </div>
        ))}
      </div>
      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        {renderCompareContent(items)}
        <div className="mt-2 text-xs text-gray-500">对比栏位于页面底部，可随时展开导出结果。</div>
      </div>
    </div>
  );
};

export default SimulationCompareDrawer;
