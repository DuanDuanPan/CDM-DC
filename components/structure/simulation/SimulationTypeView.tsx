import { SimulationCategory, SimulationInstance, SimulationFilters } from './types';

interface Props {
  category: SimulationCategory;
  instances: SimulationInstance[];
  totalInstances: number;
  searchKeyword: string;
  filters: SimulationFilters;
  onSelectInstance: (instanceId: string) => void;
  onAddCompare: (instanceId: string) => void;
}

const statusBadgeStyle: Record<SimulationInstance['status'], string> = {
  approved: 'bg-green-50 text-green-600 border-green-100',
  'in-progress': 'bg-blue-50 text-blue-600 border-blue-100',
  draft: 'bg-gray-50 text-gray-600 border-gray-100',
  archived: 'bg-amber-50 text-amber-600 border-amber-100'
};

const SimulationTypeView = ({
  category,
  instances,
  totalInstances,
  searchKeyword,
  filters,
  onSelectInstance,
  onAddCompare
}: Props) => {
  const filterActive =
    filters.statuses.length > 0 ||
    filters.owners.length > 0 ||
    filters.tags.length > 0 ||
    (filters.timeRange && filters.timeRange !== 'all') ||
    searchKeyword.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">{category.name}</span>
            {category.summary && <span>{category.summary}</span>}
          </div>
          <p className="text-sm text-gray-600">{category.description}</p>
        </div>
        <div className="text-xs text-gray-500 text-right">
          <div>
            {filterActive
              ? `已筛选 ${instances.length} / ${totalInstances} 个仿真实例`
              : `共 ${totalInstances} 个仿真实例`}
          </div>
          {category.color && <span className="inline-block h-1 w-10 rounded-full" style={{ backgroundColor: category.color }}></span>}
        </div>
      </div>
      {instances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          暂无匹配的实例，请调整筛选条件。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {instances.map(instance => (
            <div
              key={instance.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className={`rounded-full border px-2 py-0.5 ${statusBadgeStyle[instance.status]}`}>
                      {instance.status === 'approved'
                        ? '已通过'
                        : instance.status === 'in-progress'
                        ? '进行中'
                        : instance.status === 'draft'
                        ? '草稿'
                        : '已归档'}
                    </span>
                    <span>版本 {instance.version}</span>
                    <span>Owner {instance.owner}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">{instance.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{instance.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>更新时间 {instance.updatedAt}</span>
                    <span>工况 {instance.conditions.length}</span>
                    {instance.riskCount !== undefined && instance.riskCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                        <i className="ri-error-warning-line"></i>
                        风险 {instance.riskCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <button
                    className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
                    onClick={() => onSelectInstance(instance.id)}
                  >
                    查看详情
                  </button>
                  <button
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-blue-600 hover:bg-blue-50"
                    onClick={() => onAddCompare(instance.id)}
                  >
                    加入对比
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="text-gray-500">CPU 资源</div>
                  <div className="text-sm font-semibold text-blue-600">{instance.resources.cpuHours} h</div>
                </div>
                <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                  <div className="text-gray-500">内存</div>
                  <div className="text-sm font-semibold text-purple-600">{instance.resources.memoryGB} GB</div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <div className="text-gray-500">文件夹</div>
                  <div className="text-sm font-semibold text-amber-600">{instance.folders.length}</div>
                </div>
              </div>
              {instance.statusSummary && instance.statusSummary.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  {instance.statusSummary.map(item => `${item.label || item.status}: ${item.count}`).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationTypeView;
