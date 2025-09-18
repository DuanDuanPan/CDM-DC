'use client';

import { useState } from 'react';

export default function CompletionPanel() {
  const [activeTemplate, setActiveTemplate] = useState('engine');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const templates = {
    engine: {
      name: '发动机完整性模板',
      description: '包含发动机设计、制造、测试全流程所需资料',
      categories: [
        {
          name: '设计文档',
          required: 12,
          completed: 10,
          items: [
            { id: 'design-1', name: '总体设计方案', status: 'completed', required: true },
            { id: 'design-2', name: '详细设计图纸', status: 'completed', required: true },
            { id: 'design-3', name: '材料选型报告', status: 'missing', required: true },
            { id: 'design-4', name: '强度分析报告', status: 'completed', required: true },
          ]
        },
        {
          name: '仿真验证',
          required: 8,
          completed: 6,
          items: [
            { id: 'sim-1', name: '流体动力学分析', status: 'completed', required: true },
            { id: 'sim-2', name: '热力学分析', status: 'completed', required: true },
            { id: 'sim-3', name: '结构强度分析', status: 'missing', required: true },
            { id: 'sim-4', name: '疲劳寿命分析', status: 'missing', required: true },
          ]
        },
        {
          name: '试验数据',
          required: 15,
          completed: 8,
          items: [
            { id: 'test-1', name: '台架试验数据', status: 'completed', required: true },
            { id: 'test-2', name: '高温试验数据', status: 'completed', required: true },
            { id: 'test-3', name: '振动试验数据', status: 'missing', required: true },
            { id: 'test-4', name: '耐久性试验数据', status: 'missing', required: false },
          ]
        }
      ]
    }
  };

  const currentTemplate = templates[activeTemplate as keyof typeof templates];
  const totalRequired = currentTemplate.categories.reduce((sum, cat) => sum + cat.required, 0);
  const totalCompleted = currentTemplate.categories.reduce((sum, cat) => sum + cat.completed, 0);
  const completionRate = Math.round((totalCompleted / totalRequired) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return { icon: 'ri-check-line', color: 'text-green-600' };
      case 'missing': return { icon: 'ri-close-line', color: 'text-red-600' };
      case 'partial': return { icon: 'ri-subtract-line', color: 'text-yellow-600' };
      default: return { icon: 'ri-question-line', color: 'text-gray-400' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'missing': return '缺失';
      case 'partial': return '部分完成';
      default: return '未知';
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="flex h-full">
        {/* 左侧模板选择 */}
        <div className="w-80 border-r border-gray-200 bg-gray-50/50">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">成套性管理</h2>
            
            <div className="space-y-3">
              <div 
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  activeTemplate === 'engine' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveTemplate('engine')}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{currentTemplate.name}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                    <div className="text-xs text-gray-500">完成度</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{currentTemplate.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {totalCompleted}/{totalRequired} 项目完成
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="mt-6 space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                生成完整性报告
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                导出缺失清单
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                一键打包
              </button>
            </div>
          </div>
        </div>

        {/* 右侧详细列表 */}
        <div className="flex-1">
          <div className="p-6">
            {/* 头部统计 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{currentTemplate.name}</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    总进度: <span className="font-medium text-blue-600">{completionRate}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <i className="ri-filter-line"></i>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <i className="ri-search-line"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {currentTemplate.categories.map((category) => {
                  const categoryRate = Math.round((category.completed / category.required) * 100);
                  return (
                    <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <span className="text-sm font-medium text-gray-600">{categoryRate}%</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {category.completed}/{category.required} 完成
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${categoryRate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 详细项目列表 */}
            <div className="space-y-6">
              {currentTemplate.categories.map((category) => (
                <div key={category.name} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {category.completed}/{category.required} 完成
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          批量分配
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {category.items.map((item) => {
                      const statusConfig = getStatusIcon(item.status);
                      return (
                        <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems([...selectedItems, item.id]);
                                  } else {
                                    setSelectedItems(selectedItems.filter(id => id !== item.id));
                                  }
                                }}
                              />
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                item.status === 'completed' ? 'bg-green-100' :
                                item.status === 'missing' ? 'bg-red-100' : 'bg-yellow-100'
                              }`}>
                                <i className={`${statusConfig.icon} ${statusConfig.color}`}></i>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                  {item.required && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                      必需
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{item.id}</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                {getStatusText(item.status)}
                              </span>
                              
                              {item.status === 'missing' && (
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  分配任务
                                </button>
                              )}
                              
                              {item.status === 'completed' && (
                                <button className="text-gray-600 hover:text-gray-800 text-sm">
                                  查看详情
                                </button>
                              )}
                              
                              <button className="text-gray-400 hover:text-gray-600">
                                <i className="ri-more-line"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 批量操作栏 */}
            {selectedItems.length > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    已选择 {selectedItems.length} 个项目
                  </span>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setSelectedItems([])}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      取消选择
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      批量分配
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      导出清单
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}