
'use client';

import { useState } from 'react';

export default function DataExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>(['热分析', '强度校核', '疲劳寿命', '振动分析']);
  const [newTag, setNewTag] = useState('');
  const [showMoreTypes, setShowMoreTypes] = useState(false);

  const facets = [
    { 
      name: '文件类型', 
      count: 1234, 
      options: [
        { name: 'CAD模型', count: 456, icon: 'ri-cube-line' },
        { name: '仿真结果', count: 234, icon: 'ri-line-chart-line' },
        { name: '测试数据', count: 345, icon: 'ri-file-chart-line' },
        { name: '技术文档', count: 199, icon: 'ri-file-text-line' },
        { name: '图片资料', count: 156, icon: 'ri-image-line' },
        { name: '视频资料', count: 89, icon: 'ri-video-line' },
        { name: '表格数据', count: 234, icon: 'ri-table-line' },
        { name: 'PDF文档', count: 198, icon: 'ri-file-pdf-line' }
      ]
    },
    { 
      name: '标签分类', 
      count: 856, 
      options: [
        { name: '结构设计', count: 123, icon: 'ri-building-line' },
        { name: '热力分析', count: 98, icon: 'ri-fire-line' },
        { name: '流体仿真', count: 87, icon: 'ri-drop-line' },
        { name: '材料特性', count: 76, icon: 'ri-palette-line' },
        { name: '控制系统', count: 65, icon: 'ri-settings-4-line' },
        { name: '性能测试', count: 54, icon: 'ri-speed-line' }
      ]
    },
    { 
      name: '上传人员', 
      count: 432, 
      options: [
        { name: '张工程师', count: 89, icon: 'ri-user-line' },
        { name: '李博士', count: 76, icon: 'ri-user-line' },
        { name: '王总师', count: 67, icon: 'ri-user-line' },
        { name: '赵研究员', count: 54, icon: 'ri-user-line' }
      ]
    },
    { 
      name: '部门分类', 
      count: 321, 
      options: [
        { name: '结构设计部', count: 89, icon: 'ri-building-2-line' },
        { name: '仿真分析部', count: 76, icon: 'ri-computer-line' },
        { name: '试验验证部', count: 67, icon: 'ri-test-tube-line' },
        { name: '材料工艺部', count: 54, icon: 'ri-tools-line' },
        { name: '质量保证部', count: 35, icon: 'ri-shield-check-line' }
      ]
    },
    { 
      name: '版本状态', 
      count: 678, 
      options: [
        { name: '最新版本', count: 234, icon: 'ri-check-line' },
        { name: '基线版本', count: 187, icon: 'ri-bookmark-line' },
        { name: '草稿', count: 145, icon: 'ri-draft-line' },
        { name: '已归档', count: 112, icon: 'ri-archive-line' }
      ]
    }
  ];

  const assets = [
    {
      id: 1,
      name: '涡轮叶片三维模型',
      type: 'CAD模型',
      version: 'V3.2',
      size: '245 MB',
      lastModified: '2024-01-15',
      author: '张工程师',
      department: '结构设计部',
      status: '最新版本',
      tags: ['结构设计', '叶片优化'],
      uploadTime: '2024-01-15 14:23'
    },
    {
      id: 2,
      name: '燃烧室温度场仿真',
      type: '仿真结果',
      version: 'V2.1',
      size: '1.2 GB',
      lastModified: '2024-01-14',
      author: '李博士',
      department: '仿真分析部',
      status: '基线版本',
      tags: ['热力分析', '燃烧室'],
      uploadTime: '2024-01-14 09:45'
    },
    {
      id: 3,
      name: '压气机性能测试报告',
      type: '测试数据',
      version: 'V1.5',
      size: '89 MB',
      lastModified: '2024-01-13',
      author: '王总师',
      department: '试验验证部',
      status: '最新版本',
      tags: ['性能测试', '压气机'],
      uploadTime: '2024-01-13 16:12'
    }
  ];

  const allTags = [...new Set([...assets.flatMap(asset => asset.tags), ...customTags])];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
    setViewMode('grid');
    setShowMoreTypes(false);
  };

  const displayedTypes = showMoreTypes ? facets[0].options : facets[0].options.slice(0, 4);

  return (
    <div className="flex h-full bg-white">
      {/* 左侧分面导航 */}
      <div className="w-80 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">数据探索器</h2>
            <button 
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              清除筛选
            </button>
          </div>
          
          {/* 搜索框 */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="搜索数据资产..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* 时间过滤 */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <i className="ri-calendar-line mr-2"></i>
              时间筛选
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 标签筛选 */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <i className="ri-price-tag-3-line mr-2"></i>
                标签筛选
              </div>
              <span className="text-xs text-gray-500">{allTags.length} 个标签</span>
            </h3>
            
            {/* 添加自定义标签 */}
            <div className="mb-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="添加自定义标签..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={addCustomTag}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <div key={tag} className="relative group">
                  <button
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                  {customTags.includes(tag) && (
                    <button
                      onClick={() => removeCustomTag(tag)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <i className="ri-close-line text-xs"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 文件类型筛选 - 支持展开更多类型 */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <i className="ri-folder-line mr-2"></i>
                文件类型
              </h3>
              <span className="text-xs text-gray-500">{facets[0].count}</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {displayedTypes.map((option) => (
                <label key={option.name} className="flex items-center justify-between hover:bg-gray-50 rounded p-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-2 flex items-center">
                      <i className={`${option.icon} text-gray-400 mr-2`}></i>
                      <span className="text-sm text-gray-700">{option.name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{option.count}</span>
                </label>
              ))}
            </div>
            {facets[0].options.length > 4 && (
              <button
                onClick={() => setShowMoreTypes(!showMoreTypes)}
                className="w-full mt-2 py-1 text-xs text-blue-600 hover:text-blue-800 border-t border-gray-100 pt-2"
              >
                {showMoreTypes ? '收起' : `查看更多 (${facets[0].options.length - 4})`}
              </button>
            )}
          </div>

          {/* 其他分面筛选 */}
          <div className="space-y-4">
            {facets.slice(1).map((facet) => (
              <div key={facet.name} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <i className={facet.options[0]?.icon || 'ri-folder-line'} style={{ marginRight: '8px' }}></i>
                    {facet.name}
                  </h3>
                  <span className="text-xs text-gray-500">{facet.count}</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {facet.options.map((option) => (
                    <label key={option.name} className="flex items-center justify-between hover:bg-gray-50 rounded p-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-2 flex items-center">
                          <i className={`${option.icon} text-gray-400 mr-2`}></i>
                          <span className="text-sm text-gray-700">{option.name}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{option.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">共找到 <span className="font-medium text-gray-900">{assets.length}</span> 个资产</span>
              {selectedTags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">标签:</span>
                  {selectedTags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      {tag}
                      <button 
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="ri-grid-line"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="ri-list-check"></i>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 pr-8">
                <option>按修改时间排序</option>
                <option>按创建时间排序</option>
                <option>按文件大小排序</option>
                <option>按文件名排序</option>
              </select>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg whitespace-nowrap">
                批量操作
              </button>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                加入对比
              </button>
            </div>
          </div>
        </div>

        {/* 资产列表 */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className={`${
                          asset.type === 'CAD模型' ? 'ri-cube-line' :
                          asset.type === '仿真结果' ? 'ri-line-chart-line' :
                          asset.type === '测试数据' ? 'ri-file-chart-line' : 'ri-file-text-line'
                        } text-blue-600`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{asset.name}</h3>
                        <p className="text-sm text-gray-500">{asset.type}</p>
                      </div>
                    </div>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">版本:</span>
                      <span className="text-gray-900">{asset.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">大小:</span>
                      <span className="text-gray-900">{asset.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">上传时间:</span>
                      <span className="text-gray-900">{asset.uploadTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">创建者:</span>
                      <span className="text-gray-900">{asset.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">部门:</span>
                      <span className="text-gray-900">{asset.department}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {asset.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.status === '最新版本' ? 'bg-green-100 text-green-800' :
                      asset.status === '基线版本' ? 'bg-blue-100 text-blue-800' :
                      asset.status === '草稿' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {asset.status}
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上传人/部门</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上传时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <i className={`${
                              asset.type === 'CAD模型' ? 'ri-cube-line' :
                              asset.type === '仿真结果' ? 'ri-line-chart-line' :
                              asset.type === '测试数据' ? 'ri-file-chart-line' : 'ri-file-text-line'
                            } text-blue-600 text-sm`}></i>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.version}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.author}</div>
                        <div className="text-sm text-gray-500">{asset.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.uploadTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.status === '最新版本' ? 'bg-green-100 text-green-800' :
                          asset.status === '基线版本' ? 'bg-blue-100 text-blue-800' :
                          asset.status === '草稿' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
