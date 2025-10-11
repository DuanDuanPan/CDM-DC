'use client';

import { useEffect, useMemo, useState } from 'react';
import { SimulationFile, SimulationFileVariantPreview } from './types';
import ConditionBar from './ConditionBar';
import EbomModelViewer from '../ebom/EbomModelViewer';
import VtkMeshViewer from './VtkMeshViewer';

const STEP_VIEWER_FALLBACK = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const STEP_EXTENSION_REGEXP = /\.(step|stp)$/i;

interface Props {
  file: SimulationFile | null;
  onClose: () => void;
  onOpenFolder?: (file: SimulationFile) => void;
  onViewCondition?: (file: SimulationFile) => void;
  onAddCompare?: (file: SimulationFile) => void;
}

const renderPreviewContent = (file: SimulationFile, variant?: SimulationFileVariantPreview) => {
  const preview = variant ?? file.preview;
  const meshInfo = preview?.meshInfo ?? file.preview?.meshInfo;
  const viewerUrl = meshInfo?.viewerUrl || (STEP_EXTENSION_REGEXP.test(file.name) ? STEP_VIEWER_FALLBACK : undefined);
  const viewerPoster = meshInfo?.previewImage;
  switch (file.type) {
    case 'result':
      if (preview?.curveData) {
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">结果曲线预览</h4>
            <div className="grid grid-cols-1 gap-3">
              {preview.curveData.map((curve, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">曲线 {idx + 1}</div>
                  <div className="h-32 overflow-hidden rounded-md bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
                    <svg viewBox="0 0 200 80" className="h-full w-full text-blue-500">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points={curve
                          .map((point, index) => `${(index / Math.max(curve.length - 1, 1)) * 200},${80 - point.y * 10}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <div className="text-sm text-gray-600">暂无可视化预览，支持下载查看。</div>;
    case 'geometry':
      if (meshInfo) {
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">几何/网格信息</h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="bg-gray-50 rounded-lg p-3">节点数量：{meshInfo.nodes}</div>
              <div className="bg-gray-50 rounded-lg p-3">单元数量：{meshInfo.elements}</div>
            </div>
            {viewerUrl ? (
              <div className="rounded-xl border border-gray-200 bg-white/80 p-2">
                <EbomModelViewer src={viewerUrl} poster={viewerPoster} />
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span>格式：{meshInfo.format?.toUpperCase() || (STEP_EXTENSION_REGEXP.test(file.name) ? 'STEP' : '几何')}</span>
                  <span>支持旋转、缩放、剖切等交互</span>
                </div>
              </div>
            ) : (
              <div className="h-40 rounded-lg bg-gradient-to-br from-slate-50 to-slate-200 p-4">
                <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white/70 text-xs text-gray-500">
                  暂无 3D 预览连接，可下载查看。
                </div>
              </div>
            )}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex items-center justify-between text-xs text-blue-700">
                <span className="font-medium">机匣有限元网格预览（Mock 数据）</span>
                <span>vtk.js 渲染 · 支持全屏</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-lg border border-blue-100 bg-white">
                <VtkMeshViewer className="h-72 w-full" preset="casing" allowMaximize title="机匣网格预览" />
              </div>
              <p className="mt-2 text-[11px] text-blue-700/80">
                当前展示为发动机机匣的示意网格，可替换为真实 FEM 数据（VTK/VTU/OBJ 等）并保持同样的交互体验。
              </p>
            </div>
          </div>
        );
      }
      return <div className="text-sm text-gray-600">暂无几何预览图。</div>;
    case 'report':
      if (preview?.reportSections) {
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">报告摘要</h4>
            {preview.reportSections.map(section => (
              <div key={section.title} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="text-xs font-semibold text-gray-700">{section.title}</div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">{section.excerpt}</div>
              </div>
            ))}
          </div>
        );
      }
      return <div className="text-sm text-gray-600">报告可下载查看详细内容。</div>;
    case 'document':
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">文档摘要</h4>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-600">
            {preview?.documentSummary || '支持在线阅读，可嵌入文档组件展示详细内容。'}
          </div>
        </div>
      );
    case 'dataset':
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">数据集概览</h4>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="rounded border border-dashed border-gray-200 bg-gray-50 px-2 py-2 text-center">
                  字段 {index + 1}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">可接入数据表格或统计组件查看详细指标。</div>
          </div>
        </div>
      );
    default:
      return <div className="text-sm text-gray-600">暂不支持此类型在线预览。</div>;
  }
};

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

  const previewContent = renderPreviewContent(file, variantPreview);

  const handleAddCompare = () => {
    if (!onAddCompare) return;
    const compareKey = activeConditionId ? `${file.id}::${activeConditionId}` : file.id;
    const compareItem: SimulationFile = {
      ...file,
      activeConditionId: activeConditionId,
      activeConditionName: activeCondition?.name,
      compareKey,
      preview: variantPreview ? { ...variantPreview } : file.preview
    };
    onAddCompare(compareItem);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
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
  const handleOpen = () => {
    if (typeof window !== 'undefined') {
      window.alert(`打开操作开发中：${file.name}`);
    }
  };
