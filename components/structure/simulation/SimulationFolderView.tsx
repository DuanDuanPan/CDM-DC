import { SimulationFile, SimulationFolder, SimulationFilters, SimulationFileStatus } from './types';

interface Props {
  folder: SimulationFolder;
  files: SimulationFile[];
  total: number;
  page: number;
  pageSize: number;
  searchKeyword: string;
  filters: SimulationFilters;
  onPageChange: (page: number) => void;
  onPreview: (file: SimulationFile) => void;
  onAddCompare: (file: SimulationFile) => void;
}

const statusColorMap: Record<SimulationFileStatus, string> = {
  draft: 'bg-gray-400',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  archived: 'bg-amber-500'
};

const statusLabelMap: Record<SimulationFileStatus, string> = {
  draft: '草稿',
  running: '进行中',
  completed: '已完成',
  failed: '失败',
  archived: '已归档'
};

const SimulationFolderView = ({
  folder,
  files,
  total,
  page,
  pageSize,
  searchKeyword,
  filters,
  onPageChange,
  onPreview,
  onAddCompare
}: Props) => {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(page * pageSize, total);

  const filterBadges: Array<{ label: string; tone: 'blue' | 'gray' | 'orange' | 'purple' }> = [];
  if (searchKeyword.trim()) {
    filterBadges.push({ label: `搜索：${searchKeyword.trim()}`, tone: 'blue' });
  }
  if (filters.statuses.length > 0) {
    filterBadges.push({ label: `状态：${filters.statuses.map(status => statusLabelMap[status] || status).join('、')}`, tone: 'gray' });
  }
  if (filters.owners.length > 0) {
    filterBadges.push({ label: `Owner：${filters.owners.join('、')}`, tone: 'orange' });
  }
  if (filters.tags.length > 0) {
    filterBadges.push({ label: `标签：${filters.tags.join('、')}`, tone: 'purple' });
  }
  if (filters.timeRange && filters.timeRange !== 'all') {
    const timeLabel = filters.timeRange === '7d' ? '近 7 天' : filters.timeRange === '30d' ? '近 30 天' : '近 90 天';
    filterBadges.push({ label: `时间：${timeLabel}`, tone: 'gray' });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{folder.name}</h2>
          <p className="text-sm text-gray-600">
            {folder.description || '查看该文件夹内的仿真数据文件。'}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>
            {total === 0 ? '无匹配结果' : `当前显示 ${startIndex}-${endIndex} / ${total} 条`}
          </div>
          {filterBadges.length === 0 && <div>无额外筛选条件</div>}
        </div>
      </div>
      {filterBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {filterBadges.map((badge, index) => (
            <span
              key={`${badge.label}-${index}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                badge.tone === 'blue'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : badge.tone === 'orange'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : badge.tone === 'purple'
                  ? 'border-purple-200 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <i className="ri-filter-2-line"></i>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">文件名称</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">类型</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">版本</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">大小</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建人</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {files.map(file => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{file.name}</div>
                  {file.description && (
                    <div className="text-xs text-gray-500 truncate max-w-xs">{file.description}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-600 text-xs uppercase">{file.type}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{file.version}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{file.size}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColorMap[file.status]}`}></span>
                    <span>{statusLabelMap[file.status] || file.status}</span>
                    {file.statusReason && (
                      <i className="ri-information-line text-gray-400" title={file.statusReason}></i>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600 text-xs">{file.createdBy}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{file.createdAt}</td>
                <td className="px-4 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
                      onClick={() => onPreview(file)}
                    >
                      预览
                    </button>
                    <button
                      className="rounded border border-blue-300 px-2 py-1 text-blue-600 hover:bg-blue-50"
                      onClick={() => onAddCompare(file)}
                    >
                      加入对比
                    </button>
                    <button
                      className="rounded border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-100"
                      onClick={() => onPreview(file)}
                    >
                      查看上下文
                    </button>
                    <button
                      className="rounded border border-gray-200 px-2 py-1 text-gray-400"
                      title="关联需求功能筹备中"
                      disabled
                    >
                      关联需求
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                  暂无匹配文件，请调整筛选条件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          共 {total} 个文件 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center space-x-1">
          <button
            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <button
            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationFolderView;
