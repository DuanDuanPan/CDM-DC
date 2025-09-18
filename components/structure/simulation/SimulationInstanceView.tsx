import { SimulationFile, SimulationFolder, SimulationInstance, SimulationFilters, SimulationFileStatus } from './types';

interface Props {
  instance: SimulationInstance;
  folders: Array<{ folder: SimulationFolder; matchingFiles: SimulationFile[] }>;
  searchKeyword: string;
  filters: SimulationFilters;
  onSelectFolder: (folderId: string) => void;
  onAddCompare: (folderId: string) => void;
}

const highlightStyleMap: Record<'good' | 'warning' | 'risk', string> = {
  good: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700'
};

const riskBadgeMap: Record<'low' | 'medium' | 'high', { label: string; className: string }> = {
  low: { label: '低风险', className: 'bg-green-50 text-green-600 border-green-100' },
  medium: { label: '关注中', className: 'bg-amber-50 text-amber-600 border-amber-100' },
  high: { label: '高风险', className: 'bg-red-50 text-red-600 border-red-100' }
};

const statusLabelMap: Record<SimulationFileStatus, string> = {
  draft: '草稿',
  running: '进行中',
  completed: '已完成',
  failed: '失败',
  archived: '已归档'
};

const SimulationInstanceView = ({ instance, folders, searchKeyword, filters, onSelectFolder, onAddCompare }: Props) => {
  const resources = [
    {
      key: 'cpu',
      label: 'CPU 资源',
      value: `${instance.resources.cpuHours} h`,
      icon: 'ri-cpu-line',
      tone: 'text-blue-600 bg-blue-50'
    },
    {
      key: 'memory',
      label: '内存占用',
      value: `${instance.resources.memoryGB} GB`,
      icon: 'ri-database-2-line',
      tone: 'text-purple-600 bg-purple-50'
    },
    instance.resources.gpuHours !== undefined
      ? {
          key: 'gpu',
          label: 'GPU 资源',
          value: `${instance.resources.gpuHours} h`,
          icon: 'ri-magic-line',
          tone: 'text-green-600 bg-green-50'
        }
      : null,
    instance.resources.costEstimate !== undefined
      ? {
          key: 'cost',
          label: '费用预估',
          value: `¥${instance.resources.costEstimate}k`,
          icon: 'ri-coins-line',
          tone: 'text-amber-600 bg-amber-50'
        }
      : null
  ].filter(Boolean) as Array<{ key: string; label: string; value: string; icon: string; tone: string }>;

  const filteredCountLabel = (() => {
    const totalFolders = instance.folders.length;
    const visibleFolders = folders.length;
    if (filters.statuses.length === 0 && filters.owners.length === 0 && filters.tags.length === 0 && (!filters.timeRange || filters.timeRange === 'all') && !searchKeyword.trim()) {
      return `共 ${totalFolders} 个文件夹`;
    }
    return `已筛选 ${visibleFolders} / ${totalFolders} 个文件夹`;
  })();

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>版本 {instance.version}</span>
              <span>·</span>
              <span>{instance.status === 'approved' ? '已通过' : instance.status === 'in-progress' ? '进行中' : '草稿'}</span>
              {instance.tags && instance.tags.length > 0 && (
                <span className="flex flex-wrap items-center gap-1 text-xs">
                  {instance.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                      {tag}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">{instance.name}</h2>
            <p className="mt-2 text-sm text-gray-600">{instance.summary}</p>
          </div>
          <div className="text-xs text-gray-500 space-y-1 text-right">
            <div>Owner：{instance.owner}</div>
            <div>创建时间：{instance.createdAt}</div>
            <div>更新时间：{instance.updatedAt}</div>
            <div>{filteredCountLabel}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map(resource => (
            <div key={resource.key} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${resource.tone}`}>
                <i className={`${resource.icon} text-lg`}></i>
              </div>
              <div>
                <div className="text-xs text-gray-500">{resource.label}</div>
                <div className="text-sm font-semibold text-gray-900">{resource.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">亮点指标</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {instance.highlights.map(item => (
              <div
                key={`${instance.id}-${item.metric}`}
                className={`rounded-xl border px-4 py-3 text-sm ${highlightStyleMap[item.status]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.metric}</span>
                  <span className="text-gray-900">{item.value}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">趋势</span>
                  <span>{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">工况</h3>
          <div className="space-y-2 mt-2">
            {instance.conditions.map(cond => (
              <div key={cond.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{cond.name}</span>
                  <span>参数 {cond.parameters.length}</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {cond.parameters.map(param => (
                    <div key={param.name} className="bg-gray-50 rounded px-2 py-1">
                      <span className="text-gray-500 mr-1">{param.name}:</span>
                      <span>{param.value}{param.unit ? ` ${param.unit}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">文件夹</h3>
        {folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            暂无匹配的文件夹，请调整筛选条件。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {folders.map(({ folder, matchingFiles }) => {
              const risk = folder.riskLevel ? riskBadgeMap[folder.riskLevel] : null;
              return (
                <div key={folder.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{folder.name}</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {folder.description || '该文件夹包含此实例的关键数据。'}
                      </p>
                    </div>
                    {risk && (
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${risk.className}`}>{risk.label}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      匹配 {matchingFiles.length} / {folder.files.length}
                    </span>
                    {folder.statusSummary && folder.statusSummary.length > 0 && (
                      <span>
                        {folder.statusSummary.map(summary => `${statusLabelMap[summary.status] || summary.status} ${summary.count}`).join(' · ')}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <button
                      className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
                      onClick={() => onSelectFolder(folder.id)}
                    >
                      查看文件
                    </button>
                    <button
                      className="rounded-lg border border-blue-300 px-3 py-1.5 text-blue-600 hover:bg-blue-50"
                      onClick={() => onAddCompare(folder.id)}
                    >
                      加入对比
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationInstanceView;
