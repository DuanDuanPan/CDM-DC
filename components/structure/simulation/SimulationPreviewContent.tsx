import PdfViewer from '../../common/PdfViewer';
import ImageViewer from '../../common/ImageViewer';
import EbomModelViewer from '../ebom/EbomModelViewer';
import VtkMeshViewer from './VtkMeshViewer';
import type { SimulationFile, SimulationFileVariantPreview } from './types';

const STEP_VIEWER_FALLBACK = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const STEP_EXTENSION_REGEXP = /\.(step|stp)$/i;

interface SimulationPreviewContentProps {
  file: SimulationFile;
  variant?: SimulationFileVariantPreview;
  allowMaximize?: boolean;
  height?: number;
}

const defaultPdfHeight = 420;

const SimulationPreviewContent = ({ file, variant, allowMaximize = false, height }: SimulationPreviewContentProps) => {
  const preview = variant ?? file.preview;
  const meshInfo = preview?.meshInfo ?? file.preview?.meshInfo;
  const viewerUrl = meshInfo?.viewerUrl || (STEP_EXTENSION_REGEXP.test(file.name) ? STEP_VIEWER_FALLBACK : undefined);
  const viewerPoster = meshInfo?.previewImage;

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
      if (imageUrl) {
        return (
          <ImageViewer
            src={imageUrl}
            alt={`${file.name} 预览`}
            caption={preview?.imageCaption ?? file.preview?.imageCaption}
            allowMaximize={allowMaximize}
            height={height ?? 320}
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
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">几何/网格信息</h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="rounded-lg bg-gray-50 p-3">节点数量：{meshInfo.nodes}</div>
            <div className="rounded-lg bg-gray-50 p-3">单元数量：{meshInfo.elements}</div>
          </div>
          {isLightweightModel && viewerUrl && (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-2">
              <EbomModelViewer src={viewerUrl} poster={viewerPoster} />
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>格式：{meshInfo.format?.toUpperCase() || extension.toUpperCase() || '3D'}</span>
                <span>支持旋转、缩放、剖切等交互</span>
              </div>
            </div>
          )}
          {isFemMesh && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex items-center justify-between text-xs text-blue-700">
                <span className="font-medium">有限元网格预览（Mock 数据）</span>
                <span>vtk.js 渲染 · 支持全屏</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-lg border border-blue-100 bg-white">
                <VtkMeshViewer className="h-72 w-full" preset="casing" allowMaximize title="机匣网格预览" />
              </div>
              <p className="mt-2 text-[11px] text-blue-700/80">
                当前展示为发动机机匣的示意网格，可替换为真实 FEM 数据并保持同样的交互体验。
              </p>
            </div>
          )}
          {!isLightweightModel && !isFemMesh && (
            <div className="h-40 rounded-lg bg-gradient-to-br from-slate-50 to-slate-200 p-4">
              <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white/70 text-xs text-gray-500">
                暂无匹配的几何/网格预览，可下载源文件查看。
              </div>
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
