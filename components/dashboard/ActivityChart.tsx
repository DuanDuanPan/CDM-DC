
'use client';

import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function ActivityChart() {
  const data = [
    { name: '1月', 入库: 320, 活跃: 180, 闭环: 240 },
    { name: '2月', 入库: 420, 活跃: 220, 闭环: 280 },
    { name: '3月', 入库: 380, 活跃: 200, 闭环: 320 },
    { name: '4月', 入库: 480, 活跃: 280, 闭环: 360 },
    { name: '5月', 入库: 520, 活跃: 320, 闭环: 420 },
    { name: '6月', 入库: 580, 活跃: 380, 闭环: 480 },
    { name: '7月', 入库: 620, 活跃: 420, 闭环: 520 },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">活动趋势</h3>
          <p className="text-sm text-gray-600">数据入库、用户活跃与项目闭环情况</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">入库</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">活跃</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-sm text-gray-600">闭环</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Area 
              type="monotone" 
              dataKey="入库" 
              stackId="1"
              stroke="#3b82f6" 
              fill="url(#blueGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="活跃" 
              stackId="1"
              stroke="#10b981" 
              fill="url(#greenGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="闭环" 
              stackId="1"
              stroke="#6366f1" 
              fill="url(#indigoGradient)"
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
