import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  SimulationCategory,
  SimulationInstance,
  SimulationInstanceSnapshot,
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
  instanceSnapshot?: SimulationInstanceSnapshot;
  folder?: SimulationFolder;
  page: number;
  pageSize: number;
  searchKeyword: string;
  hasInteracted: boolean;
  categories: SimulationCategory[];
  selectedVersions: Record<string, string>;
  activeVersion?: string;
  versionNotice?: string | null;
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
  onChangeVersion: (instanceId: string, version: string) => void;
  onDismissVersionNotice?: () => void;
  onOpenNavigation?: () => void;
}

const SimulationContentPanel = ({
  category,
  instance,
  instanceSnapshot,
  folder,
  page,
  pageSize,
  searchKeyword,
  hasInteracted,
  categories,
  selectedVersions,
  activeVersion,
  versionNotice,
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
  onChangeVersion,
  onDismissVersionNotice,
  onOpenNavigation
}: Props) => {
  const handleFolderCompare = (folderId: string) => {
    const list = instanceSnapshot?.folders ?? instance?.folders ?? [];
    const targetFolder = list.find(f => f.id === folderId);
    if (!targetFolder) return;
    targetFolder.files.forEach(file =>
      onAddCompareFile({ ...file, compareVersion: file.compareVersion ?? file.belongsToVersion ?? file.version })
    );
  };

  const handleInstanceCompare = (instanceId: string) => {
    const targetCategory = category ?? categories.find(cat => cat.instances.some(inst => inst.id === instanceId));
    if (!targetCategory) return;
    const targetInstance = targetCategory.instances.find(inst => inst.id === instanceId);
    if (!targetInstance) return;
    const versionKey = selectedVersions[instanceId] ?? targetInstance.version;
    const snapshot = targetInstance.versions?.[versionKey] ?? (targetInstance.versions ? Object.values(targetInstance.versions)[0] : undefined);
    const files = snapshot
      ? snapshot.folders.flatMap(f => f.files)
      : targetInstance.folders.flatMap(f => f.files);
    files
      .slice(0, 3)
      .forEach(file => onAddCompareFile({ ...file, compareVersion: file.compareVersion ?? file.belongsToVersion ?? file.version }));
    onAddCompareInstance(instanceId);
    onRegisterCompareInstance(instanceId, targetInstance.name);
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const resolvedSnapshot = useMemo(() => {
    if (instanceSnapshot) return instanceSnapshot;
    if (!instance) return undefined;
    const key = selectedVersions[instance.id] ?? instance.version;
    return instance.versions?.[key] ?? (instance.versions ? Object.values(instance.versions)[0] : undefined);
  }, [instanceSnapshot, instance, selectedVersions]);

  const effectiveVersion = activeVersion ?? resolvedSnapshot?.version ?? instance?.version;
  const effectiveFolders = useMemo(
    () => resolvedSnapshot?.folders ?? instance?.folders ?? [],
    [resolvedSnapshot, instance]
  );
  const effectiveConditions = useMemo(
    () => resolvedSnapshot?.conditions ?? instance?.conditions ?? [],
    [resolvedSnapshot, instance]
  );
  const versionOptions = useMemo(() => {
    if (!instance) return [] as Array<{ version: string; label: string; date?: string; change?: string; owner?: string }>;
    const map = new Map<string, { version: string; label: string; date?: string; change?: string; owner?: string }>();
    (instance.versionHistory ?? []).forEach(item => {
      map.set(item.version, {
        version: item.version,
        label: `${item.version}${item.date ? ` · ${item.date}` : ''}`,
        date: item.date,
        change: item.change,
        owner: item.owner
      });
    });
    Object.keys(instance.versions ?? {}).forEach(versionKey => {
      if (!map.has(versionKey)) {
        map.set(versionKey, { version: versionKey, label: versionKey });
      }
    });
    return Array.from(map.values());
  }, [instance]);

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
    if (resolvedSnapshot) return resolvedSnapshot.folders.flatMap(f => f.files);
    if (instance) {
      const versionKey = selectedVersions[instance.id] ?? instance.version;
      const snapshot = instance.versions?.[versionKey];
      if (snapshot) return snapshot.folders.flatMap(f => f.files);
      return instance.folders.flatMap(f => f.files);
    }
    if (category) {
      return category.instances.flatMap(inst => {
        const versionKey = selectedVersions[inst.id] ?? inst.version;
        const snapshot = inst.versions?.[versionKey];
        const folders = snapshot?.folders ?? inst.folders;
        return folders.flatMap(f => f.files);
      });
    }
    return categories.flatMap(cat =>
      cat.instances.flatMap(inst => {
        const versionKey = selectedVersions[inst.id] ?? inst.version;
        const snapshot = inst.versions?.[versionKey];
        const folders = snapshot?.folders ?? inst.folders;
        return folders.flatMap(f => f.files);
      })
    );
  }, [folder, resolvedSnapshot, instance, category, categories, selectedVersions]);

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

    const foldersSource = resolvedSnapshot?.folders ?? instance.folders;
    if (!foldersSource) return null;

    const includeAll =
      normalizedKeyword.length === 0 &&
      filters.statuses.length === 0 &&
      filters.owners.length === 0 &&
      filters.tags.length === 0 &&
      (!filters.timeRange || filters.timeRange === 'all');

    return foldersSource
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
  }, [instance, resolvedSnapshot, matchesFile, normalizedKeyword, filters.statuses, filters.owners, filters.tags, filters.timeRange]);

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
        const versionKey = selectedVersions[item.id] ?? item.version;
        const snapshot = item.versions?.[versionKey];
        const folders = snapshot?.folders ?? item.folders;
        const allFiles = folders.flatMap(f => f.files);
        const statusHit = filters.statuses.length === 0 || allFiles.some(file => filters.statuses.includes(file.status));
        const ownerHit =
          filters.owners.length === 0 ||
          filters.owners.includes(snapshot?.owner ?? item.owner) ||
          allFiles.some(file => filters.owners.includes(file.createdBy));
        const tagHit =
          filters.tags.length === 0 ||
          ((snapshot?.tags ?? item.tags)?.some(tag => filters.tags.includes(tag)) ?? false) ||
          allFiles.some(file => file.tags?.some(tag => filters.tags.includes(tag)) ?? false);
        const updatedAt = snapshot?.updatedAt ?? item.updatedAt;
        const timeHit =
          !filters.timeRange ||
          filters.timeRange === 'all' ||
          withinTimeRange(updatedAt) ||
          allFiles.some(file => withinTimeRange(file.lastRunAt || file.updatedAt || file.createdAt));

        const keywordHit =
          normalizedKeyword.length === 0 ||
          item.name.toLowerCase().includes(normalizedKeyword) ||
          (snapshot?.summary ?? item.summary).toLowerCase().includes(normalizedKeyword) ||
          ((snapshot?.tags ?? item.tags)?.some(tag => tag.toLowerCase().includes(normalizedKeyword)) ?? false) ||
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
  }, [category, selectedVersions, withinTimeRange, normalizedKeyword, filters.statuses, filters.owners, filters.tags, filters.timeRange]);

  const statusOptions = useMemo(() => {
    const unique = new Set<SimulationFileStatus>(aggregatedFiles.map(file => file.status));
    return Array.from(unique);
  }, [aggregatedFiles]);

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    aggregatedFiles.forEach(file => owners.add(file.createdBy));
    if (instance) owners.add(resolvedSnapshot?.owner ?? instance.owner);
    if (category) {
      category.instances.forEach(inst => {
        const versionKey = selectedVersions[inst.id] ?? inst.version;
        const snapshotOwner = inst.versions?.[versionKey]?.owner;
        owners.add(snapshotOwner ?? inst.owner);
      });
    }
    return Array.from(owners);
  }, [aggregatedFiles, instance, resolvedSnapshot, category, selectedVersions]);

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
      const totalFolders = effectiveFolders.length;
      const visibleFolders = filteredInstanceFolders?.length ?? totalFolders;
      const conditionCount = effectiveConditions.length;
      return `版本 ${effectiveVersion ?? '—'} · 工况 ${conditionCount} · 文件夹 ${visibleFolders}/${Math.max(totalFolders, 0)}`;
    }
    if (category) {
      const visibleInstances = filteredCategoryInstances?.length ?? category.instances.length;
      return `已筛选 ${visibleInstances} / ${category.instances.length} 个仿真实例`;
    }
    return '';
  }, [
    folder,
    instance,
    category,
    folderFilterResult,
    filteredInstanceFolders,
    filteredCategoryInstances,
    effectiveFolders,
    effectiveConditions,
    effectiveVersion
  ]);

  const showControls = hasInteracted && (category || instance || folder);

  const renderHeader = () => (
    <div className="sticky top-0 z-10 border-b border-blue-100/50 bg-white/85 backdrop-blur">
      <div className="flex w-full flex-col gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {onOpenNavigation && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={onOpenNavigation}
              aria-label="展开仿真导航"
            >
              <i className="ri-menu-line text-lg"></i>
            </button>
          )}
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
          {selectionSummary && (
            <span className="sm:ml-auto text-xs text-gray-500">{selectionSummary}</span>
          )}
        </div>
        {showControls && (
          <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    onClick={handleResetFilters}
                  >
                    <i className="ri-restart-line text-sm"></i>
                    重置
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
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
                  <div className="flex items-center gap-1">
                    <span>每页</span>
                    <select
                      value={pageSize}
                      onChange={event => onPageSizeChange(Number(event.target.value))}
                      className="rounded-lg border border-gray-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
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
            </div>
          </div>
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
        activeVersion={effectiveVersion}
      />
    );
  } else if (instance) {
    content = (
      <SimulationInstanceView
        instance={instance}
        snapshot={resolvedSnapshot}
        folders={filteredInstanceFolders ?? effectiveFolders.map(folderItem => ({ folder: folderItem, matchingFiles: folderItem.files }))}
        searchKeyword={searchKeyword}
        filters={filters}
        onSelectFolder={onSelectFolder}
        onAddCompare={handleFolderCompare}
        activeVersion={effectiveVersion}
        versionOptions={versionOptions}
        onChangeVersion={version => onChangeVersion(instance.id, version)}
        versionNotice={versionNotice ?? null}
        onDismissVersionNotice={onDismissVersionNotice}
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
      <div className="flex-1 bg-gray-50">
        <div className="w-full px-6 pb-8 pt-4">
          {content}
        </div>
      </div>
    </div>
  );
};

export default SimulationContentPanel;
