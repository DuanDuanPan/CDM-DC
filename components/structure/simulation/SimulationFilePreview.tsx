'use client';

import { useEffect, useMemo, useState } from 'react';
import { SimulationFile, SimulationFileVariantPreview } from './types';
import ConditionBar from './ConditionBar';
import SimulationPreviewContent from './SimulationPreviewContent';

interface Props {
  file: SimulationFile | null;
  onClose: () => void;
  onOpenFolder?: (file: SimulationFile) => void;
  onViewCondition?: (file: SimulationFile) => void;
  onAddCompare?: (file: SimulationFile) => void;
}

const renderPreviewContent = (file: SimulationFile, variant?: SimulationFileVariantPreview) => (
  <SimulationPreviewContent file={file} variant={variant} allowMaximize />
);

const SimulationFilePreview = ({ file, onClose, onOpenFolder, onViewCondition, onAddCompare }: Props) => {
  const [activeConditionId, setActiveConditionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setActiveConditionId(undefined);
      return;
    }
    setActiveConditionId(file.activeConditionId || file.conditions?.[0]?.id);
  }, [file]);

  const activeCondition = useMemo(() => {
    if (!file) return undefined;
    return file.conditions?.find(condition => condition.id === activeConditionId);
  }, [file, activeConditionId]);

  const variantPreview = useMemo<SimulationFileVariantPreview | undefined>(() => {
    if (!file || !activeConditionId) return undefined;
    return file.conditionVariants?.[activeConditionId];
  }, [file, activeConditionId]);

  if (!file) return null;

  const handleOpen = () => {
    if (typeof window !== 'undefined') {
      window.alert(`打开操作开发中：${file.name}`);
    }
  };

  const previewContent = renderPreviewContent(file, variantPreview);

  const handleAddCompare = () => {
    if (!onAddCompare) return;
    const compareKey = activeConditionId ? `${file.id}::${activeConditionId}` : file.id;
    const compareItem: SimulationFile = {
      ...file,
      activeConditionId: activeConditionId,
      activeConditionName: activeCondition?.name,
      compareKey,
      docxUrl: variantPreview?.docxUrl ?? file.docxUrl ?? file.preview?.docxUrl,
      pdfUrl: variantPreview?.pdfUrl ?? file.pdfUrl ?? file.preview?.pdfUrl,
      previewStatus: variantPreview?.previewStatus ?? file.previewStatus ?? file.preview?.previewStatus,
      convertedAt: variantPreview?.convertedAt ?? file.convertedAt ?? file.preview?.convertedAt,
      preview: variantPreview ? { ...variantPreview } : file.preview
    };
    onAddCompare(compareItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{file.name}</h3>
            <p className="text-xs text-gray-500">
              版本 {file.version} · {file.createdBy} · {file.createdAt}
              {file.lastRunAt && ` · 最近运行 ${file.lastRunAt}`}
            </p>
            {file.tags && file.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                {file.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
            <div className="bg-gray-50 rounded-lg p-3">文件类型：{file.type}</div>
            <div className="bg-gray-50 rounded-lg p-3">文件大小：{file.size}</div>
            <div className="bg-gray-50 rounded-lg p-3">状态：{file.status}</div>
            <div className="bg-gray-50 rounded-lg p-3">更新时间：{file.updatedAt}</div>
            <div className="bg-gray-50 rounded-lg p-3">标签：{file.tags?.join('、') || '—'}</div>
            <div className="bg-gray-50 rounded-lg p-3">关联项目：{file.contexts?.project || '—'}</div>
          </div>
          {file.description && (
            <div className="text-sm text-gray-600 leading-relaxed">{file.description}</div>
          )}
          {file.conditions && file.conditions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">关联工况</h4>
                {activeCondition && (
                  <span className="text-xs text-gray-500">当前：{activeCondition.name}</span>
                )}
              </div>
              <ConditionBar
                conditions={file.conditions}
                selectedIds={activeConditionId ? [activeConditionId] : []}
                baselineId={activeConditionId}
                onChange={ids => setActiveConditionId(ids.length ? ids[ids.length - 1] : undefined)}
                onBaselineChange={id => setActiveConditionId(id)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {file.conditions.map(condition => (
                  <div key={condition.id} className={`border rounded-lg p-3 text-xs ${condition.id === activeConditionId ? 'border-blue-300 bg-blue-50/50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                    <div className="font-medium mb-1">{condition.name}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {condition.parameters.map(param => (
                        <div key={param.name} className="bg-white/70 rounded px-2 py-1">
                          <span className="text-gray-500 mr-1">{param.name}:</span>
                          <span>{param.value}{param.unit ? ` ${param.unit}` : ''}</span>
                        </div>
                      ))}
                      {condition.parameters.length === 0 && <div className="text-gray-400">无额外参数</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>{previewContent}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <i className="ri-information-line"></i>
            {file.statusReason || '暂无状态备注'}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {onOpenFolder && (
              <button
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
                onClick={() => onOpenFolder(file)}
              >
                打开所在文件夹
              </button>
            )}
            {file.conditions && file.conditions.length > 0 && onViewCondition && (
              <button
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
                onClick={() => onViewCondition(file)}
              >
                查看工况详情
              </button>
            )}
            {onAddCompare && (
              <button
                className="rounded-lg border border-blue-300 px-3 py-1.5 text-blue-600 hover:bg-blue-50"
                onClick={handleAddCompare}
                >
                加入对比
              </button>
            )}
            <button
              className="rounded-lg border border-blue-300 px-3 py-1.5 text-blue-600/80 hover:bg-blue-50"
              onClick={handleOpen}
            >
              打开
            </button>
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">
              下载文件
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationFilePreview;
