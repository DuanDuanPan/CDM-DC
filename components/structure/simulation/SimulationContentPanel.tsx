import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  SimulationCategory,
  SimulationInstance,
  SimulationFolder,
  SimulationFile,
  SimulationFilters,
  SimulationFileStatus
} from './types';
import SimulationTypeView from './SimulationTypeView';
import SimulationInstanceView from './SimulationInstanceView';
import SimulationFolderView from './SimulationFolderView';

interface Props {
  category?: SimulationCategory;
  instance?: SimulationInstance;
  folder?: SimulationFolder;
  page: number;
  pageSize: number;
  searchKeyword: string;
  hasInteracted: boolean;
  categories: SimulationCategory[];
  filters: SimulationFilters;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (keyword: string) => void;
  onFilterChange: (filters: Partial<SimulationFilters>) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectInstance: (instanceId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onPreviewFile: (file: SimulationFile) => void;
  onAddCompareFile: (file: SimulationFile) => void;
  onAddCompareInstance: (instanceId: string) => void;
  onRegisterCompareInstance: (instanceId: string, instanceName: string) => void;
  onOpenNavigation?: () => void;
}

const SimulationContentPanel = ({
  category,
  instance,
  folder,
  page,
  pageSize,
  searchKeyword,
  hasInteracted,
  categories,
  filters,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onFilterChange,
  onSelectCategory,
  onSelectInstance,
  onSelectFolder,
  onPreviewFile,
  onAddCompareFile,
  onAddCompareInstance,
  onRegisterCompareInstance,
  onOpenNavigation
}: Props) => {
  const handleFolderCompare = (folderId: string) => {
    if (!instance) return;
    const targetFolder = instance.folders.find(f => f.id === folderId);
    if (!targetFolder) return;
    targetFolder.files.forEach(file => onAddCompareFile(file));
  };

  const handleInstanceCompare = (instanceId: string) => {
    if (!category) return;
    const targetInstance = category.instances.find(inst => inst.id === instanceId);
    if (!targetInstance) return;
    targetInstance.folders
      .flatMap(f => f.files)
      .slice(0, 3)
      .forEach(onAddCompareFile);
    onAddCompareInstance(instanceId);
    onRegisterCompareInstance(instanceId, targetInstance.name);
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const withinTimeRange = useCallback(
    (dateString?: string) => {
      if (!dateString) return filters.timeRange === 'all' || !filters.timeRange;
      if (!filters.timeRange || filters.timeRange === 'all') return true;
      const normalized = dateString.replace(' ', 'T');
      const timestamp = new Date(normalized);
      if (Number.isNaN(timestamp.getTime())) return false;
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      switch (filters.timeRange) {
        case '7d':
          return diffDays <= 7;
        case '30d':
          return diffDays <= 30;
        case '90d':
          return diffDays <= 90;
        default:
          return true;
      }
    },
    [filters.timeRange]
  );

  const matchesFile = useCallback(
    (file: SimulationFile) => {
      const keywordHit = !normalizedKeyword
        ? true
        : file.name.toLowerCase().includes(normalizedKeyword) ||
          (file.description?.toLowerCase().includes(normalizedKeyword) ?? false) ||
          (file.tags?.some(tag => tag.toLowerCase().includes(normalizedKeyword)) ?? false) ||
          file.type.toLowerCase().includes(normalizedKeyword);

      const statusHit = filters.statuses.length === 0 || filters.statuses.includes(file.status);
      const ownerHit = filters.owners.length === 0 || filters.owners.includes(file.createdBy);
      const tagHit = filters.tags.length === 0 || (file.tags?.some(tag => filters.tags.includes(tag)) ?? false);
      const timeHit = withinTimeRange(file.lastRunAt || file.updatedAt || file.createdAt);

      return keywordHit && statusHit && ownerHit && tagHit && timeHit;
    },
    [
      normalizedKeyword,
      filters.statuses,
      filters.owners,
      filters.tags,
      withinTimeRange
    ]
  );

  const aggregatedFiles = useMemo(() => {
    if (folder) return folder.files;
    if (instance) return instance.folders.flatMap(f => f.files);
    if (category) return category.instances.flatMap(inst => inst.folders.flatMap(f => f.files));
    return categories.flatMap(cat => cat.instances.flatMap(inst => inst.folders.flatMap(f => f.files)));
  }, [folder, instance, category, categories]);

  const folderFilterResult = useMemo(() => {
    if (!folder) return null;
    const filtered = folder.files.filter(matchesFile);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { filtered, paged, total, totalPages };
  }, [folder, matchesFile, page, pageSize]);

  useEffect(() => {
    if (!folderFilterResult) return;
    if (page > folderFilterResult.totalPages) {
      onPageChange(folderFilterResult.totalPages);
    }
  }, [folderFilterResult, page, onPageChange]);

  const filteredInstanceFolders = useMemo(() => {
    if (!instance) return null;

    const includeAll =
      normalizedKeyword.length === 0 &&
      filters.statuses.length === 0 &&
      filters.owners.length === 0 &&
      filters.tags.length === 0 &&
      (!filters.timeRange || filters.timeRange === 'all');

    return instance.folders
      .map(folderItem => {
        const matchingFiles = folderItem.files.filter(matchesFile);
        const folderMatchesKeyword =
          normalizedKeyword.length > 0 &&
          (folderItem.name.toLowerCase().includes(normalizedKeyword) ||
            (folderItem.description?.toLowerCase().includes(normalizedKeyword) ?? false));

        if (matchingFiles.length === 0 && !folderMatchesKeyword && !includeAll) {
          return null;
        }

        return {
          folder: folderItem,
          matchingFiles: matchingFiles.length > 0 ? matchingFiles : folderItem.files
        };
      })
      .filter(Boolean) as Array<{ folder: SimulationFolder; matchingFiles: SimulationFile[] }>;
  }, [instance, matchesFile, normalizedKeyword, filters.statuses, filters.owners, filters.tags, filters.timeRange]);

  const filteredCategoryInstances = useMemo(() => {
    if (!category) return null;

    const includeAll =
      normalizedKeyword.length === 0 &&
      filters.statuses.length === 0 &&
      filters.owners.length === 0 &&
      filters.tags.length === 0 &&
      (!filters.timeRange || filters.timeRange === 'all');

    return category.instances
      .map(item => {
        const allFiles = item.folders.flatMap(f => f.files);
        const statusHit = filters.statuses.length === 0 || allFiles.some(file => filters.statuses.includes(file.status));
        const ownerHit =
          filters.owners.length === 0 ||
          filters.owners.includes(item.owner) ||
          allFiles.some(file => filters.owners.includes(file.createdBy));
        const tagHit =
          filters.tags.length === 0 ||
          (item.tags?.some(tag => filters.tags.includes(tag)) ?? false) ||
          allFiles.some(file => file.tags?.some(tag => filters.tags.includes(tag)) ?? false);
        const timeHit =
          !filters.timeRange ||
          filters.timeRange === 'all' ||
          withinTimeRange(item.updatedAt) ||
          allFiles.some(file => withinTimeRange(file.lastRunAt || file.updatedAt || file.createdAt));

        const keywordHit =
          normalizedKeyword.length === 0 ||
          item.name.toLowerCase().includes(normalizedKeyword) ||
          item.summary.toLowerCase().includes(normalizedKeyword) ||
          (item.tags?.some(tag => tag.toLowerCase().includes(normalizedKeyword)) ?? false) ||
          allFiles.some(file =>
            file.name.toLowerCase().includes(normalizedKeyword) ||
            (file.description?.toLowerCase().includes(normalizedKeyword) ?? false)
          );

        if (!keywordHit || !statusHit || !ownerHit || !tagHit || !timeHit) {
          return includeAll && keywordHit ? item : null;
        }

        return item;
      })
      .filter(Boolean) as SimulationInstance[];
  }, [category, withinTimeRange, normalizedKeyword, filters.statuses, filters.owners, filters.tags, filters.timeRange]);

  const statusOptions = useMemo(() => {
    const unique = new Set<SimulationFileStatus>(aggregatedFiles.map(file => file.status));
    return Array.from(unique);
  }, [aggregatedFiles]);

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    aggregatedFiles.forEach(file => owners.add(file.createdBy));
    if (instance) owners.add(instance.owner);
    if (category) {
      category.instances.forEach(inst => owners.add(inst.owner));
    }
    return Array.from(owners);
  }, [aggregatedFiles, instance, category]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    aggregatedFiles.forEach(file => (file.tags || []).forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [aggregatedFiles]);

  const statusLabelMap: Record<SimulationFileStatus, string> = {
    draft: '草稿',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
    archived: '已归档'
  };

  const activeFilterCount =
    filters.statuses.length +
    filters.owners.length +
    filters.tags.length +
    (filters.timeRange && filters.timeRange !== 'all' ? 1 : 0);

  const handleStatusFilterChange = (value: string) => {
    onFilterChange({ statuses: value === 'all' ? [] : [value as SimulationFileStatus] });
  };

  const handleOwnerFilterChange = (value: string) => {
    onFilterChange({ owners: value === 'all' ? [] : [value] });
  };

  const handleTagFilterChange = (value: string) => {
    onFilterChange({ tags: value === 'all' ? [] : [value] });
  };

  const handleTimeRangeChange = (value: string) => {
    onFilterChange({ timeRange: value as SimulationFilters['timeRange'] });
  };

  const handleResetFilters = () => {
    onFilterChange({ statuses: [], owners: [], tags: [], timeRange: 'all' });
  };

  const breadcrumbs = useMemo(() => {
    const items: Array<{ label: string; onClick?: () => void }> = [];
    items.push({ label: '仿真类型', onClick: onOpenNavigation });
    if (category) {
      items.push({ label: category.name, onClick: () => onSelectCategory(category.id) });
    }
    if (instance) {
      items.push({ label: instance.name, onClick: () => onSelectInstance(instance.id) });
    }
    if (folder) {
      items.push({ label: folder.name });
    }
    return items;
  }, [category, instance, folder, onOpenNavigation, onSelectCategory, onSelectInstance]);

  const searchPlaceholder = folder
    ? '搜索文件名称/标签'
    : instance
    ? '过滤文件夹或工况'
    : '搜索实例或标签';

  const selectionSummary = useMemo(() => {
    if (folder) {
      if (folderFilterResult) {
        return `匹配 ${folderFilterResult.total} / ${folder.files.length} 个文件`;
      }
      return `文件夹包含 ${folder.files.length} 个文件`;
    }
    if (instance) {
      const totalFolders = instance.folders.length;
      const visibleFolders = filteredInstanceFolders?.length ?? totalFolders;
      return `版本 ${instance.version} · 工况 ${instance.conditions.length} · 文件夹 ${visibleFolders}/${totalFolders}`;
    }
    if (category) {
      const visibleInstances = filteredCategoryInstances?.length ?? category.instances.length;
      return `已筛选 ${visibleInstances} / ${category.instances.length} 个仿真实例`;
    }
    return '';
  }, [folder, instance, category, folderFilterResult, filteredInstanceFolders, filteredCategoryInstances]);

  const showControls = hasInteracted && (category || instance || folder);

  const renderHeader = () => (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenNavigation && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={onOpenNavigation}
              aria-label="展开仿真导航"
            >
              <i className="ri-menu-line text-lg"></i>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <i className="ri-arrow-right-s-line text-gray-300"></i>}
                  {item.onClick && !isLast ? (
                    <button className="hover:text-blue-600" onClick={item.onClick}>
                      {item.label}
                    </button>
                  ) : (
                    <span className={`font-medium ${isLast ? 'text-gray-800' : 'text-gray-600'}`}>{item.label}</span>
                  )}
                </div>
              );
            })}
          </div>
          {showControls && (
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  value={searchKeyword}
                  onChange={event => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-64 rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {folder && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>每页</span>
                  <select
                    value={pageSize}
                    onChange={event => onPageSizeChange(Number(event.target.value))}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                    aria-label="每页条数"
                  >
                    {[10, 20, 50].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>条</span>
                </div>
              )}
            </div>
          )}
        </div>
        {showControls && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <label className="flex items-center gap-2">
              <span className="text-gray-500">状态</span>
              <select
                value={filters.statuses[0] || 'all'}
                onChange={event => handleStatusFilterChange(event.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">全部</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {statusLabelMap[status] || status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-500">Owner</span>
              <select
                value={filters.owners[0] || 'all'}
                onChange={event => handleOwnerFilterChange(event.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">全部</option>
                {ownerOptions.map(owner => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-500">标签</span>
              <select
                value={filters.tags[0] || 'all'}
                onChange={event => handleTagFilterChange(event.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">全部</option>
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-500">时间</span>
              <select
                value={filters.timeRange || 'all'}
                onChange={event => handleTimeRangeChange(event.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">全部</option>
                <option value="7d">近 7 天</option>
                <option value="30d">近 30 天</option>
                <option value="90d">近 90 天</option>
              </select>
            </label>
            {activeFilterCount > 0 && (
              <button
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                onClick={handleResetFilters}
              >
                <i className="ri-restart-line text-sm"></i>
                重置筛选
              </button>
            )}
          </div>
        )}
        {showControls && selectionSummary && (
          <div className="text-xs text-gray-500">{selectionSummary}</div>
        )}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex h-full items-center justify-center px-6 py-12">
      <div className="max-w-xl rounded-2xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <i className="ri-compass-3-line text-xl"></i>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">探索仿真数据</h3>
        <p className="mt-2 text-sm text-gray-600">
          从左侧树选择类型、实例或文件夹，或使用快捷入口直接查看典型示例。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onOpenNavigation && (
            <button
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-600 hover:bg-blue-100"
              onClick={onOpenNavigation}
            >
              浏览导航
            </button>
          )}
          {categories.slice(0, 2).map(item => (
            <button
              key={item.id}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-blue-200 hover:text-blue-600"
              onClick={() => onSelectCategory(item.id)}
            >
              查看{item.name}
            </button>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-left text-sm text-gray-500">
          <li>① 在左侧导航中选择仿真类型，了解实例概览。</li>
          <li>② 进入实例后可浏览资源、风险指标与工况配置。</li>
          <li>③ 打开文件夹即可筛选、预览或加入对比。</li>
        </ul>
      </div>
    </div>
  );

  let content: ReactNode;
  if (!hasInteracted) {
    content = renderEmptyState();
  } else if (folder) {
    content = (
      <SimulationFolderView
        folder={folder}
        files={folderFilterResult?.paged ?? folder.files}
        total={folderFilterResult?.total ?? folder.files.length}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPreview={onPreviewFile}
        onAddCompare={onAddCompareFile}
        filters={filters}
        searchKeyword={searchKeyword}
      />
    );
  } else if (instance) {
    content = (
      <SimulationInstanceView
        instance={instance}
        folders={filteredInstanceFolders ?? instance.folders.map(folderItem => ({ folder: folderItem, matchingFiles: folderItem.files }))}
        searchKeyword={searchKeyword}
        filters={filters}
        onSelectFolder={onSelectFolder}
        onAddCompare={handleFolderCompare}
      />
    );
  } else if (category) {
    content = (
      <SimulationTypeView
        category={category}
        instances={filteredCategoryInstances ?? category.instances}
        totalInstances={category.instances.length}
        searchKeyword={searchKeyword}
        filters={filters}
        onSelectInstance={onSelectInstance}
        onAddCompare={handleInstanceCompare}
      />
    );
  } else {
    content = renderEmptyState();
  }

  return (
    <div className="flex min-h-full flex-col">
      {renderHeader()}
      <div className="flex-1 px-6 pb-8 pt-4">
        {content}
      </div>
    </div>
  );
};

export default SimulationContentPanel;
