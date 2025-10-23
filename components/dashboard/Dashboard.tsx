
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatsGrid from './StatsGrid';
import ActivityChart from './ActivityChart';
import RecentAssets from './RecentAssets';
import ProjectHealth from './ProjectHealth';

type DashboardProps = {
  tbomLink?: {
    from: string | null;
    domain: string | null;
    assetSn: string | null;
    runId: string | null;
    testId: string | null;
  } | null;
};

export default function Dashboard({ tbomLink = null }: DashboardProps) {
  const router = useRouter();
  const showTbomBanner = tbomLink?.from === 'tbom' && tbomLink.domain === 'physical';
  const handleReturnToTbom = useCallback(() => {
    const params = new URLSearchParams();
    params.set('module', 'structure');
    params.set('domain', 'ebom');
    params.set('from', 'tbom');
    params.set('restore', '1');
    router.push(`/?${params.toString()}`);
  }, [router]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600 mt-1">项目数据概览与健康状态监控</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <i className="ri-download-line mr-2"></i>
            导出报告
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap">
            <i className="ri-refresh-line mr-2"></i>
            刷新数据
          </button>
        </div>
      </div>

      {showTbomBanner ? (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-blue-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">来自 TBOM 的实物追溯</p>
              <p className="text-xs text-blue-700">试验件序列号：{tbomLink?.assetSn ?? '未提供'} · 运行 {tbomLink?.runId ?? '未提供'}</p>
            </div>
            <button
              type="button"
              onClick={handleReturnToTbom}
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:border-blue-300 hover:text-blue-700"
            >
              <i className="ri-share-reverse-line" aria-hidden /> 返回 TBOM
            </button>
          </div>
        </section>
      ) : null}

      <StatsGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <ProjectHealth />
        </div>
      </div>
      
      <RecentAssets />
    </div>
  );
}
