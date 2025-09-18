
'use client';

export default function ProjectHealth() {
  const healthMetrics = [
    {
      name: '数据完整性',
      score: 92,
      status: 'excellent',
      issues: 3
    },
    {
      name: '版本一致性',
      score: 78,
      status: 'good',
      issues: 8
    },
    {
      name: '协作活跃度',
      score: 88,
      status: 'excellent',
      issues: 2
    },
    {
      name: '审核及时性',
      score: 65,
      status: 'warning',
      issues: 12
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return 'ri-check-line';
      case 'good': return 'ri-thumb-up-line';
      case 'warning': return 'ri-error-warning-line';
      default: return 'ri-information-line';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">项目健康度</h3>
        <p className="text-sm text-gray-600">关键指标监控与风险预警</p>
      </div>

      <div className="space-y-4">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(metric.status)}`}>
                  <i className={`${getStatusIcon(metric.status)} text-xs`}></i>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{metric.score}%</span>
                <span className="text-xs text-gray-500">{metric.issues}个问题</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metric.status === 'excellent' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  metric.status === 'good' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}
                style={{ width: `${metric.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">总体评分</span>
          <span className="text-xl font-bold text-gray-900">81%</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          基于数据质量、协作效率和流程规范性的综合评估
        </div>
      </div>
    </div>
  );
}
