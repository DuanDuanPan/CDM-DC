
'use client';

import { useState } from 'react';

interface CompareItem {
  id: number;
  name: string;
  type: string;
  subType: string;
  version: string;
  color: string;
  category: 'design' | 'simulation' | 'test' | 'requirement';
  dataType: 'parameter' | 'curve' | 'model' | 'image' | 'document';
}

export default function CompareCenter() {
  const [compareItems, setCompareItems] = useState<CompareItem[]>([
    {
      id: 1,
      name: '涡轮叶片设计方案A',
      type: '方案对比',
      subType: '设计方案',
      version: 'V2.1',
      color: '#3B82F6',
      category: 'design',
      dataType: 'model'
    },
    {
      id: 2,
      name: '涡轮叶片设计方案B',
      type: '方案对比',
      subType: '设计方案',
      version: 'V2.3',
      color: '#EF4444',
      category: 'design',
      dataType: 'model'
    }
  ]);

  const [activeTab, setActiveTab] = useState('parameter');
  const [compareMode, setCompareMode] = useState('scheme');

  const compareModes = [
    { id: 'scheme', name: '方案对比', icon: 'ri-git-branch-line', desc: '不同设计方案的对比分析' },
    { id: 'condition', name: '工况对比', icon: 'ri-dashboard-line', desc: '不同工作条件下的性能对比' },
    { id: 'test-sim', name: '试验/仿真对比', icon: 'ri-test-tube-line', desc: '试验数据与仿真结果对比' },
    { id: 'design-req', name: '设计/需求对比', icon: 'ri-file-list-2-line', desc: '设计指标与需求规范对比' }
  ];

  const dataTypes = [
    { id: 'parameter', name: '参数对比', icon: 'ri-table-line', desc: '数值参数的详细对比' },
    { id: 'curve', name: '曲线对比', icon: 'ri-line-chart-line', desc: '性能曲线和趋势对比' },
    { id: 'model', name: '模型对比', icon: 'ri-cube-line', desc: '3D模型几何对比' },
    { id: 'image', name: '图形对比', icon: 'ri-image-line', desc: '图片和图表对比' },
    { id: 'document', name: '文档对比', icon: 'ri-file-text-line', desc: '文档内容差异对比' }
  ];

  const removeItem = (id: number) => {
    setCompareItems(items => items.filter(item => item.id !== id));
  };

  const addCompareItem = () => {
    // 模拟添加新的对比项
    const newItem: CompareItem = {
      id: Date.now(),
      name: '新增对比项',
      type: compareMode === 'scheme' ? '方案对比' : 
            compareMode === 'condition' ? '工况对比' :
            compareMode === 'test-sim' ? '试验/仿真对比' : '设计/需求对比',
      subType: '待配置',
      version: 'V1.0',
      color: '#10B981',
      category: 'design',
      dataType: 'parameter'
    };
    setCompareItems(prev => [...prev, newItem]);
  };

  const getItemIcon = (category: string, dataType: string) => {
    if (dataType === 'model') return 'ri-cube-line';
    if (dataType === 'curve') return 'ri-line-chart-line';
    if (dataType === 'image') return 'ri-image-line';
    if (dataType === 'document') return 'ri-file-text-line';
    
    switch (category) {
      case 'design': return 'ri-pencil-ruler-2-line';
      case 'simulation': return 'ri-computer-line';
      case 'test': return 'ri-test-tube-line';
      case 'requirement': return 'ri-file-list-2-line';
      default: return 'ri-file-3d-line';
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 对比模式选择 */}
      <div className="border-b border-gray-200 bg-gray-50/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">对比中心</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">对比模式:</span>
            <select 
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              {compareModes.map(mode => (
                <option key={mode.id} value={mode.id}>{mode.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 对比模式说明 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <i className={`${compareModes.find(m => m.id === compareMode)?.icon} text-blue-600`}></i>
            <span className="text-sm text-blue-800 font-medium">
              {compareModes.find(m => m.id === compareMode)?.name}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {compareModes.find(m => m.id === compareMode)?.desc}
          </p>
        </div>
        
        {/* 对比项目列表 */}
        <div className="flex items-center space-x-4">
          {compareItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border min-w-0">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <i className={`${getItemIcon(item.category, item.dataType)} text-gray-600 flex-shrink-0`}></i>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.version} · {item.subType}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          ))}
          
          {compareItems.length < 6 && (
            <button 
              onClick={addCompareItem}
              className="flex items-center justify-center w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <div className="text-center">
                <i className="ri-add-line text-xl mb-1"></i>
                <div className="text-xs">添加项目</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 对比类型选项卡 */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex space-x-8">
          {dataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === type.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              title={type.desc}
            >
              <i className={type.icon}></i>
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 对比视图内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'parameter' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">参数对比表</h3>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      仅显示差异
                    </button>
                    <button className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50">
                      导出Excel
                    </button>
                  </div>
                </div>
              </div>
              
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      参数名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单位
                    </th>
                    {compareItems.map((item) => (
                      <th key={item.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="truncate max-w-24">{item.name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      差异分析
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { name: '叶片长度', unit: 'mm', values: ['245.6', '248.2'], diff: '+2.6', diffType: 'increase' },
                    { name: '叶片厚度', unit: 'mm', values: ['12.5', '12.8'], diff: '+0.3', diffType: 'increase' },
                    { name: '材料密度', unit: 'g/cm³', values: ['4.51', '4.51'], diff: '0', diffType: 'same' },
                    { name: '工作温度', unit: '°C', values: ['1200', '1180'], diff: '-20', diffType: 'decrease' },
                    { name: '转速', unit: 'rpm', values: ['12000', '12500'], diff: '+500', diffType: 'increase' },
                    { name: '效率', unit: '%', values: ['85.2', '86.1'], diff: '+0.9', diffType: 'increase' }
                  ].map((param, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/30`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {param.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {param.unit}
                      </td>
                      {param.values.map((value, valueIndex) => (
                        <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {value}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            param.diffType === 'same' ? 'text-gray-500' :
                            param.diffType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {param.diff}
                          </span>
                          <i className={`text-sm ${
                            param.diffType === 'same' ? 'ri-subtract-line text-gray-400' :
                            param.diffType === 'increase' ? 'ri-arrow-up-line text-green-500' : 'ri-arrow-down-line text-red-500'
                          }`}></i>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'curve' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">性能曲线对比</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600">
                      <i className="ri-zoom-in-line"></i>
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600">
                      <i className="ri-settings-3-line"></i>
                    </button>
                  </div>
                </div>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <i className="ri-line-chart-line text-4xl mb-2"></i>
                    <p>效率-转速曲线</p>
                    <div className="flex items-center justify-center space-x-4 mt-3">
                      {compareItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-1">
                          <div className="w-3 h-0.5" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">温度分布曲线</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600">
                      <i className="ri-zoom-in-line"></i>
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600">
                      <i className="ri-settings-3-line"></i>
                    </button>
                  </div>
                </div>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <i className="ri-fire-line text-4xl mb-2"></i>
                    <p>叶片表面温度分布</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">曲线对比工具</h3>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded">
                      零点对齐
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded">
                      归一化
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded">
                      平滑处理
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 mb-1">最大差异点</div>
                    <div className="font-medium">转速: 8500 rpm</div>
                    <div className="font-medium">差异: +2.3%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 mb-1">平均差异</div>
                    <div className="font-medium">+1.2%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 mb-1">趋势一致性</div>
                    <div className="font-medium text-green-600">95.8%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="flex h-full">
            {compareItems.map(item => (
              <div key={item.id} className="flex-1 border-r border-gray-200 last:border-r-0">
                <div className="h-full bg-gray-100 relative">
                  <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-sm z-10">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <i className="ri-3d-view-line text-6xl mb-4"></i>
                      <p className="text-lg font-medium">3D模型视图</p>
                      <p className="text-sm">几何差异高亮显示</p>
                    </div>
                  </div>
                  
                  {/* 模型对比控制 */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-2 shadow-sm">
                    <div className="space-y-2">
                      <button className="w-full px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded">
                        半透明模式
                      </button>
                      <button className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                        差异闪烁
                      </button>
                      <button className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                        截面对比
                      </button>
                    </div>
                  </div>
                  
                  {/* 视图控制 */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex flex-col space-y-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <i className="ri-zoom-in-line"></i>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <i className="ri-zoom-out-line"></i>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <i className="ri-refresh-line"></i>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <i className="ri-fullscreen-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'image' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {compareItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                  </div>
                  
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center text-gray-500">
                      <i className="ri-image-line text-4xl mb-2"></i>
                      <p>仿真结果图像</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">分辨率: 1920x1080</span>
                    <button className="text-blue-600 hover:text-blue-800">
                      查看大图
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 图像对比工具 */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">图像对比工具</h3>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  并排对比
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  滑动对比
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  差异高亮
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  像素级对比
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {compareItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-4 text-sm">
                      <div className="bg-green-50 border-l-4 border-green-400 p-3">
                        <div className="text-green-800">+ 新增内容</div>
                        <div className="text-green-700 mt-1">叶片冷却通道优化设计，提升散热效率15%</div>
                      </div>
                      
                      <div className="bg-red-50 border-l-4 border-red-400 p-3">
                        <div className="text-red-800">- 删除内容</div>
                        <div className="text-red-700 mt-1">传统冷却结构设计方案</div>
                      </div>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                        <div className="text-yellow-800">~ 修改内容</div>
                        <div className="text-yellow-700 mt-1">
                          <span className="bg-red-200">工作温度1200°C</span> → <span className="bg-green-200">工作温度1180°C</span>
                        </div>
                      </div>
                      
                      <div className="p-3 border border-gray-200 rounded">
                        <div className="text-gray-800">无变化内容</div>
                        <div className="text-gray-600 mt-1">材料选择：GH4169高温合金</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 文档对比统计 */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">文档差异统计</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-green-700">新增内容</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">5</div>
                  <div className="text-sm text-red-700">删除内容</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-yellow-700">修改内容</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">89.2%</div>
                  <div className="text-sm text-blue-700">相似度</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <i className="ri-download-line"></i>
              <span>导出报告</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <i className="ri-share-line"></i>
              <span>分享对比</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <i className="ri-history-line"></i>
              <span>对比历史</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              共对比 {compareItems.length} 个项目
            </span>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              重置视图
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              保存对比
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
