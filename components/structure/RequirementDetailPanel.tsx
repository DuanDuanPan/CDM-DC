import { useMemo, useState } from 'react';
import { RequirementRoleKey, RequirementRoleInsight, RequirementItem } from './types';

interface RoleDefinition {
  id: RequirementRoleKey;
  name: string;
  icon: string;
  description: string;
}

interface NodeSummary {
  id: string;
  name: string;
}

interface RequirementDetailPanelProps {
  selectedNode: string | null;
  selectedBomType: string;
  selectedRequirementRole: RequirementRoleKey;
  onRequirementRoleChange: (role: RequirementRoleKey) => void;
  requirementRoles: RoleDefinition[];
  requirementRoleInsights: Record<RequirementRoleKey, RequirementRoleInsight>;
  requirementsByNode: Record<string, RequirementItem[]>;
  currentNode: NodeSummary | null;
  // 可选：外部控制筛选（用于右侧次级工具条联动）
  filters?: {
    keyword: string;
    status: 'all' | RequirementItem['status'];
    priority: 'all' | RequirementItem['priority'];
    type: 'all' | RequirementItem['type'];
    showOnlyLinked: boolean;
  };
  onFiltersChange?: (f: {
    keyword: string;
    status: 'all' | RequirementItem['status'];
    priority: 'all' | RequirementItem['priority'];
    type: 'all' | RequirementItem['type'];
    showOnlyLinked: boolean;
  }) => void;
}

const getTypeLabel = (type: RequirementItem['type']) => {
  switch (type) {
    case 'performance':
      return '性能需求';
    case 'functional':
      return '功能需求';
    case 'interface':
      return '接口需求';
    case 'quality':
      return '六性需求';
    default:
      return '其他需求';
  }
};

const getTypeColor = (type: RequirementItem['type']) => {
  switch (type) {
    case 'performance':
      return 'bg-blue-100 text-blue-700';
    case 'functional':
      return 'bg-green-100 text-green-700';
    case 'interface':
      return 'bg-purple-100 text-purple-700';
    case 'quality':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityColor = (priority: RequirementItem['priority']) => {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusColor = (status: RequirementItem['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in-progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'pending':
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getMetricStatusClass = (
  status: RequirementRoleInsight['metrics'][number]['status']
) => {
  switch (status) {
    case 'excellent':
      return {
        badge: 'bg-green-100 text-green-700 border border-green-200',
        value: 'text-green-600',
        label: '优秀'
      };
    case 'good':
      return {
        badge: 'bg-blue-100 text-blue-700 border border-blue-200',
        value: 'text-blue-600',
        label: '良好'
      };
    case 'warning':
      return {
        badge: 'bg-orange-100 text-orange-700 border border-orange-200',
        value: 'text-orange-600',
        label: '预警'
      };
    case 'danger':
    default:
      return {
        badge: 'bg-red-100 text-red-700 border border-red-200',
        value: 'text-red-600',
        label: '风险'
      };
  }
};

const getParameterStatusBadge = (
  status: RequirementRoleInsight['structuredParameters'][number]['status']
) => {
  switch (status) {
    case 'met':
      return 'bg-green-50 text-green-700 border border-green-100';
    case 'risk':
      return 'bg-red-50 text-red-700 border border-red-100';
    case 'watch':
    default:
      return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
  }
};

const getActionStatusLabel = (
  status: RequirementRoleInsight['actions'][number]['status']
) => {
  switch (status) {
    case 'open':
      return {
        text: '待处理',
        classes: 'bg-red-100 text-red-700 border border-red-200'
      };
    case 'in-progress':
      return {
        text: '进行中',
        classes: 'bg-blue-100 text-blue-700 border border-blue-200'
      };
    case 'done':
      return {
        text: '已完成',
        classes: 'bg-green-100 text-green-700 border border-green-200'
      };
    default:
      return {
        text: '未知',
        classes: 'bg-gray-100 text-gray-700 border border-gray-200'
      };
  }
};

const STATUS_FILTERS: Array<{ value: RequirementItem['status'] | 'all'; label: string; tone: string }> = [
  { value: 'all', label: '全部', tone: 'border-gray-200 text-gray-600' },
  {
    value: 'in-progress',
    label: '进行中',
    tone: 'border-blue-200 text-blue-600 bg-blue-50/60'
  },
  {
    value: 'pending',
    label: '待启动',
    tone: 'border-orange-200 text-orange-600 bg-orange-50/60'
  },
  {
    value: 'completed',
    label: '已完成',
    tone: 'border-emerald-200 text-emerald-600 bg-emerald-50/60'
  }
];

const PRIORITY_FILTERS: Array<{ value: RequirementItem['priority'] | 'all'; label: string }> = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高优' },
  { value: 'medium', label: '中优' },
  { value: 'low', label: '低优' }
];

const TYPE_FILTERS: Array<{ value: RequirementItem['type'] | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'performance', label: '性能' },
  { value: 'functional', label: '功能' },
  { value: 'interface', label: '接口' },
  { value: 'quality', label: '六性' }
];

const STATUS_GROUP_DEFINITIONS: Array<{
  key: RequirementItem['status'];
  label: string;
  description: string;
  accent: string;
  icon: string;
}> = [
  {
    key: 'in-progress',
    label: '进行中',
    description: '正在闭环的需求，请关注风险与依赖',
    accent: 'text-blue-600',
    icon: 'ri-loader-4-line'
  },
  {
    key: 'pending',
    label: '待启动',
    description: '尚未推进的需求，建议尽快排期',
    accent: 'text-orange-600',
    icon: 'ri-time-line'
  },
  {
    key: 'completed',
    label: '已完成',
    description: '已闭环的需求，可查看验证证据',
    accent: 'text-emerald-600',
    icon: 'ri-checkbox-circle-line'
  }
];

type TimelineStatus = 'done' | 'doing' | 'pending';

interface RequirementTimelineItem {
  title: string;
  date: string;
  actor: string;
  status: TimelineStatus;
  note?: string;
}

const requirementTimelineMap: Record<string, RequirementTimelineItem[]> = {
  'REQ-ENG-001-OVERVIEW': [
    {
      title: '需求提出',
      date: '2023-12-18',
      actor: '系统组',
      status: 'done',
      note: '初版需求定义'
    },
    {
      title: '仿真验证',
      date: '2024-01-05',
      actor: '仿真团队',
      status: 'done',
      note: 'V2.1 仿真完成'
    },
    {
      title: '评审会',
      date: '2024-01-16',
      actor: '系统评审会',
      status: 'doing',
      note: '待补充燃油接口证据'
    },
    {
      title: '质量签署',
      date: '2024-01-28',
      actor: '质量部',
      status: 'pending',
      note: '计划提交评审包'
    }
  ],
  'REQ-ENG-001-INTEGRITY': [
    {
      title: '接口清单编制',
      date: '2023-12-20',
      actor: '系统组',
      status: 'done'
    },
    {
      title: '供应商确认',
      date: '2024-01-12',
      actor: '供应商团队',
      status: 'doing',
      note: '燃油接口待确认'
    },
    {
      title: '基线签署',
      date: '2024-01-30',
      actor: '配置管理',
      status: 'pending'
    }
  ],
  'REQ-PROP-001-PERF': [
    {
      title: '方案分解',
      date: '2023-12-15',
      actor: '推进系统',
      status: 'done'
    },
    {
      title: '仿真验证',
      date: '2024-01-10',
      actor: '仿真团队',
      status: 'doing',
      note: '剩余2个工况'
    },
    {
      title: '试验验证',
      date: '2024-02-05',
      actor: '试验中心',
      status: 'pending'
    }
  ]
};

const defaultTimeline: RequirementTimelineItem[] = [
  { title: '需求提出', date: '2023-12-01', actor: '系统组', status: 'done' },
  { title: '方案确认', date: '2023-12-20', actor: '方案团队', status: 'doing' },
  { title: '验证闭环', date: '2024-01-31', actor: '评审会', status: 'pending' }
];

const requirementMetaMap: Record<string, { owner: string; due: string; stage: string; lastUpdate: string }> = {
  'REQ-ENG-001-OVERVIEW': {
    owner: '系统组-李工',
    due: '2024-02-05',
    stage: '基线评审准备',
    lastUpdate: '2024-01-18'
  },
  'REQ-ENG-001-INTEGRITY': {
    owner: '配置管理-赵工',
    due: '2024-01-30',
    stage: '接口确认',
    lastUpdate: '2024-01-15'
  },
  'REQ-PROP-001-PERF': {
    owner: '推进系统-钱工',
    due: '2024-02-10',
    stage: '仿真补全',
    lastUpdate: '2024-01-17'
  },
  'REQ-PROP-001-ENV': {
    owner: '推进系统-钱工',
    due: '2024-02-20',
    stage: '环境验证计划',
    lastUpdate: '2024-01-12'
  },
  'REQ-BLADE-001-GEOM': {
    owner: '部件负责人-孙工',
    due: '2024-02-12',
    stage: '制造规范确认',
    lastUpdate: '2024-01-16'
  },
  'REQ-ROTOR-001-DYN': {
    owner: '转子团队-周工',
    due: '2024-02-08',
    stage: '动平衡试验',
    lastUpdate: '2024-01-20'
  }
};

const attachmentIconMap: Record<string, string> = {
  document: 'ri-file-text-line',
  table: 'ri-table-line',
  image: 'ri-image-line',
  model: 'ri-cube-line',
  dataset: 'ri-database-2-line',
  report: 'ri-file-list-3-line'
};

const timelineStatusColor: Record<TimelineStatus, string> = {
  done: 'bg-emerald-500',
  doing: 'bg-blue-500',
  pending: 'bg-gray-300'
};

const RequirementDetailPanel = ({
  selectedNode,
  selectedBomType,
  selectedRequirementRole,
  onRequirementRoleChange,
  requirementRoles,
  requirementRoleInsights,
  requirementsByNode,
  currentNode,
  filters,
  onFiltersChange
}: RequirementDetailPanelProps) => {
  const requirements = useMemo<RequirementItem[]>(() => {
    if (!selectedNode) return [];
    return requirementsByNode[selectedNode] || [];
  }, [selectedNode, requirementsByNode]);
  const currentInsight = requirementRoleInsights[selectedRequirementRole];

  // 受控/非受控筛选（若父级传入 filters 则受控，否则内部管理）
  const [localSearchKeyword, setLocalSearchKeyword] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | RequirementItem['status']>('all');
  const [localPriorityFilter, setLocalPriorityFilter] = useState<'all' | RequirementItem['priority']>('all');
  const [localTypeFilter, setLocalTypeFilter] = useState<'all' | RequirementItem['type']>('all');
  const [localShowOnlyLinked, setLocalShowOnlyLinked] = useState(false);

  const controlled = !!filters;
  const searchKeyword = controlled ? (filters!.keyword ?? '') : localSearchKeyword;
  const statusFilter: 'all' | RequirementItem['status'] = controlled ? (filters!.status ?? 'all') : localStatusFilter;
  const priorityFilter: 'all' | RequirementItem['priority'] = controlled ? (filters!.priority ?? 'all') : localPriorityFilter;
  const typeFilter: 'all' | RequirementItem['type'] = controlled ? (filters!.type ?? 'all') : localTypeFilter;
  const showOnlyLinked = controlled ? (filters!.showOnlyLinked ?? false) : localShowOnlyLinked;

  const emitChange = (patch: Partial<NonNullable<RequirementDetailPanelProps['filters']>>) => {
    if (onFiltersChange) {
      onFiltersChange({
        keyword: searchKeyword,
        status: statusFilter,
        priority: priorityFilter,
        type: typeFilter,
        showOnlyLinked,
        ...patch,
      });
    }
  };

  const setStatusFilter = (v: 'all' | RequirementItem['status']) => controlled ? emitChange({ status: v }) : setLocalStatusFilter(v);
  const setPriorityFilter = (v: 'all' | RequirementItem['priority']) => controlled ? emitChange({ priority: v }) : setLocalPriorityFilter(v);
  const setTypeFilter = (v: 'all' | RequirementItem['type']) => controlled ? emitChange({ type: v }) : setLocalTypeFilter(v);
  const setSearchKeyword = (v: string) => controlled ? emitChange({ keyword: v }) : setLocalSearchKeyword(v);
  const setShowOnlyLinked = (v: boolean) => controlled ? emitChange({ showOnlyLinked: v }) : setLocalShowOnlyLinked(v);
  

  const linkedRequirementIds = useMemo(
    () => new Set(currentInsight?.linkedRequirements ?? []),
    [currentInsight]
  );

  const statusStats = useMemo(
    () => ({
      total: requirements.length,
      completed: requirements.filter(req => req.status === 'completed').length,
      inProgress: requirements.filter(req => req.status === 'in-progress').length,
      pending: requirements.filter(req => req.status === 'pending').length,
      highPriority: requirements.filter(req => req.priority === 'high').length
    }),
    [requirements]
  );

  const filteredRequirements = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return requirements.filter(req => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;
      if (showOnlyLinked && !linkedRequirementIds.has(req.id)) return false;
      if (!keyword) return true;
      return (
        req.name.toLowerCase().includes(keyword) ||
        req.id.toLowerCase().includes(keyword) ||
        req.content.toLowerCase().includes(keyword) ||
        req.parameters.some(param => param.name.toLowerCase().includes(keyword))
      );
    });
  }, [
    requirements,
    statusFilter,
    priorityFilter,
    typeFilter,
    searchKeyword,
    showOnlyLinked,
    linkedRequirementIds
  ]);

  const groupedRequirements = useMemo(
    () =>
      STATUS_GROUP_DEFINITIONS.map(group => ({
        ...group,
        items: filteredRequirements.filter(req => req.status === group.key)
      })).filter(group => group.items.length > 0),
    [filteredRequirements]
  );

  const typeDistribution = useMemo(() => {
    const map: Record<RequirementItem['type'], number> = {
      performance: 0,
      functional: 0,
      interface: 0,
      quality: 0
    };
    requirements.forEach(req => {
      map[req.type] += 1;
    });
    return map;
  }, [requirements]);

  const trendIcon = (trend: string) =>
    trend.startsWith('+') ? '↗' : trend.startsWith('-') ? '↘' : '→';
  const trendColor = (trend: string) =>
    trend.startsWith('+')
      ? 'text-green-600'
      : trend.startsWith('-')
      ? 'text-red-500'
      : 'text-gray-500';

  const breadcrumbs = useMemo(() => {
    const items: Array<{ label: string; icon?: string; subLabel?: string }> = [
      { label: '产品结构', icon: 'ri-organization-chart' },
      {
        label: selectedBomType === 'requirement' ? '需求BOM视图' : '方案BOM视图',
        icon: 'ri-compass-3-line'
      }
    ];
    if (currentNode) {
      items.push({ label: currentNode.name, subLabel: currentNode.id, icon: 'ri-focus-2-line' });
    }
    return items;
  }, [selectedBomType, currentNode]);

  const handleResetFilters = () => {
    if (filters && onFiltersChange) {
      onFiltersChange({ keyword: '', status: 'all', priority: 'all', type: 'all', showOnlyLinked: false });
    } else {
      setStatusFilter('all');
      setPriorityFilter('all');
      setTypeFilter('all');
      setSearchKeyword('');
      setShowOnlyLinked(false);
    }
  };

  const showEmptyState = filteredRequirements.length === 0;

  if (!selectedNode) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/60 p-10 text-center text-gray-500">
        <i className="ri-file-list-2-line text-4xl"></i>
        <p className="mt-4 text-sm">
          请选择{selectedBomType === 'requirement' ? '需求BOM' : 'BOM'}节点查看关联需求条目
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {breadcrumbs.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <i className="ri-arrow-right-s-line text-gray-300"></i>}
                  <span className="flex items-center gap-1">
                    {item.icon && <i className={`${item.icon} text-gray-400`}></i>}
                    <span className="font-medium text-gray-600">{item.label}</span>
                    {item.subLabel && <span className="text-gray-400">({item.subLabel})</span>}
                  </span>
                </div>
              ))}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {currentNode?.name || '需求总览'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {currentNode ? `节点ID：${currentNode.id}` : '选择节点以查看详细需求信息'}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
            <div className="text-xs font-medium text-gray-500">需求总数</div>
            <div className="mt-2 flex items-baseline gap-2 text-3xl font-semibold text-gray-900">
              {statusStats.total}
              <span className="text-xs font-medium text-gray-400">条</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <i className="ri-focus-3-line"></i>
              高优 {statusStats.highPriority} 条
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="text-xs font-medium text-blue-600">进行中</div>
            <div className="mt-2 text-3xl font-semibold text-blue-700">{statusStats.inProgress}</div>
            <div className="mt-3 text-xs text-blue-600">聚焦风险节点，确保验证证据同步</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="text-xs font-medium text-amber-600">待启动</div>
            <div className="mt-2 text-3xl font-semibold text-amber-600">{statusStats.pending}</div>
            <div className="mt-3 text-xs text-amber-600">建议排期并补齐基础信息</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
            <div className="text-xs font-medium text-gray-500">类型覆盖</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <span key={type} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5">
                  <i className="ri-price-tag-3-line text-gray-400"></i>
                  {getTypeLabel(type as RequirementItem['type'])} {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {currentInsight && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <i className="ri-user-star-line text-blue-500"></i>
                <span>{currentInsight.title}</span>
              </h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">
                {currentInsight.overview}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:border-blue-300 hover:text-blue-600">
                <i className="ri-download-line mr-1"></i>
                导出视图
              </button>
              <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
                <i className="ri-notification-line mr-1"></i>
                订阅提醒
              </button>
            </div>
          </div>

          <div className="relative border-b border-gray-100 px-5 py-3">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/70 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/70 to-transparent" />
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pr-6">
              {requirementRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => onRequirementRoleChange(role.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    selectedRequirementRole === role.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-slate-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                  title={role.description}
                >
                  <i className={`${role.icon} text-base`}></i>
                  <span>{role.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-gray-100 px-5 py-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>关注焦点</span>
                  <span className="text-xs font-normal text-gray-400">聚焦可立即推动的事项</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentInsight.focusAreas.map((focus, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-white/90 p-3 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <i className={`${focus.icon} text-blue-500`}></i>
                        <span>{focus.label}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">{focus.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>关键指标</span>
                  <span className="text-xs font-normal text-gray-400">数据来源可点击查看说明</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentInsight.metrics.map((metric, index) => {
                    const statusClass = getMetricStatusClass(metric.status);
                    return (
                      <div key={index} className="rounded-xl border border-gray-100 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{metric.label}</div>
                            {metric.source && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <i className="ri-database-2-line"></i>
                                <span>{metric.source}</span>
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusClass.badge}`}>
                            {statusClass.label}
                          </span>
                        </div>
                        <div className={`mt-3 text-2xl font-semibold ${statusClass.value}`}>
                          {metric.value}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span className="max-w-[70%] truncate" title={metric.note}>{metric.note}</span>
                          <span className={`flex items-center gap-1 ${trendColor(metric.trend)}`}>
                            {trendIcon(metric.trend)} {metric.trend}
                          </span>
                        </div>
                        {metric.updatedAt && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                            <i className="ri-time-line"></i>
                            <span>更新 {metric.updatedAt}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 px-5 py-5">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <i className="ri-slideshow-2-line text-blue-500"></i>
              <span>结构化参数对比</span>
            </h4>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full rounded-lg border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">参数</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">需求规定</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">当前表现</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">差异</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentInsight.structuredParameters.map((param, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{param.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{param.requirement}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{param.current}</td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-700 whitespace-nowrap">{param.gap}</td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getParameterStatusBadge(param.status)}`}>
                          {param.status === 'met' ? '已满足' : param.status === 'risk' ? '存在风险' : '关注中'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{param.source || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{param.updatedAt || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{param.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-5 py-5">
            <h4 className="mb-3 text-sm font-medium text-gray-900">重点行动项</h4>
            <div className="space-y-3">
              {currentInsight.actions.map((action, index) => {
                const actionStatus = getActionStatusLabel(action.status);
                return (
                  <div key={index} className="rounded-xl border border-gray-100 bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{action.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span><i className="ri-user-3-line mr-1"></i>{action.owner}</span>
                          <span><i className="ri-calendar-line mr-1"></i>截止 {action.due}</span>
                          {action.remark && <span className="text-gray-400">{action.remark}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${actionStatus.classes}`}>{actionStatus.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  statusFilter === filter.value
                    ? `${filter.tone} shadow-sm`
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {filter.value !== 'all' && <i className="ri-checkbox-circle-line"></i>}
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                value={searchKeyword}
                onChange={event => setSearchKeyword(event.target.value)}
                placeholder="搜索需求名称、ID、关键字"
                className="w-64 rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={event =>
                setPriorityFilter(event.target.value as RequirementItem['priority'] | 'all')
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {PRIORITY_FILTERS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value as RequirementItem['type'] | 'all')}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {TYPE_FILTERS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOnlyLinked}
                onChange={event => setShowOnlyLinked(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              仅显示关注项
            </label>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600"
            >
              <i className="ri-refresh-line"></i>
              重置
            </button>
          </div>
        </div>
      </section>

      {showEmptyState ? (
        <section className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/60 p-12 text-center text-gray-500">
          <i className="ri-file-list-2-line text-4xl"></i>
          <p className="mt-4 text-sm">未找到匹配的需求条目，尝试调整筛选条件或添加新需求。</p>
          <div className="mt-5 flex justify-center gap-3">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white">
              导入需求
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              新建需求
            </button>
          </div>
        </section>
      ) : (
        groupedRequirements.map(group => (
          <section key={group.key} className="space-y-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <div className={`flex items-center gap-2 text-base font-semibold ${group.accent}`}>
                  <i className={`${group.icon}`}></i>
                  <span>
                    {group.label}
                    <span className="ml-2 text-sm text-gray-400">{group.items.length} 条</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500">{group.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {group.items.map(req => {
                const meta =
                  requirementMetaMap[req.id] ?? {
                    owner: '未分配',
                    due: '待排期',
                    stage: '未设置阶段',
                    lastUpdate: '—'
                  };
                const timeline = requirementTimelineMap[req.id] ?? defaultTimeline;
                const isLinked = linkedRequirementIds.has(req.id);

                return (
                  <article key={req.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(req.type)}`}>
                          {getTypeLabel(req.type)}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(req.priority)}`}>
                          {req.priority === 'high'
                            ? '高优先级'
                            : req.priority === 'medium'
                            ? '中优先级'
                            : '低优先级'}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getStatusColor(req.status)}`}>
                          {req.status === 'completed'
                            ? '已完成'
                            : req.status === 'in-progress'
                            ? '进行中'
                            : '待启动'}
                        </span>
                        {isLinked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                            <i className="ri-focus-line"></i>
                            角色关注
                          </span>
                        )}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <i className="ri-more-line"></i>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span><i className="ri-hashtag"></i> {req.id}</span>
                      <span><i className="ri-user-line"></i> 责任人 {meta.owner}</span>
                      <span><i className="ri-calendar-check-line"></i> 目标 {meta.due}</span>
                      <span><i className="ri-route-line"></i> 当前阶段：{meta.stage}</span>
                      <span><i className="ri-time-line"></i> 更新 {meta.lastUpdate}</span>
                    </div>

                    <h4 className="mt-4 text-lg font-semibold text-gray-900">{req.name}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{req.content}</p>

                    {req.parameters.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900">关键参数</h5>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {req.parameters.map((param, index) => (
                            <div key={index} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3">
                              <div className="text-xs text-gray-500">{param.name}</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">
                                {param.value}
                                {param.unit && <span className="ml-1 text-xs text-gray-500">{param.unit}</span>}
                              </div>
                              {param.range && (
                                <div className="mt-2 text-xs text-gray-400">范围 {param.range}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.attachments && req.attachments.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900">相关文件</h5>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {req.attachments.map((attachment, index) => {
                            const icon =
                              attachmentIconMap[attachment.type ?? 'document'] || 'ri-attachment-2';
                            return (
                              <button
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-300 hover:text-blue-600"
                              >
                                <span className="flex items-center gap-2">
                                  <i className={`${icon} text-blue-500`}></i>
                                  <span className="font-medium text-gray-700">{attachment.name}</span>
                                </span>
                                <i className="ri-download-2-line text-gray-400"></i>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-5">
                      <h5 className="text-sm font-medium text-gray-900">进度追踪</h5>
                      <div className="mt-2">
                        {timeline.map((event, index) => (
                          <div
                            key={`${event.title}-${index}`}
                            className="relative pl-6 pb-4 text-xs text-gray-500 last:pb-0"
                          >
                            <span
                              className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${timelineStatusColor[event.status]}`}
                            ></span>
                            {index < timeline.length - 1 && (
                              <span className="absolute left-1 top-4 bottom-0 w-px bg-gray-200"></span>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-gray-600">
                              <span className="text-sm font-medium text-gray-900">{event.title}</span>
                              <span>{event.date}</span>
                              <span>· {event.actor}</span>
                            </div>
                            {event.note && <div className="mt-1 text-gray-400">{event.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                      <span>需求ID：{req.id}</span>
                      <div className="flex items-center gap-2">
                        <button className="rounded border border-blue-200 px-3 py-1 text-xs text-blue-600 hover:border-blue-400 hover:text-blue-800">
                          编辑需求
                        </button>
                        <button className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-800">
                          追溯链路
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default RequirementDetailPanel;
