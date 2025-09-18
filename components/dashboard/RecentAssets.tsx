
'use client';

export default function RecentAssets() {
  const assets = [
    {
      name: '发动机总装图纸',
      type: 'CAD模型',
      version: 'v2.3.1',
      author: '李工程师',
      time: '2小时前',
      status: 'active',
      icon: 'ri-file-3d-line',
      color: 'blue'
    },
    {
      name: '燃烧室试验数据',
      type: '试验报告',
      version: 'v1.8.0',
      author: '王研究员',
      time: '4小时前',
      status: 'review',
      icon: 'ri-test-tube-line',
      color: 'green'
    },
    {
      name: '叶片材料规范',
      type: '工艺文档',
      version: 'v3.1.2',
      author: '张专家',
      time: '6小时前',
      status: 'approved',
      icon: 'ri-file-text-line',
      color: 'indigo'
    },
    {
      name: '推力性能仿真',
      type: '仿真分析',
      version: 'v2.0.5',
      author: '陈分析师',
      time: '8小时前',
      status: 'active',
      icon: 'ri-line-chart-line',
      color: 'purple'
    },
    {
      name: '装配工艺指导',
      type: '操作手册',
      version: 'v1.5.3',
      author: '刘技师',
      time: '1天前',
      status: 'draft',
      icon: 'ri-tools-line',
      color: 'orange'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-blue-100 text-blue-700 border-blue-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    const labels = {
      active: '活跃',
      review: '审核中',
      approved: '已批准',
      draft: '草稿'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">最近资产</h3>
          <p className="text-sm text-gray-600">最新更新的数据和文档</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
          查看全部 <i className="ri-arrow-right-line ml-1"></i>
        </button>
      </div>

      <div className="space-y-4">
        {assets.map((asset, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50/60 transition-colors cursor-pointer">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${
              asset.color === 'blue' ? 'from-blue-500 to-blue-600' :
              asset.color === 'green' ? 'from-green-500 to-green-600' :
              asset.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
              asset.color === 'purple' ? 'from-purple-500 to-purple-600' :
              'from-orange-500 to-orange-600'
            }`}>
              <i className={`${asset.icon} text-white`}></i>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{asset.name}</h4>
                {getStatusBadge(asset.status)}
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-500">{asset.type}</span>
                <span className="text-xs text-gray-500">{asset.version}</span>
                <span className="text-xs text-gray-500">{asset.author}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500">{asset.time}</span>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
                <i className="ri-more-line text-gray-400"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
