interface PresenceMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  location: string;
  avatar?: string;
}

interface CollaborationActivity {
  id: string;
  title: string;
  summary: string;
  owner: string;
  timestamp: string;
  status: 'in-progress' | 'completed' | 'pending';
  type: 'review' | 'sync' | 'handover';
}

interface CollaborationNotification {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  time: string;
  action?: string;
}

interface CollaborationAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface UpcomingReview {
  id: string;
  title: string;
  date: string;
  owner: string;
  scope: string;
  status: 'scheduled' | 'drafting' | 'completed';
}

interface CollaborationHubProps {
  presence: PresenceMember[];
  activities: CollaborationActivity[];
  notifications: CollaborationNotification[];
  actions: CollaborationAction[];
  reviews: UpcomingReview[];
}

const presenceStatusStyle: Record<PresenceMember['status'], string> = {
  online: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  busy: 'bg-amber-100 text-amber-700 border border-amber-200',
  offline: 'bg-slate-100 text-slate-500 border border-slate-200'
};

const activityStatusBadge: Record<CollaborationActivity['status'], string> = {
  'in-progress': 'bg-blue-50 text-blue-600 border border-blue-200',
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  pending: 'bg-slate-100 text-slate-600 border border-slate-200'
};

const notificationStyle: Record<CollaborationNotification['severity'], { badge: string; icon: string }> = {
  info: {
    badge: 'bg-blue-50 text-blue-600 border border-blue-200',
    icon: 'ri-notification-3-line'
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: 'ri-error-warning-line'
  },
  critical: {
    badge: 'bg-red-50 text-red-600 border border-red-200',
    icon: 'ri-alert-line'
  }
};

const reviewStatusStyle: Record<UpcomingReview['status'], string> = {
  scheduled: 'text-blue-600',
  drafting: 'text-amber-600',
  completed: 'text-emerald-600'
};

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const CollaborationHub = ({ presence, activities, notifications, actions, reviews }: CollaborationHubProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">协同与通知</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · 协同消息 / 审签看板
          </span>
        </div>
        <p className="text-sm text-gray-500">
          汇集团队在线状态、待办通知与评审计划，支持跨团队快速对齐和任务闭环。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-message-3-line mr-1"></i>
          打开协同面板
        </button>
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-notification-badge-line mr-1"></i>
          管理提醒规则
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-video-on-line mr-1"></i>
          发起评审会议
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-7">
      <div className="space-y-6 rounded-2xl border border-gray-100 bg-slate-50/70 p-5 xl:col-span-4">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">实时动态</h4>
            <span className="text-xs text-gray-400">{activities.length} 条更新</span>
          </div>
          <div className="mt-4 space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-500">{activity.owner} · {activity.timestamp}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activityStatusBadge[activity.status]}`}>
                    {activity.status === 'completed' ? '已完成' : activity.status === 'in-progress' ? '进行中' : '待启动'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">{activity.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">最新提醒</h4>
            <button type="button" className="text-xs text-blue-600 hover:text-blue-700">
              查看全部
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map(item => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${notificationStyle[item.severity].badge}`}>
                    <i className={notificationStyle[item.severity].icon}></i>
                    {item.severity === 'critical' ? '关键' : item.severity === 'warning' ? '关注' : '通知'}
                  </span>
                  <span>{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.message}</p>
                {item.action && (
                  <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <i className="ri-external-link-line"></i>
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 xl:col-span-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">在线协同</h4>
            <span className="text-xs text-gray-400">{presence.length} 人</span>
          </div>
          <div className="mt-4 space-y-3">
            {presence.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {member.avatar || member.name.slice(0, 1)}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${presenceStatusStyle[member.status]}`}>
                    <i className="ri-circle-fill text-[8px]"></i>
                    {member.status === 'online' ? '在线' : member.status === 'busy' ? '忙碌' : '离线'}
                  </span>
                  <div className="mt-1">{member.location}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map(action => (
              <button
                key={action.id}
                type="button"
                className="flex-1 min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600"
                aria-label={action.description}
              >
                <div className="flex items-center gap-2">
                  <i className={action.icon}></i>
                  <span className="font-medium text-gray-700">{action.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">即将到来的评审</h4>
            <button type="button" className="text-xs text-blue-600 hover:text-blue-700">
              同步日程
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{review.title}</span>
                  <span className={reviewStatusStyle[review.status]}>
                    {review.status === 'completed' ? '已完成' : review.status === 'drafting' ? '筹备中' : '已排期'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{review.date} · {review.owner}</div>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">{review.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CollaborationHub;
