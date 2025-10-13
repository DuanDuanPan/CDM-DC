import PdfViewer from '../../common/PdfViewer';
import ImageViewer from '../../common/ImageViewer';
import OnlineViewer from '../preview/OnlineViewer';
import VtkMeshViewer from './VtkMeshViewer';
import type { SimulationFile, SimulationFileVariantPreview } from './types';

const STEP_VIEWER_FALLBACK = '/models/cfm56-fan-case.glb';
const STEP_EXTENSION_REGEXP = /\.(step|stp)$/i;

const combine = (...tokens: Array<string | false | null | undefined>) => tokens.filter(Boolean).join(' ');

const formatMetric = (value?: number) => {
  if (value === undefined || value === null) return '—';
  const abs = Math.abs(value);
  const trim = (num: number, fractionDigits: number) => {
    return Number(num.toFixed(fractionDigits)).toString();
  };
  if (abs >= 1_000_000) {
    return `${trim(value / 1_000_000, abs % 1_000_000 === 0 ? 0 : 2)}M`;
  }
  if (abs >= 1_000) {
    return `${trim(value / 1_000, abs % 1_000 === 0 ? 0 : 1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
};

const MetricBadge = ({ label, value, icon }: { label: string; value?: number; icon?: string }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
    {icon && <i className={combine(icon, 'text-gray-400')} />}
    <span>{label}</span>
    <span className="text-gray-900 tabular-nums">{formatMetric(value)}</span>
  </span>
);

interface SimulationPreviewContentProps {
  file: SimulationFile;
  variant?: SimulationFileVariantPreview;
  allowMaximize?: boolean;
  height?: number;
  syncKey?: string;
}

const defaultPdfHeight = 420;

const SimulationPreviewContent = ({ file, variant, allowMaximize = false, height, syncKey }: SimulationPreviewContentProps) => {
  const preview = variant ?? file.preview;
  const meshInfo = preview?.meshInfo ?? file.preview?.meshInfo;
  const viewerUrl = meshInfo?.viewerUrl || (STEP_EXTENSION_REGEXP.test(file.name) ? STEP_VIEWER_FALLBACK : undefined);
  const viewerPoster = meshInfo?.previewImage ?? '/models/cfm56-thumb.jpeg';

  switch (file.type) {
    case 'result': {
      if (preview?.curveData) {
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">结果曲线预览</h4>
            <div className="grid grid-cols-1 gap-3">
              {preview.curveData.map((curve, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 text-xs text-gray-500">曲线 {idx + 1}</div>
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

      const imageUrl = preview?.imageUrl ?? file.preview?.imageUrl;
      const imageUrls = preview?.imageUrls ?? file.preview?.imageUrls;
      if (imageUrl) {
        return (
          <ImageViewer
            src={imageUrl}
            alt={`${file.name} 预览`}
            caption={preview?.imageCaption ?? file.preview?.imageCaption}
            allowMaximize={allowMaximize}
            height={height ?? 320}
            comparisonSources={imageUrls}
          />
        );
      }

      return <div className="text-sm text-gray-600">暂无可视化预览，支持下载查看。</div>;
    }

    case 'geometry': {
      if (!meshInfo) {
        return <div className="text-sm text-gray-600">暂无几何预览图。</div>;
      }

      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      const lightweightFormats = new Set(['step', 'stp', 'glb', 'gltf', 'stl', 'obj', 'iges', 'igs', '3mf']);
      const femMeshFormats = new Set(['msh', 'mesh', 'cdb', 'inp', 'nas', 'cgns', 'vtk', 'vtu']);
      const isLightweightModel = Boolean(viewerUrl) || lightweightFormats.has(extension);
      const isFemMesh = femMeshFormats.has(extension) || (!viewerUrl && meshInfo.nodes && meshInfo.elements);

      return (
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <MetricBadge icon="ri-node-tree" label="节点" value={meshInfo.nodes} />
            <MetricBadge icon="ri-group-line" label="单元" value={meshInfo.elements} />
            {meshInfo.format && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                <i className="ri-markup-line text-gray-400" />
                格式 <span className="text-gray-900">{meshInfo.format.toUpperCase()}</span>
              </span>
            )}
          </div>
          {isLightweightModel && viewerUrl && (
            <div className="flex-1 min-h-[260px]">
              <OnlineViewer
                src={viewerUrl}
                poster={viewerPoster}
                height={height ?? 280}
                syncKey={syncKey}
                allowMaximize={allowMaximize}
              />
            </div>
          )}
          {isFemMesh && (
            <section className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-blue-700">
              <div className="flex items-center justify-between font-medium">
                <span>有限元网格预览（Mock 数据）</span>
                <span className="text-[11px]">vtk.js · 全屏支持</span>
              </div>
              <div className="overflow-hidden rounded-md border border-blue-100 bg-white">
                {/* 使用传入的 height 以与其它卡片保持一致高度 */}
                <VtkMeshViewer
                  className="w-full"
                  preset="casing"
                  allowMaximize
                  title="机匣网格预览"
                  height={height ?? 280}
                />
              </div>
              <p className="text-[11px] text-blue-600/80">
                当前示例可替换为真实 FEM 数据，交互能力保持一致。
              </p>
            </section>
          )}
          {!isLightweightModel && !isFemMesh && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-gray-500">
              暂无匹配的几何/网格预览，可下载源文件查看。
            </div>
          )}
        </div>
      );
    }

    case 'report': {
      const pdfUrl = variant?.pdfUrl ?? file.pdfUrl ?? file.preview?.pdfUrl;
      const docxUrl = variant?.docxUrl ?? file.docxUrl ?? file.preview?.docxUrl;
      const previewStatus = variant?.previewStatus ?? file.previewStatus ?? file.preview?.previewStatus;
      const convertedAt = variant?.convertedAt ?? file.convertedAt ?? file.preview?.convertedAt;
      return (
        <PdfViewer
          fileName={file.name}
          sourceUrl={pdfUrl}
          docxUrl={docxUrl}
          previewStatus={previewStatus}
          convertedAt={convertedAt}
          footerSlot={undefined}
          allowMaximize={allowMaximize}
          height={height ?? defaultPdfHeight}
        />
      );
    }

    case 'document': {
      const pdfUrl = variant?.pdfUrl ?? file.pdfUrl ?? file.preview?.pdfUrl;
      const docxUrl = variant?.docxUrl ?? file.docxUrl ?? file.preview?.docxUrl;
      const previewStatus = variant?.previewStatus ?? file.previewStatus ?? file.preview?.previewStatus;
      const convertedAt = variant?.convertedAt ?? file.convertedAt ?? file.preview?.convertedAt;
      const summary = variant?.documentSummary ?? file.preview?.documentSummary;
      return (
        <PdfViewer
          fileName={file.name}
          sourceUrl={pdfUrl}
          docxUrl={docxUrl}
          previewStatus={previewStatus}
          convertedAt={convertedAt}
          footerSlot={summary ? (
            <div className="text-xs leading-relaxed text-gray-600">{summary}</div>
          ) : undefined}
          allowMaximize={allowMaximize}
          height={height ?? defaultPdfHeight}
        />
      );
    }

    case 'dataset': {
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
    }

    default:
      return <div className="text-sm text-gray-600">暂不支持此类型在线预览。</div>;
  }
};

export default SimulationPreviewContent;
