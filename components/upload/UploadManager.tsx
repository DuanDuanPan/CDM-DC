'use client';

import { useState, useCallback } from 'react';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function UploadManager() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return 'ri-image-line';
    if (type.includes('video')) return 'ri-video-line';
    if (type.includes('audio')) return 'ri-music-line';
    if (type.includes('pdf')) return 'ri-file-pdf-line';
    if (type.includes('word')) return 'ri-file-word-line';
    if (type.includes('excel')) return 'ri-file-excel-line';
    if (type.includes('zip')) return 'ri-file-zip-line';
    return 'ri-file-line';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadFile[] = droppedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // 模拟上传过程
    newFiles.forEach(file => {
      simulateUpload(file.id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const simulateUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'uploading' as const } : file
    ));

    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            return { ...file, progress: 100, status: 'completed' as const };
          }
          
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'pending', progress: 0, error: undefined } : file
    ));
    simulateUpload(fileId);
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const uploadingFiles = files.filter(f => f.status === 'uploading').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <div className="h-full bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">上传管理器</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              已完成: <span className="font-medium text-green-600">{completedFiles}</span> |
              上传中: <span className="font-medium text-blue-600">{uploadingFiles}</span> |
              失败: <span className="font-medium text-red-600">{errorFiles}</span>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              批量操作
            </button>
          </div>
        </div>

        {/* 上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="ri-upload-cloud-2-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            拖拽文件到此处上传
          </h3>
          <p className="text-gray-500 mb-4">
            或者 
            <button className="text-blue-600 hover:text-blue-700 font-medium mx-1">
              点击选择文件
            </button>
          </p>
          <p className="text-sm text-gray-400">
            支持 CAD模型、仿真结果、测试数据、技术文档等格式，单个文件最大10GB
          </p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-medium text-gray-900 mb-4">上传队列</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className={`${getFileIcon(file.type)} text-blue-600`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                              {file.status === 'completed' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <i className="ri-check-line mr-1"></i>
                                  已完成
                                </span>
                              )}
                              {file.status === 'uploading' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <i className="ri-loader-4-line mr-1 animate-spin"></i>
                                  上传中
                                </span>
                              )}
                              {file.status === 'error' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <i className="ri-error-warning-line mr-1"></i>
                                  失败
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {file.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {file.status === 'uploading' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(file.progress)}% 已完成
                            </p>
                          )}
                          
                          {file.error && (
                            <p className="text-xs text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {file.status === 'error' && (
                          <button
                            onClick={() => retryUpload(file.id)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                            title="重试上传"
                          >
                            <i className="ri-refresh-line"></i>
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="移除文件"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {files.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    总计 {files.length} 个文件，共 {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFiles([])}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      清空队列
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                      全部开始
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 最近上传 */}
        <div className="mt-8">
          <h3 className="text-base font-medium text-gray-900 mb-4">最近上传</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { name: '发动机总装模型_V3.step', size: '245 MB', time: '2024-01-20 14:32', status: 'completed' },
                  { name: '温度场仿真结果.dat', size: '1.2 GB', time: '2024-01-20 11:15', status: 'completed' },
                  { name: '性能测试报告.pdf', size: '89 MB', time: '2024-01-19 16:45', status: 'completed' }
                ].map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="ri-file-line text-blue-600 text-sm"></i>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        已完成
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">查看</button>
                      <button className="text-gray-600 hover:text-gray-900">下载</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}