
'use client';

import { useState } from 'react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const modules = [
    { id: 'dashboard', label: '仪表盘', icon: 'ri-dashboard-3-line' },
    { id: 'explorer', label: '数据探索器', icon: 'ri-search-2-line' },
    { id: 'structure', label: '产品结构(XBOM)', icon: 'ri-node-tree' },
    { id: 'compare', label: '对比中心', icon: 'ri-slideshow-line' },
    { id: 'upload', label: '上传管理器', icon: 'ri-upload-cloud-2-line' },
    { id: 'completion', label: '成套性管理', icon: 'ri-checkbox-multiple-line' },
    { id: 'graph', label: '关系图谱', icon: 'ri-share-circle-line' },
    { id: 'settings', label: '设置/管理', icon: 'ri-settings-4-line' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white/60 backdrop-blur-sm border-r border-gray-200/60 transition-all duration-300 flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
        {!isCollapsed && (
          <span className="text-sm font-medium text-gray-900">功能导航</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100/60 rounded-lg transition-colors"
        >
          <i className={`ri-${isCollapsed ? 'menu-unfold' : 'menu-fold'}-line text-gray-600`}></i>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 text-left rounded-xl transition-all duration-200 ${
              activeModule === module.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-700 hover:bg-gray-100/60 hover:text-gray-900'
            } ${isCollapsed ? 'tooltip-container' : ''}`}
            title={isCollapsed ? module.label : ''}
          >
            <i className={`${module.icon} text-xl`}></i>
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap">{module.label}</span>
            )}
          </button>
        ))}
      </nav>
      
      {!isCollapsed && (
        <div className="p-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">项目状态</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">数据入库</span>
                <span className="text-xs font-semibold text-blue-600">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">活跃用户</span>
                <span className="text-xs font-semibold text-green-600">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">待审项目</span>
                <span className="text-xs font-semibold text-orange-600">12</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
