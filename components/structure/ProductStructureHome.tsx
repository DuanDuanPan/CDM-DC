'use client';

import TransformationOverview from '@/components/structure/TransformationOverview';
import type { QuickNavigateTarget } from '@/components/structure/types';

type ProductStructureHomeProps = {
  currentBomType: string;
  onQuickNavigate: (target: QuickNavigateTarget) => void;
};

const ROLE_SHORTCUTS: Array<{
  title: string;
  description: string;
  actionLabel: string;
  target: QuickNavigateTarget;
  icon: string;
}> = [
  {
    title: '系统工程师',
    description: '从方案视角审视结构覆盖、定义版本和跨域状态，维持数字线索的顶层一致性。',
    actionLabel: '进入方案概览',
    target: { bomType: 'solution', tab: 'overview' },
    icon: 'ri-compass-3-line',
  },
  {
    title: '仿真工程师',
    description: '沿结构路径定位仿真实例与版本，快速切换工况并同步试验进度。',
    actionLabel: '打开仿真导航',
    target: { bomType: 'simulation', tab: 'simulation' },
    icon: 'ri-computer-line',
  },
  {
    title: '试验工程师',
    description: '按“产品结构 → 试验类型 → 项目”梳理任务并跟踪运行记录，实现闭环验证。',
    actionLabel: '前往试验结构',
    target: { bomType: 'test', tab: 'structure' },
    icon: 'ri-test-tube-line',
  },
  {
    title: '设计/制造团队',
    description: '回溯 XBOM 节点、查看设计基线与工艺能力，确保结构变更与验证同步。',
    actionLabel: '查看设计结构',
    target: { bomType: 'design', tab: 'structure' },
    icon: 'ri-pencil-ruler-2-line',
  },
];

export default function ProductStructureHome({ currentBomType, onQuickNavigate }: ProductStructureHomeProps) {
  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 border-b border-blue-100/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-14">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <i className="ri-link"></i>
              数字线索 · Digital Thread
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              让 XBOM 结构成为设计、仿真、试验的统一语义骨架
            </h1>
            <p className="text-base leading-relaxed text-slate-600">
              在这一模块中，我们围绕产品结构构建数字线索：将结构节点与仿真/试验数据映射，形成可追踪、可复用的跨域视图。首页帮助你快速理解理念、掌握映射规则，并跳转到各角色视角。
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-blue-600 shadow-sm ring-1 ring-blue-200">
                <i className="ri-layout-grid-line"></i>
                当前 BOM 类型：{typeLabelMap[currentBomType as keyof typeof typeLabelMap] ?? '—'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-slate-600 shadow-sm ring-1 ring-slate-200">
                <i className="ri-shield-check-line"></i>
                目标：语义一致 · 数据可追溯 · 角色协同
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-sm lg:max-w-xs">
            <h2 className="text-sm font-semibold text-slate-900">快速开始</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p>· 了解数字线索理念与 XBOM 映射规则</p>
              <p>· 根据角色进入专属操作路径</p>
              <p>· 查看跨域指标与最新更新</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:py-12">
        <TransformationOverview onQuickNavigate={onQuickNavigate} />

        <section>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">按角色进入工作路线</h2>
            <p className="text-xs text-slate-500">选择角色即可跳转到对应 BOM 视图，自动匹配常用标签页。</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ROLE_SHORTCUTS.map((role) => (
              <article key={role.title} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <i className={`${role.icon} text-lg`} />
                    </span>
                    <h3 className="text-sm font-semibold">{role.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{role.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onQuickNavigate(role.target)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  {role.actionLabel}
                  <i className="ri-arrow-right-line text-sm" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">常用入口</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <i className="ri-focus-3-line mt-0.5 text-blue-500"></i>
                <span>在左侧选择 XBOM 节点，使用“试验结构”或“仿真导航”卡片进入对应视图。</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-database-2-line mt-0.5 text-blue-500"></i>
                <span>使用方案视图融合结构 KPI、仿真结果与试验状态，支撑版本审查。</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-lightbulb-line mt-0.5 text-blue-500"></i>
                <span>切换到“成套性管理 / 对比中心”获取跨域数据分析结果。</span>
              </li>
            </ul>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">知识库与更新</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>· <span className="text-blue-600">数字线索 PRD</span>：定位愿景、范围、关键指标。</li>
              <li>· <span className="text-blue-600">XBOM 映射规范</span>：字段对照、结构路径约束、异常处理。</li>
              <li>· <span className="text-blue-600">最新迭代日志</span>：查看功能更新与上线提醒。</li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}

const typeLabelMap = {
  solution: '方案 BOM',
  simulation: '仿真 BOM',
  test: '试验 BOM',
  design: '设计 BOM',
  requirement: '需求视角',
  physical: '实物 BOM',
};
