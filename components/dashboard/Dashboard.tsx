
'use client';

import StatsGrid from './StatsGrid';
import ActivityChart from './ActivityChart';
import RecentAssets from './RecentAssets';
import ProjectHealth from './ProjectHealth';

export default function Dashboard() {
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
