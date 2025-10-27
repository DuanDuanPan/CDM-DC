
'use client';

import { useState, useEffect } from 'react';
import {
  PROJECT_CATALOG,
  PROJECT_TYPE_COLOR,
  PROJECT_TYPE_ICON,
  type ProjectCatalogItem,
} from './data/projects';

interface HeaderProps {
  selectedProject: string;
  onProjectChange: (project: string) => void;
}

export default function Header({ selectedProject, onProjectChange }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const projects: ProjectCatalogItem[] = PROJECT_CATALOG;
  const categories = [...new Set(projects.map((project) => project.category))];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesType = selectedType === 'all' || project.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getProjectIcon = (type: ProjectCatalogItem['type']) =>
    PROJECT_TYPE_ICON[type] ?? 'ri-folder-line';

  const getProjectColor = (type: ProjectCatalogItem['type']) =>
    PROJECT_TYPE_COLOR[type] ?? 'text-gray-600 bg-gray-100';

  const groupedProjects = filteredProjects.reduce((acc, project) => {
    if (!acc[project.category]) {
      acc[project.category] = {};
    }
    if (project.subCategory) {
      if (!acc[project.category][project.subCategory]) {
        acc[project.category][project.subCategory] = [];
      }
      acc[project.category][project.subCategory].push(project);
    } else {
      if (!acc[project.category]['其他']) {
        acc[project.category]['其他'] = [];
      }
      acc[project.category]['其他'].push(project);
    }
    return acc;
  }, {} as Record<string, Record<string, ProjectCatalogItem[]>>);

  // 获取当前选中项目的信息
  const currentProject = projects.find(p => p.name === selectedProject) || projects[0];

  if (!mounted) {
    return null;
  }

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm relative z-40">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <i className="ri-database-2-line text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">产品过程数据中心</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${getProjectColor(currentProject.type)}`}>
                  <i className={`${getProjectIcon(currentProject.type)} text-sm`}></i>
                </div>
                <span>{selectedProject}</span>
              </div>
              <i className="ri-arrow-down-s-line text-gray-500"></i>
            </button>
            
            {showProjects && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl border border-gray-200/60 shadow-lg z-50 max-h-96 overflow-hidden">
                {/* 搜索区域 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-search-line text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="搜索项目名称或代号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setAdvancedSearch(!advancedSearch)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <i className="ri-filter-line"></i>
                      <span>高级搜索</span>
                    </button>
                    <span className="text-xs text-gray-500">{filteredProjects.length} 个项目</span>
                  </div>
                  
                  {advancedSearch && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">项目分类</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 pr-8"
                        >
                          <option value="all">全部分类</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">项目类型</label>
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 pr-8"
                        >
                          <option value="all">全部类型</option>
                          <option value="model">型号研制</option>
                          <option value="tech">技术研究</option>
                          <option value="simulation">仿真分析</option>
                          <option value="other">其他项目</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 项目列表 */}
                <div className="max-h-64 overflow-y-auto">
                  {Object.keys(groupedProjects).map(category => (
                    <div key={category} className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 uppercase tracking-wider">
                        {category}
                      </div>
                      {Object.keys(groupedProjects[category]).map(subCategory => (
                        <div key={subCategory} className="ml-2">
                          {subCategory !== '其他' && (
                            <div className="text-xs text-gray-400 px-2 py-1">
                              {subCategory}
                            </div>
                          )}
                          {groupedProjects[category][subCategory].map((project) => (
                            <button
                              key={project.id}
                              onClick={() => {
                                onProjectChange(project.name);
                                setShowProjects(false);
                                setSearchQuery('');
                                setAdvancedSearch(false);
                                setSelectedCategory('all');
                                setSelectedType('all');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100/60 rounded-lg transition-colors flex items-center space-x-3"
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${getProjectColor(project.type)}`}>
                                <i className={`${project.icon} text-sm`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{project.name}</div>
                                <div className="text-xs text-gray-500">{project.code}</div>
                              </div>
                              {project.level > 1 && (
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center space-x-3 px-4 py-2 bg-gray-100/60 hover:bg-gray-200/60 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <i className="ri-search-line text-gray-500"></i>
              <span className="text-sm text-gray-500">全局搜索 (Ctrl+K)</span>
            </button>
            
            {showSearch && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200/60 shadow-lg z-50">
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="搜索数据、文档、组件..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>快速导航</span>
                      <span>ESC 关闭</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100/60 rounded-lg transition-colors">
              <i className="ri-notification-2-line text-gray-600"></i>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">张</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
