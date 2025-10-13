import {
  SimulationFile,
  SimulationFolder,
  SimulationInstance,
  SimulationInstanceSnapshot,
  SimulationFilters,
  SimulationFileStatus
} from './types';

interface VersionOption {
  version: string;
  label: string;
  date?: string;
  change?: string;
  owner?: string;
}

interface Props {
  instance: SimulationInstance;
  snapshot?: SimulationInstanceSnapshot;
  folders: Array<{ folder: SimulationFolder; matchingFiles: SimulationFile[] }>;
  searchKeyword: string;
  filters: SimulationFilters;
  onSelectFolder: (folderId: string) => void;
  onAddCompare: (folderId: string) => void;
  activeVersion?: string;
  versionOptions: VersionOption[];
  onChangeVersion: (version: string) => void;
  versionNotice?: string | null;
  onDismissVersionNotice?: () => void;
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

const instanceStatusText: Record<SimulationInstance['status'], string> = {
  approved: '已通过',
  'in-progress': '进行中',
  draft: '草稿',
  archived: '已归档'
};

const buildFallbackSnapshot = (instance: SimulationInstance): SimulationInstanceSnapshot => ({
  version: instance.version,
  summary: instance.summary,
  resources: instance.resources,
  conditions: instance.conditions,
  highlights: instance.highlights,
  folders: instance.folders,
  tags: instance.tags,
  riskCount: instance.riskCount,
  statusSummary: instance.statusSummary,
  createdAt: instance.createdAt,
  updatedAt: instance.updatedAt,
  executedAt: instance.executedAt,
  ownerAvatar: instance.ownerAvatar,
  owner: instance.owner,
  reviewers: instance.reviewers
});

const SimulationInstanceView = ({
  instance,
  snapshot,
  folders,
  searchKeyword,
  filters,
  onSelectFolder,
  onAddCompare,
  activeVersion,
  versionOptions,
  onChangeVersion,
  versionNotice,
  onDismissVersionNotice
}: Props) => {
  const snapshotData = snapshot ?? buildFallbackSnapshot(instance);
  const displayVersion = activeVersion ?? snapshotData.version ?? instance.version;
  const owner = snapshotData.owner ?? instance.owner;
  const reviewers = snapshotData.reviewers ?? instance.reviewers;
  const tagList = snapshotData.tags ?? instance.tags ?? [];
  const conditionList = snapshotData.conditions ?? [];
  const highlightList = snapshotData.highlights ?? [];
  const resourcesData = snapshotData.resources ?? instance.resources;
  const totalFolders = snapshotData.folders.length;
  const filteredCountLabel =
    filters.statuses.length === 0 &&
    filters.owners.length === 0 &&
    filters.tags.length === 0 &&
    (!filters.timeRange || filters.timeRange === 'all') &&
    !searchKeyword.trim()
      ? `共 ${totalFolders} 个文件夹`
      : `已筛选 ${folders.length} / ${totalFolders} 个文件夹`;

  const resourceCards = resourcesData
    ? [
        {
          key: 'cpu',
          label: 'CPU 资源',
          value: `${resourcesData.cpuHours} h`,
          icon: 'ri-cpu-line',
          tone: 'text-blue-600 bg-blue-50'
        },
        {
          key: 'memory',
          label: '内存占用',
          value: `${resourcesData.memoryGB} GB`,
          icon: 'ri-database-2-line',
          tone: 'text-purple-600 bg-purple-50'
        },
        resourcesData.gpuHours !== undefined
          ? {
              key: 'gpu',
              label: 'GPU 资源',
              value: `${resourcesData.gpuHours} h`,
              icon: 'ri-magic-line',
              tone: 'text-green-600 bg-green-50'
            }
          : null,
        resourcesData.costEstimate !== undefined
          ? {
              key: 'cost',
              label: '费用预估',
              value: `¥${resourcesData.costEstimate}k`,
              icon: 'ri-coins-line',
              tone: 'text-amber-600 bg-amber-50'
            }
          : null
      ].filter(Boolean) as Array<{ key: string; label: string; value: string; icon: string; tone: string }>
    : [];

  const currentVersionMeta = versionOptions.find(option => option.version === displayVersion);
  const handleSelectVersion = (version: string) => {
    if (version === displayVersion) return;
    onChangeVersion(version);
  };

  const renderVersionSwitcher = () => {
    if (versionOptions.length <= 1) return null;
    if (versionOptions.length <= 3) {
      return (
        <div className="inline-flex items-center gap-2">
          <span className="sr-only">切换版本</span>
          <div
            role="tablist"
            aria-label="切换版本"
            className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
          >
            {versionOptions.map((option) => {
              const selected = option.version === displayVersion;
              return (
                <button
                  key={option.version}
                  id={`ver-tab-${option.version}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => handleSelectVersion(option.version)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
                      e.preventDefault();
                      const currentIndex = versionOptions.findIndex(v => v.version === displayVersion);
                      let nextIndex = currentIndex;
                      if (e.key === 'ArrowRight') nextIndex = Math.min(versionOptions.length - 1, currentIndex + 1);
                      if (e.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
                      if (e.key === 'Home') nextIndex = 0;
                      if (e.key === 'End') nextIndex = versionOptions.length - 1;
                      const nextVer = versionOptions[nextIndex]?.version;
                      if (nextVer && nextVer !== displayVersion) {
                        handleSelectVersion(nextVer);
                        const el = document.getElementById(`ver-tab-${nextVer}`);
                        el?.focus();
                      }
                    }
                  }}
                  className={
                    `rounded-md px-2.5 py-1 text-xs font-medium transition inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ` +
                    (selected
                      ? 'text-blue-700 bg-blue-50 border border-blue-200 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.05)]'
                      : 'text-gray-600 bg-gray-50 border border-transparent hover:bg-white')
                  }
                >
                  {option.version}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <label className="flex items-center gap-2 text-xs text-gray-500">
        <span>选择版本</span>
        <select
          value={displayVersion}
          onChange={event => handleSelectVersion(event.target.value)}
          className="min-w-[9rem] rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
        >
          {versionOptions.map(option => (
            <option key={option.version} value={option.version}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>版本 {displayVersion}</span>
              <span>·</span>
              <span>{instanceStatusText[instance.status]}</span>
              {tagList.length > 0 && (
                <span className="flex flex-wrap items-center gap-1 text-xs">
                  {tagList.map(tag => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                      {tag}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">{instance.name}</h2>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{snapshotData.summary}</p>
          </div>
          {/* 右侧信息区：紧凑两列网格，减少垂直空间 */}
          <div className="flex items-start gap-4 md:text-right">
            <div className="shrink-0 self-start">{renderVersionSwitcher()}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-500">
              {currentVersionMeta?.change && (
                <div className="col-span-2 max-w-xs md:justify-self-end text-[11px] text-gray-400">
                  {currentVersionMeta.change}
                  {currentVersionMeta.date ? ` · ${currentVersionMeta.date}` : ''}
                </div>
              )}
              <div className="whitespace-nowrap"><span className="text-gray-500">Owner：</span><span className="text-gray-900">{owner}</span></div>
              <div className="whitespace-nowrap"><span className="text-gray-500">更新时间：</span><span className="text-gray-900">{snapshotData.updatedAt}</span></div>
              <div className="whitespace-nowrap col-span-2 md:col-span-1"><span className="text-gray-500">创建时间：</span><span className="text-gray-700">{snapshotData.createdAt}</span></div>
              {reviewers?.length ? (
                <div className="truncate col-span-2 md:col-span-1" title={`评审：${reviewers.join('、')}`}>
                  <span className="text-gray-500">评审：</span>
                  <span className="text-gray-700">
                    {reviewers.length > 2 ? `${reviewers.slice(0, 2).join('、')}… +${reviewers.length - 2}` : reviewers.join('、')}
                  </span>
                </div>
              ) : null}
              <div className="col-span-2 md:col-span-1 md:justify-self-end whitespace-nowrap">{filteredCountLabel}</div>
            </div>
          </div>
        </div>
        {versionNotice && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <i className="ri-information-line mt-0.5 text-blue-500"></i>
            <span className="flex-1">{versionNotice}</span>
            {onDismissVersionNotice && (
              <button
                type="button"
                onClick={onDismissVersionNotice}
                className="text-blue-500 transition-colors hover:text-blue-700"
                aria-label="关闭提示"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            )}
          </div>
        )}
        {resourceCards.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {resourceCards.map(resource => (
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
        )}
        {highlightList.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900">亮点指标</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {highlightList.map(item => (
                <div
                  key={`${instance.id}-${item.metric}-${item.status}`}
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
        )}
        {conditionList.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900">工况</h3>
            <div className="mt-2 space-y-2">
              {conditionList.map(cond => (
                <div key={cond.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{cond.name}</span>
                    <span>参数 {cond.parameters.length}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {cond.parameters.map(param => (
                      <div key={`${cond.id}-${param.name}`} className="rounded bg-gray-50 px-2 py-1">
                        <span className="mr-1 text-gray-500">{param.name}:</span>
                        <span>
                          {param.value}
                          {param.unit ? ` ${param.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">文件夹</h3>
        {folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            该版本暂无匹配的文件夹，请调整筛选条件或尝试切换其他版本。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {folders.map(({ folder: folderInfo, matchingFiles }) => {
              const risk = folderInfo.riskLevel ? riskBadgeMap[folderInfo.riskLevel] : null;
              const versionBadge = folderInfo.belongsToVersion ?? displayVersion;
              return (
                <div key={folderInfo.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{folderInfo.name}</h4>
                        {versionBadge && (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
                            {versionBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {folderInfo.description || '该文件夹包含此实例的关键数据。'}
                      </p>
                    </div>
                    {risk && (
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${risk.className}`}>{risk.label}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      匹配 {matchingFiles.length} / {folderInfo.files.length}
                    </span>
                    {folderInfo.statusSummary && folderInfo.statusSummary.length > 0 && (
                      <span>
                        {folderInfo.statusSummary
                          .map(summary => `${statusLabelMap[summary.status] || summary.status} ${summary.count}`)
                          .join(' · ')}
                      </span>
                    )}
                    {matchingFiles.length === 0 && <span className="text-amber-600">该版本暂无可用文件</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <button
                      className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
                      onClick={() => onSelectFolder(folderInfo.id)}
                    >
                      查看文件
                    </button>
                    <button
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-600 hover:bg-blue-100"
                      onClick={() => onAddCompare(folderInfo.id)}
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
