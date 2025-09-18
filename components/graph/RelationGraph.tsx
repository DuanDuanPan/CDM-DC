'use client';

import { useState, useEffect, useRef } from 'react';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  connections: string[];
  status: 'active' | 'inactive' | 'broken';
}

export default function RelationGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('full');
  const [filterType, setFilterType] = useState('all');

  const [nodes] = useState<GraphNode[]>([
    {
      id: 'engine-001',
      name: '发动机总成',
      type: 'assembly',
      x: 400,
      y: 300,
      connections: ['compressor-001', 'combustor-001', 'turbine-001'],
      status: 'active'
    },
    {
      id: 'compressor-001',
      name: '压气机组件',
      type: 'component',
      x: 200,
      y: 200,
      connections: ['blade-001', 'blade-002', 'engine-001'],
      status: 'active'
    },
    {
      id: 'combustor-001',
      name: '燃烧室组件',
      type: 'component',
      x: 400,
      y: 150,
      connections: ['liner-001', 'case-001', 'engine-001'],
      status: 'active'
    },
    {
      id: 'turbine-001',
      name: '涡轮组件',
      type: 'component',
      x: 600,
      y: 200,
      connections: ['turbine-blade-001', 'disk-001', 'engine-001'],
      status: 'active'
    },
    {
      id: 'blade-001',
      name: '低压叶片',
      type: 'part',
      x: 100,
      y: 100,
      connections: ['compressor-001'],
      status: 'active'
    },
    {
      id: 'blade-002',
      name: '高压叶片',
      type: 'part',
      x: 100,
      y: 300,
      connections: ['compressor-001'],
      status: 'broken'
    },
    {
      id: 'liner-001',
      name: '燃烧室内胆',
      type: 'part',
      x: 300,
      y: 50,
      connections: ['combustor-001'],
      status: 'active'
    },
    {
      id: 'case-001',
      name: '燃烧室外壳',
      type: 'part',
      x: 500,
      y: 50,
      connections: ['combustor-001'],
      status: 'active'
    },
    {
      id: 'turbine-blade-001',
      name: '涡轮叶片',
      type: 'part',
      x: 700,
      y: 100,
      connections: ['turbine-001'],
      status: 'active'
    },
    {
      id: 'disk-001',
      name: '涡轮盘',
      type: 'part',
      x: 700,
      y: 300,
      connections: ['turbine-001'],
      status: 'inactive'
    }
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawGraph = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制连接线
      nodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const targetNode = nodes.find(n => n.id === connectionId);
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            
            if (node.status === 'broken' || targetNode.status === 'broken') {
              ctx.strokeStyle = '#EF4444';
              ctx.setLineDash([5, 5]);
            } else {
              ctx.strokeStyle = '#9CA3AF';
              ctx.setLineDash([]);
            }
            
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });

      // 绘制节点
      nodes.forEach(node => {
        const isSelected = selectedNode === node.id;
        const radius = isSelected ? 30 : 25;

        // 节点背景
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        
        switch (node.type) {
          case 'assembly':
            ctx.fillStyle = isSelected ? '#1D4ED8' : '#3B82F6';
            break;
          case 'component':
            ctx.fillStyle = isSelected ? '#059669' : '#10B981';
            break;
          case 'part':
            ctx.fillStyle = isSelected ? '#7C2D12' : '#F59E0B';
            break;
          default:
            ctx.fillStyle = '#6B7280';
        }
        
        if (node.status === 'broken') {
          ctx.fillStyle = '#EF4444';
        } else if (node.status === 'inactive') {
          ctx.fillStyle = '#9CA3AF';
        }
        
        ctx.fill();

        // 节点边框
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? '#1E40AF' : '#FFFFFF';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // 状态指示器
        if (node.status === 'broken') {
          ctx.beginPath();
          ctx.arc(node.x + 15, node.y - 15, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#DC2626';
          ctx.fill();
        }
      });
    };

    drawGraph();
  }, [nodes, selectedNode]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检查点击的节点
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 25;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
    } else {
      setSelectedNode(null);
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'assembly': return 'ri-stack-line';
      case 'component': return 'ri-puzzle-line';
      case 'part': return 'ri-tools-line';
      default: return 'ri-circle-line';
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'assembly': return 'text-blue-600';
      case 'component': return 'text-green-600';
      case 'part': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="h-full bg-white flex">
      {/* 左侧控制面板 */}
      <div className="w-80 border-r border-gray-200 bg-gray-50/50">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">关系图谱</h2>
          
          {/* 视图控制 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">视图模式</h3>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'full', name: '完整视图' },
                { id: 'tree', name: '树形视图' },
                { id: 'circle', name: '环形视图' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === mode.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </div>

          {/* 过滤器 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">节点类型</h3>
            <div className="space-y-2">
              {[
                { id: 'all', name: '全部', count: nodes.length },
                { id: 'assembly', name: '总成', count: nodes.filter(n => n.type === 'assembly').length },
                { id: 'component', name: '组件', count: nodes.filter(n => n.type === 'component').length },
                { id: 'part', name: '零件', count: nodes.filter(n => n.type === 'part').length }
              ].map((filter) => (
                <label key={filter.id} className="flex items-center">
                  <input
                    type="radio"
                    name="filter"
                    value={filter.id}
                    checked={filterType === filter.id}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {filter.name} ({filter.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">图例</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">总成</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">组件</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">零件</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">断链</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">非活跃</span>
              </div>
            </div>
          </div>

          {/* 节点详情 */}
          {selectedNodeData && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">节点详情</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <i className={`${getNodeTypeIcon(selectedNodeData.type)} ${getNodeTypeColor(selectedNodeData.type)}`}></i>
                  <span className="text-sm font-medium">{selectedNodeData.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  ID: {selectedNodeData.id}
                </div>
                <div className="text-sm text-gray-600">
                  类型: {selectedNodeData.type === 'assembly' ? '总成' : 
                        selectedNodeData.type === 'component' ? '组件' : '零件'}
                </div>
                <div className="text-sm text-gray-600">
                  连接数: {selectedNodeData.connections.length}
                </div>
                <div className="text-sm">
                  状态: <span className={`font-medium ${
                    selectedNodeData.status === 'active' ? 'text-green-600' :
                    selectedNodeData.status === 'broken' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedNodeData.status === 'active' ? '活跃' : 
                     selectedNodeData.status === 'broken' ? '断链' : '非活跃'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  查看详情
                </button>
                <button className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  展开连接
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧图谱画布 */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded" title="放大">
              <i className="ri-zoom-in-line"></i>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="缩小">
              <i className="ri-zoom-out-line"></i>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="重置视图">
              <i className="ri-refresh-line"></i>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="全屏">
              <i className="ri-fullscreen-line"></i>
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ backgroundColor: '#FAFAFA' }}
        />

        {/* 底部状态栏 */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>节点: {nodes.length}</span>
            <span>连接: {nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2}</span>
            <span>断链: {nodes.filter(n => n.status === 'broken').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}