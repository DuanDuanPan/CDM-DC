'use client';

import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'zh-CN',
    autoSave: true,
    notifications: true,
    dataRetention: '90',
    backupFrequency: 'daily'
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full bg-white">
      <div className="flex h-full">
        {/* 左侧设置导航 */}
        <div className="w-64 border-r border-gray-200 bg-gray-50/50">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">设置</h2>
            
            <nav className="space-y-1">
              {[
                { id: 'general', name: '常规设置', icon: 'ri-settings-3-line' },
                { id: 'data', name: '数据管理', icon: 'ri-database-2-line' },
                { id: 'security', name: '安全设置', icon: 'ri-shield-check-line' },
                { id: 'backup', name: '备份恢复', icon: 'ri-save-line' },
                { id: 'users', name: '用户管理', icon: 'ri-user-settings-line' },
                { id: 'integration', name: '系统集成', icon: 'ri-links-line' },
                { id: 'about', name: '关于系统', icon: 'ri-information-line' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 右侧设置内容 */}
        <div className="flex-1 p-6">
          {activeTab === 'general' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">常规设置</h3>
              
              <div className="space-y-6">
                {/* 主题设置 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">外观主题</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', name: '浅色模式', preview: 'bg-white border-2' },
                      { id: 'dark', name: '深色模式', preview: 'bg-gray-800 border-2' },
                      { id: 'auto', name: '跟随系统', preview: 'bg-gradient-to-r from-white to-gray-800 border-2' }
                    ].map((theme) => (
                      <label key={theme.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value={theme.id}
                          checked={settings.theme === theme.id}
                          onChange={(e) => updateSetting('theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          settings.theme === theme.id ? 'border-blue-500' : 'border-gray-200'
                        }`}>
                          <div className={`w-12 h-8 mx-auto mb-2 rounded ${theme.preview}`}></div>
                          <span className="text-sm text-gray-700">{theme.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 语言设置 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">界面语言</h4>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="zh-TW">繁体中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                  </select>
                </div>

                {/* 自动保存 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">自动保存</h4>
                      <p className="text-sm text-gray-500">自动保存您的工作进度</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) => updateSetting('autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* 通知设置 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">桌面通知</h4>
                      <p className="text-sm text-gray-500">接收系统通知和提醒</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => updateSetting('notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">数据管理</h3>
              
              <div className="space-y-6">
                {/* 数据保留期 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">数据保留期</h4>
                  <select
                    value={settings.dataRetention}
                    onChange={(e) => updateSetting('dataRetention', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="30">30天</option>
                    <option value="90">90天</option>
                    <option value="180">180天</option>
                    <option value="365">1年</option>
                    <option value="forever">永久保留</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    超过保留期的数据将被自动清理
                  </p>
                </div>

                {/* 存储统计 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">存储使用情况</h4>
                  <div className="space-y-3">
                    {[
                      { type: 'CAD模型', used: '2.4 GB', total: '10 GB', percentage: 24 },
                      { type: '仿真数据', used: '5.8 GB', total: '20 GB', percentage: 29 },
                      { type: '文档资料', used: '892 MB', total: '5 GB', percentage: 17 },
                      { type: '其他文件', used: '1.2 GB', total: '5 GB', percentage: 24 }
                    ].map((item) => (
                      <div key={item.type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.type}</span>
                          <span className="text-gray-500">{item.used} / {item.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 清理工具 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">数据清理</h4>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      清理临时文件
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      清理回收站
                    </button>
                    <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm">
                      重置所有数据
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">安全设置</h3>
              
              <div className="space-y-6">
                {/* 访问控制 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">访问控制</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">启用二次验证</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">IP地址限制</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 审计日志 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">审计日志</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>记录所有用户操作和系统事件</p>
                    <button className="text-blue-600 hover:text-blue-800">查看审计日志</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">关于系统</h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <i className="ri-database-2-fill text-white text-2xl"></i>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">产品过程数据中心</h4>
                  <p className="text-gray-600">版本 2.1.0</p>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">构建版本:</span>
                    <span className="text-gray-900">Build 20240120</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">发布日期:</span>
                    <span className="text-gray-900">2024年1月20日</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">技术支持:</span>
                    <span className="text-gray-900">support@company.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">许可证:</span>
                    <span className="text-gray-900">企业版</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      检查更新
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      使用帮助
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}