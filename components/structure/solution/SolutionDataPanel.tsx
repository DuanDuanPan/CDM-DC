import type { Dispatch, SetStateAction } from 'react';
import type { BomNode, InputData, OutputData } from '../types';
import type { InputFormState, OutputFormState } from '../hooks/useSolutionDataState';

type SolutionDataPanelProps = {
  selectedNode: string | null;
  bomStructureData: BomNode[];
  findNodeById: (id: string, nodes: BomNode[]) => BomNode | null;
  inputDataList: InputData[];
  showInputDataForm: boolean;
  setShowInputDataForm: Dispatch<SetStateAction<boolean>>;
  newInputData: InputFormState;
  setNewInputData: Dispatch<SetStateAction<InputFormState>>;
  handleAddInputData: () => void;
  handleDeleteInputData: (id: string) => void;
  getCategoryLabel: (category: string) => string;
  getSourceLabel: (source: string) => string;
  getFileTypeInfo: (type: string) => { label: string; icon: string; color: string };
  outputDataList: OutputData[];
  showOutputDataForm: boolean;
  setShowOutputDataForm: Dispatch<SetStateAction<boolean>>;
  newOutputData: OutputFormState;
  setNewOutputData: Dispatch<SetStateAction<OutputFormState>>;
  handleAddOutputData: () => void;
  handleDeleteOutputData: (id: string) => void;
  showDependencyModal: boolean;
  setShowDependencyModal: Dispatch<SetStateAction<boolean>>;
  showDeliverableModal: boolean;
  setShowDeliverableModal: Dispatch<SetStateAction<boolean>>;
  showPreviewModal: boolean;
  setShowPreviewModal: Dispatch<SetStateAction<boolean>>;
  selectedOutputItem: OutputData | null;
  handleDependencyClick: (item: OutputData) => void;
  handleDeliverableClick: (item: OutputData) => void;
  handlePreviewClick: (item: OutputData) => void;
};

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  scheme_doc: { label: '方案文档', icon: 'ri-file-text-line', color: 'bg-blue-100 text-blue-700' },
  condition_lib: { label: '工况库', icon: 'ri-database-2-line', color: 'bg-indigo-100 text-indigo-700' },
  performance_budget: { label: '性能预算', icon: 'ri-bar-chart-2-line', color: 'bg-green-100 text-green-700' },
  power_balance: { label: '功率平衡', icon: 'ri-flashlight-line', color: 'bg-amber-100 text-amber-700' },
  control_sequence: { label: '控制序列', icon: 'ri-settings-5-line', color: 'bg-purple-100 text-purple-700' },
  vv_plan: { label: '验证计划', icon: 'ri-calendar-check-line', color: 'bg-teal-100 text-teal-700' },
  risk_reliability: { label: '风险与可靠性', icon: 'ri-health-book-line', color: 'bg-rose-100 text-rose-700' },
  icd_xbom: { label: '跨域接口', icon: 'ri-git-branch-line', color: 'bg-gray-100 text-gray-700' },
  baseline_strategy: { label: '基线策略', icon: 'ri-guide-line', color: 'bg-orange-100 text-orange-700' },
};

const STATUS_META: Record<string, { label: string; tone: string }> = {
  draft: { label: '草稿', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
  review: { label: '评审中', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: '已批准', tone: 'bg-green-50 text-green-700 border-green-200' },
  baseline: { label: '基线', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const TYPE_ICON: Record<OutputData['type'], string> = {
  document: 'ri-file-text-line',
  model: 'ri-cube-line',
  data: 'ri-database-2-line',
  chart: 'ri-line-chart-line',
  table: 'ri-table-line',
  plan: 'ri-calendar-check-line',
  matrix: 'ri-grid-line',
};

export function SolutionDataPanel(props: SolutionDataPanelProps) {
  const {
    selectedNode,
    bomStructureData,
    findNodeById,
    inputDataList,
    showInputDataForm,
    setShowInputDataForm,
    newInputData,
    setNewInputData,
    handleAddInputData,
    handleDeleteInputData,
    getCategoryLabel,
    getSourceLabel,
    getFileTypeInfo,
    outputDataList,
    showOutputDataForm,
    setShowOutputDataForm,
    newOutputData,
    setNewOutputData,
    handleAddOutputData,
    handleDeleteOutputData,
    showDependencyModal,
    setShowDependencyModal,
    showDeliverableModal,
    setShowDeliverableModal,
    showPreviewModal,
    setShowPreviewModal,
    selectedOutputItem,
    handleDependencyClick,
    handleDeliverableClick,
    handlePreviewClick,
  } = props;

  const currentNode = selectedNode ? findNodeById(selectedNode, bomStructureData) : null;

  const renderInputSection = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center text-gray-500">
          <i className="ri-database-line text-4xl mb-2"></i>
          <p>请选择方案BOM节点查看输入数据</p>
        </div>
      );
    }

    const parameters = inputDataList.filter((item) => item.type === 'parameter');
    const files = inputDataList.filter((item) => item.type === 'file');

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">输入数据管理</h3>
            {currentNode && (
              <p className="text-sm text-gray-600 mt-1">
                {currentNode.name} - {currentNode.id}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">参数: {parameters.length} 个</span>
              <span className="text-sm text-gray-500">文件: {files.length} 个</span>
              <span className="text-sm text-gray-500">总计: {inputDataList.length} 条</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInputDataForm(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            添加数据
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <i className="ri-database-line text-blue-600"></i>
              <h4 className="font-medium text-gray-900">输入数据列表</h4>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {inputDataList.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <i className="ri-database-line text-3xl mb-2"></i>
                <p>暂无输入数据</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {inputDataList.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center ${
                            item.type === 'parameter'
                              ? 'bg-blue-100 text-blue-600'
                              : getFileTypeInfo(item.fileType || '').color
                          }`}
                        >
                          <i
                            className={`${
                              item.type === 'parameter'
                                ? 'ri-settings-3-line'
                                : getFileTypeInfo(item.fileType || '').icon
                            } text-sm`}
                          ></i>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                item.type === 'parameter' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {item.type === 'parameter' ? '参数' : '文件'}
                            </span>
                          </div>

                          {item.type === 'parameter' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4">
                                <span className="text-lg font-semibold text-gray-900">
                                  {item.value} {item.unit}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    item.category === 'performance'
                                      ? 'bg-blue-100 text-blue-700'
                                      : item.category === 'geometry'
                                      ? 'bg-green-100 text-green-700'
                                      : item.category === 'material'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {getCategoryLabel(item.category || '')}
                                </span>
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                                  {getSourceLabel(item.source || '')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                最近更新：{item.lastUpdated} · {item.updatedBy}
                              </div>
                            </div>
                          )}

                          {item.type === 'file' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                              <div>文件类型：{getFileTypeInfo(item.fileType || '').label}</div>
                              {item.size ? <div>文件大小：{item.size}</div> : null}
                              {item.version ? <div>版本：{item.version}</div> : null}
                              <div className="col-span-2 md:col-span-3 text-xs text-gray-500">
                                最近更新：{item.lastUpdated} · {item.updatedBy}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteInputData(item.id)}
                        className="text-sm text-gray-500 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showInputDataForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">添加输入数据</h3>
                <p className="text-sm text-gray-500 mt-1">支持参数与文件两类输入，信息将关联到当前方案节点</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      checked={newInputData.type === 'parameter'}
                      onChange={(e) =>
                        setNewInputData((prev) => ({ ...prev, type: e.target.value as 'parameter' | 'file' }))
                      }
                      value="parameter"
                    />
                    <span className="ml-2 text-sm text-gray-700">参数</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      checked={newInputData.type === 'file'}
                      onChange={(e) =>
                        setNewInputData((prev) => ({ ...prev, type: e.target.value as 'parameter' | 'file' }))
                      }
                      value="file"
                    />
                    <span className="ml-2 text-sm text-gray-700">文件</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {newInputData.type === 'parameter' ? '参数名称' : '文件名称'}
                    </label>
                    <input
                      type="text"
                      value={newInputData.name}
                      onChange={(e) => setNewInputData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={newInputData.type === 'parameter' ? '请输入参数名称' : '请输入文件名称'}
                    />
                  </div>

                  {newInputData.type === 'parameter' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">参数数值</label>
                        <input
                          type="text"
                          value={newInputData.value}
                          onChange={(e) => setNewInputData((prev) => ({ ...prev, value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="数值"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                        <input
                          type="text"
                          value={newInputData.unit}
                          onChange={(e) => setNewInputData((prev) => ({ ...prev, unit: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="单位"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">参数类别</label>
                        <select
                          value={newInputData.category}
                          onChange={(e) =>
                            setNewInputData((prev) => ({ ...prev, category: e.target.value as InputFormState['category'] }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                        >
                          <option value="design">设计参数</option>
                          <option value="performance">性能参数</option>
                          <option value="material">材料参数</option>
                          <option value="geometry">几何参数</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">数据来源</label>
                        <select
                          value={newInputData.source}
                          onChange={(e) =>
                            setNewInputData((prev) => ({ ...prev, source: e.target.value as InputFormState['source'] }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                        >
                          <option value="manual">手动输入</option>
                          <option value="calculation">计算得出</option>
                          <option value="simulation">仿真结果</option>
                          <option value="test">试验数据</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {newInputData.type === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">文件类型</label>
                      <select
                        value={newInputData.fileType}
                        onChange={(e) =>
                          setNewInputData((prev) => ({ ...prev, fileType: e.target.value as InputFormState['fileType'] }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                      >
                        <option value="document">文档</option>
                        <option value="cad">CAD模型</option>
                        <option value="simulation">仿真文件</option>
                        <option value="test_data">试验数据</option>
                        <option value="image">图片</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowInputDataForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAddInputData}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  添加{newInputData.type === 'parameter' ? '参数' : '文件'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCategoryInfo = (category: string) => CATEGORY_META[category] ?? CATEGORY_META.scheme_doc;

  const getStatusTone = (status: string) => STATUS_META[status]?.tone ?? STATUS_META.draft.tone;

  const getStatusLabel = (status: string) => STATUS_META[status]?.label ?? '草稿';

  const renderOutputSection = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center text-gray-500">
          <i className="ri-file-list-3-line text-4xl mb-2"></i>
          <p>请选择方案BOM节点查看输出数据</p>
        </div>
      );
    }

    const groupedOutputData = outputDataList.reduce<Record<string, OutputData[]>>((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});

    const average = (items: OutputData[]) =>
      Math.round(items.reduce((sum, item) => sum + item.completeness, 0) / Math.max(items.length, 1));

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">输出数据管理</h3>
            {currentNode && (
              <p className="text-sm text-gray-600 mt-1">
                {currentNode.name} - {currentNode.id}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">总计: {outputDataList.length} 项输出</span>
              <span className="text-sm text-gray-500">
                平均完整度:
                {outputDataList.length
                  ? Math.round(
                      outputDataList.reduce((sum, item) => sum + item.completeness, 0) / outputDataList.length,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOutputDataForm(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            添加输出项
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedOutputData).map(([category, items]) => {
            const categoryInfo = getCategoryInfo(category);
            const completeness = average(items);

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryInfo.color}`}>
                        <i className={`${categoryInfo.icon} text-sm`}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{categoryInfo.label}</h4>
                        <p className="text-sm text-gray-500">
                          {items.length} 项输出 • 平均完整度 {completeness}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{completeness}%</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className={`${TYPE_ICON[item.type]} text-gray-600`}></i>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusTone(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                              <span className="text-xs text-gray-500">{item.version}</span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-sm text-gray-500">完整度:</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-blue-600 rounded-full"
                                  style={{ width: `${item.completeness}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{item.completeness}%</span>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <span>最近更新：{item.lastUpdated}</span>
                              {item.updatedBy ? <span>负责人：{item.updatedBy}</span> : null}
                              {item.dependencies?.length ? <span>依赖：{item.dependencies.length} 项</span> : null}
                              {item.deliverables?.length ? <span>交付物：{item.deliverables.length} 项</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDependencyClick(item)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            依赖
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeliverableClick(item)}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            交付物
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreviewClick(item)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            预览
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOutputData(item.id)}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showOutputDataForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">添加输出项</h3>
                <p className="text-sm text-gray-500 mt-1">支持文档、模型、数据等多类型输出</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">输出项名称</label>
                    <input
                      type="text"
                      value={newOutputData.name}
                      onChange={(e) => setNewOutputData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入输出项名称"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">输出类别</label>
                      <select
                        value={newOutputData.category}
                        onChange={(e) =>
                          setNewOutputData((prev) => ({ ...prev, category: e.target.value as OutputData['category'] }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="scheme_doc">方案文档</option>
                        <option value="condition_lib">工况库</option>
                        <option value="performance_budget">性能预算</option>
                        <option value="power_balance">功率平衡</option>
                        <option value="control_sequence">控制序列</option>
                        <option value="vv_plan">验证计划</option>
                        <option value="risk_reliability">风险与可靠性</option>
                        <option value="icd_xbom">跨域接口</option>
                        <option value="baseline_strategy">基线策略</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">输出类型</label>
                      <select
                        value={newOutputData.type}
                        onChange={(e) =>
                          setNewOutputData((prev) => ({ ...prev, type: e.target.value as OutputData['type'] }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="document">文档</option>
                        <option value="model">模型</option>
                        <option value="data">数据</option>
                        <option value="chart">图表</option>
                        <option value="table">表格</option>
                        <option value="plan">计划</option>
                        <option value="matrix">矩阵</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">文件格式</label>
                    <input
                      type="text"
                      value={newOutputData.format}
                      onChange={(e) => setNewOutputData((prev) => ({ ...prev, format: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例如：PDF / glTF / CSV"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">说明</label>
                    <textarea
                      rows={4}
                      value={newOutputData.description}
                      onChange={(e) => setNewOutputData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入输出项描述"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowOutputDataForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAddOutputData}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  添加输出项
                </button>
              </div>
            </div>
          </div>
        )}

        {showDependencyModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">依赖关系 - {selectedOutputItem.name}</h3>
                <button
                  type="button"
                  onClick={() => setShowDependencyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedOutputItem.dependencies && selectedOutputItem.dependencies.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOutputItem.dependencies.map((dep, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="ri-links-line text-blue-600"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{dep}</div>
                            <div className="text-sm text-gray-500">前置依赖项</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">已满足</span>
                          <button type="button" className="text-blue-600 hover:text-blue-800 text-sm">
                            查看详情
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-links-line text-4xl mb-2"></i>
                    <p>暂无依赖项</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDependencyModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                <button type="button" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  添加依赖
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeliverableModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">交付物清单 - {selectedOutputItem.name}</h3>
                <button
                  type="button"
                  onClick={() => setShowDeliverableModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedOutputItem.deliverables && selectedOutputItem.deliverables.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOutputItem.deliverables.map((deliverable, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="ri-checkbox-circle-line text-green-600"></i>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{deliverable}</div>
                              <div className="text-xs text-gray-500">关联输出物</div>
                            </div>
                          </div>
                          <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                            下载
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-archive-line text-4xl mb-2"></i>
                    <p>暂无交付物信息</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDeliverableModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                <button type="button" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  新建交付物
                </button>
              </div>
            </div>
          </div>
        )}

        {showPreviewModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">输出预览 - {selectedOutputItem.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">类型：{getStatusLabel(selectedOutputItem.status)} · 版本：{selectedOutputItem.version}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">输出类别：</span>
                    {getCategoryInfo(selectedOutputItem.category).label}
                  </div>
                  <div>
                    <span className="text-gray-500">输出类型：</span>
                    {TYPE_ICON[selectedOutputItem.type] ? '已配置' : selectedOutputItem.type}
                  </div>
                  <div>
                    <span className="text-gray-500">文件格式：</span>
                    {selectedOutputItem.format || '未指定'}
                  </div>
                  <div>
                    <span className="text-gray-500">最后更新：</span>
                    {selectedOutputItem.lastUpdated}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <h4 className="font-medium text-gray-900 mb-2">输出描述</h4>
                  <p>{selectedOutputItem.description}</p>
                </div>

                {selectedOutputItem.dependencies && selectedOutputItem.dependencies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">关联依赖</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {selectedOutputItem.dependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{dep}</span>
                          <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
                            查看
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOutputItem.deliverables && selectedOutputItem.deliverables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">交付物</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {selectedOutputItem.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{deliverable}</span>
                          <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
                            下载
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderInputSection()}
      {renderOutputSection()}
    </div>
  );
}
