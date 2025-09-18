
'use client';

export default function StatsGrid() {
  const stats = [
    {
      title: '数据入库',
      value: '12,543',
      change: '+8.2%',
      changeType: 'increase',
      icon: 'ri-database-2-line',
      color: 'blue'
    },
    {
      title: '活跃用户',
      value: '284',
      change: '+12.5%',
      changeType: 'increase',
      icon: 'ri-user-line',
      color: 'green'
    },
    {
      title: '闭环项目',
      value: '96%',
      change: '+2.1%',
      changeType: 'increase',
      icon: 'ri-checkbox-circle-line',
      color: 'indigo'
    },
    {
      title: '基线健康度',
      value: '89%',
      change: '-1.3%',
      changeType: 'decrease',
      icon: 'ri-heart-pulse-line',
      color: 'orange'
    },
    {
      title: '成套性缺口',
      value: '47',
      change: '-15.7%',
      changeType: 'decrease',
      icon: 'ri-alert-line',
      color: 'red'
    },
    {
      title: '版本管理',
      value: '1,847',
      change: '+5.9%',
      changeType: 'increase',
      icon: 'ri-git-branch-line',
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <i className={`${
                    stat.changeType === 'increase' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'
                  } mr-1`}></i>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs 上月</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
              stat.color === 'green' ? 'from-green-500 to-green-600' :
              stat.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
              stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
              stat.color === 'red' ? 'from-red-500 to-red-600' :
              'from-purple-500 to-purple-600'
            } shadow-lg`}>
              <i className={`${stat.icon} text-white text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
