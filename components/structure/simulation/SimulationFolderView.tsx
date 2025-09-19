import { useEffect, useMemo, useState } from 'react';
import { SimulationFile, SimulationFolder, SimulationFilters, SimulationFileStatus, SimulationCondition } from './types';
import ConditionBar from './ConditionBar';

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

const formatDate = (value?: string) => {
  if (!value) return '—';
  const [datePart] = value.split(' ');
  return datePart || value;
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

  const isResultFolder = folder.type === 'result';

  const allConditions = useMemo(() => {
    const map = new Map<string, SimulationCondition>();
    files.forEach(file => (file.conditions || []).forEach(condition => {
      if (!map.has(condition.id)) map.set(condition.id, condition);
    }));
    return Array.from(map.values());
  }, [files]);

  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [baselineConditionId, setBaselineConditionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (allConditions.length === 0) {
      setSelectedConditionIds([]);
      setBaselineConditionId(undefined);
      return;
    }
    setSelectedConditionIds(prev => (prev.length ? prev.filter(id => allConditions.some(condition => condition.id === id)) : allConditions.map(condition => condition.id)));
    setBaselineConditionId(prev => (
      prev && allConditions.some(condition => condition.id === prev)
        ? prev
        : allConditions[0].id
    ));
  }, [allConditions]);

  const conditionFilterEnabled = isResultFolder && allConditions.length > 0;

  const visibleFiles = useMemo(() => {
    if (!conditionFilterEnabled || selectedConditionIds.length === 0) {
      return files;
    }
    return files.filter(file => {
      const ids = (file.conditions || []).map(condition => condition.id);
      if (ids.length === 0) return true;
      return ids.some(id => selectedConditionIds.includes(id));
    });
  }, [conditionFilterEnabled, files, selectedConditionIds]);

  const resolveCompareItem = (file: SimulationFile): SimulationFile => {
    const defaultConditionId = file.activeConditionId || file.conditions?.[0]?.id;
    const conditionId = conditionFilterEnabled
      ? (selectedConditionIds.length === 1 ? selectedConditionIds[0] : defaultConditionId)
      : defaultConditionId;
    const conditionName = file.conditions?.find(condition => condition.id === conditionId)?.name;
    const compareKey = conditionId ? `${file.id}::${conditionId}` : file.id;
    const variant = conditionId ? file.conditionVariants?.[conditionId] : undefined;
    return {
      ...file,
      activeConditionId: conditionId,
      activeConditionName: conditionName,
      compareKey,
      preview: variant ? { ...variant } : file.preview
    };
  };

  const pageStartIndex = visibleFiles.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEndIndex = visibleFiles.length === 0 ? 0 : pageStartIndex + visibleFiles.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{folder.name}</h2>
          <p className="text-sm text-gray-600">
            {folder.description || '查看该文件夹内的仿真数据文件。'}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>
            {visibleFiles.length === 0 ? '无匹配结果' : `当前显示 ${pageStartIndex}-${pageEndIndex} / ${total} 条`}
          </div>
          {filterBadges.length === 0 && !conditionFilterEnabled && <div>无额外筛选条件</div>}
          {conditionFilterEnabled && (
            <div className="text-blue-600">
              工况筛选：{selectedConditionIds.length === 0 ? '全部（含未标注）' : `${selectedConditionIds.length} 项`}
            </div>
          )}
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

      {conditionFilterEnabled && (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-gray-900">工况筛选</div>
            <div className="text-xs text-gray-500">已索引 {allConditions.length} 个工况 · {selectedConditionIds.length === 0 ? '当前显示全部' : `已选 ${selectedConditionIds.length}`}</div>
          </div>
          <ConditionBar
            conditions={allConditions}
            selectedIds={selectedConditionIds}
            baselineId={baselineConditionId}
            onChange={ids => setSelectedConditionIds(ids)}
            onBaselineChange={id => setBaselineConditionId(id)}
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">文件信息</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">大小</th>
              {conditionFilterEnabled && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">关联工况</th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建人</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleFiles.map(file => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-[320px]">{file.name}</div>
                      {file.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[320px]">{file.description}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><i className="ri-stack-line"></i>{file.type.toUpperCase()}</span>
                      <span>版本 {file.version}</span>
                      {file.lastRunAt && <span>最近运行 {file.lastRunAt}</span>}
                      {file.tags && file.tags.length > 0 && (
                        <span className="inline-flex items-center gap-1"><i className="ri-price-tag-3-line"></i>{file.tags.slice(0, 2).join('、')}{file.tags.length > 2 ? ` +${file.tags.length - 2}` : ''}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{file.size}</td>
                {conditionFilterEnabled && (
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="flex flex-wrap items-center gap-1">
                      {(() => {
                        const list = file.conditions || [];
                        if (list.length === 0) return <span className="text-gray-400">—</span>;
                        const visible = list.slice(0, 2);
                        const remaining = list.length - visible.length;
                        return (
                          <>
                            {visible.map(condition => (
                              <span
                                key={`${file.id}-${condition.id}`}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 ${selectedConditionIds.includes(condition.id) ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                              >
                                {condition.name}
                              </span>
                            ))}
                            {remaining > 0 && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">+{remaining}</span>}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColorMap[file.status]}`}></span>
                    <span>{statusLabelMap[file.status] || file.status}</span>
                    {file.statusReason && (
                      <i className="ri-information-line text-gray-400" title={file.statusReason}></i>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{file.createdBy}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(file.createdAt)}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                      onClick={() => onPreview(file)}
                    >
                      <i className="ri-eye-line"></i>
                      预览
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      onClick={() => onAddCompare(resolveCompareItem(file))}
                    >
                      <i className="ri-slideshow-line"></i>
                      加入对比
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                      onClick={() => onPreview(file)}
                    >
                      查看上下文
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleFiles.length === 0 && (
              <tr>
                <td colSpan={conditionFilterEnabled ? 9 : 8} className="px-4 py-8 text-center text-gray-500 text-sm">
                  暂无匹配文件，请调整工况或筛选条件。
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
