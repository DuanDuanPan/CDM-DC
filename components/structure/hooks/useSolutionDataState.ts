import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_INPUT_DATA } from '../data/inputData';
import { DEFAULT_OUTPUT_DATA } from '../data/outputData';
import type { InputData, OutputData } from '../types';

export type InputFormState = {
  name: string;
  type: 'parameter' | 'file';
  value: string;
  unit: string;
  category: 'design' | 'performance' | 'material' | 'geometry';
  source: 'manual' | 'calculation' | 'simulation' | 'test';
  fileType: 'cad' | 'document' | 'simulation' | 'test_data' | 'image';
};

export type OutputFormState = {
  name: string;
  category: OutputData['category'];
  type: OutputData['type'];
  format: string;
  description: string;
};

export function useSolutionDataState() {
  const inputFormDefaults: InputFormState = useMemo(
    () => ({
      name: '',
      type: 'parameter',
      value: '',
      unit: '',
      category: 'design',
      source: 'manual',
      fileType: 'document',
    }),
    [],
  );

  const [showInputDataForm, setShowInputDataForm] = useState(false);
  const [newInputData, setNewInputData] = useState<InputFormState>(inputFormDefaults);
  const [inputDataList, setInputDataList] = useState<InputData[]>(() =>
    DEFAULT_INPUT_DATA.map((item) => ({ ...item })),
  );

  const handleAddInputData = useCallback(() => {
    if (!newInputData.name) return;

    const inputData: InputData = {
      id: `INPUT-${Date.now()}`,
      name: newInputData.name,
      type: newInputData.type,
      lastUpdated: new Date().toLocaleString('zh-CN'),
      updatedBy: '当前用户',
    };

    if (newInputData.type === 'parameter') {
      inputData.value = newInputData.value;
      inputData.unit = newInputData.unit;
      inputData.category = newInputData.category;
      inputData.source = newInputData.source;
    } else {
      inputData.fileType = newInputData.fileType;
      inputData.size = '1.0 MB';
      inputData.version = 'v1.0';
      inputData.status = 'active';
    }

    setInputDataList((prev) => [...prev, inputData]);
    setNewInputData({ ...inputFormDefaults });
    setShowInputDataForm(false);
  }, [inputFormDefaults, newInputData]);

  const handleDeleteInputData = useCallback((id: string) => {
    setInputDataList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getCategoryLabel = useCallback((category: string) => {
    switch (category) {
      case 'design':
        return '设计参数';
      case 'performance':
        return '性能参数';
      case 'material':
        return '材料参数';
      case 'geometry':
        return '几何参数';
      default:
        return '其他参数';
    }
  }, []);

  const getSourceLabel = useCallback((source: string) => {
    switch (source) {
      case 'manual':
        return '手动输入';
      case 'calculation':
        return '计算得出';
      case 'simulation':
        return '仿真结果';
      case 'test':
        return '试验数据';
      default:
        return '其他来源';
    }
  }, []);

  const getFileTypeInfo = useCallback((type: string) => {
    switch (type) {
      case 'cad':
        return { label: 'CAD模型', icon: 'ri-cube-line', color: 'text-blue-600 bg-blue-100' };
      case 'document':
        return { label: '文档', icon: 'ri-file-text-line', color: 'text-green-600 bg-green-100' };
      case 'simulation':
        return { label: '仿真文件', icon: 'ri-computer-line', color: 'text-purple-600 bg-purple-100' };
      case 'test_data':
        return { label: '试验数据', icon: 'ri-test-tube-line', color: 'text-orange-600 bg-orange-100' };
      case 'image':
        return { label: '图片', icon: 'ri-image-line', color: 'text-pink-600 bg-pink-100' };
      default:
        return { label: '其他', icon: 'ri-file-line', color: 'text-gray-600 bg-gray-100' };
    }
  }, []);

  const outputDataFormDefaults: OutputFormState = useMemo(
    () => ({
      name: '',
      category: 'scheme_doc',
      type: 'document',
      format: '',
      description: '',
    }),
    [],
  );

  const [showOutputDataForm, setShowOutputDataForm] = useState(false);
  const [newOutputData, setNewOutputData] = useState<OutputFormState>(outputDataFormDefaults);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOutputItem, setSelectedOutputItem] = useState<OutputData | null>(null);
  const [outputDataList, setOutputDataList] = useState<OutputData[]>(() =>
    DEFAULT_OUTPUT_DATA.map((item) => ({ ...item })),
  );

  const handleAddOutputData = useCallback(() => {
    if (!newOutputData.name.trim()) {
      return;
    }

    const timestamp = new Date();
    const formatted = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(
      timestamp.getDate(),
    ).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;

    const outputItem: OutputData = {
      id: `OUT-${Date.now()}`,
      name: newOutputData.name.trim(),
      category: newOutputData.category,
      type: newOutputData.type,
      format: newOutputData.format || '待定',
      status: 'draft',
      completeness: 0,
      version: 'v1.0',
      lastUpdated: formatted,
      updatedBy: '系统生成',
      description: newOutputData.description || '新建输出项，待完善详细内容。',
    };

    setOutputDataList((prev) => [outputItem, ...prev]);
    setNewOutputData({ ...outputDataFormDefaults });
    setShowOutputDataForm(false);
  }, [newOutputData, outputDataFormDefaults]);

  const handleDeleteOutputData = useCallback((id: string) => {
    setOutputDataList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleDependencyClick = useCallback((item: OutputData) => {
    setSelectedOutputItem(item);
    setShowDependencyModal(true);
  }, []);

  const handleDeliverableClick = useCallback((item: OutputData) => {
    setSelectedOutputItem(item);
    setShowDeliverableModal(true);
  }, []);

  const handlePreviewClick = useCallback((item: OutputData) => {
    setSelectedOutputItem(item);
    setShowPreviewModal(true);
  }, []);

  return {
    showInputDataForm,
    setShowInputDataForm,
    newInputData,
    setNewInputData,
    inputDataList,
    handleAddInputData,
    handleDeleteInputData,
    getCategoryLabel,
    getSourceLabel,
    getFileTypeInfo,
    showOutputDataForm,
    setShowOutputDataForm,
    newOutputData,
    setNewOutputData,
    showDependencyModal,
    setShowDependencyModal,
    showDeliverableModal,
    setShowDeliverableModal,
    showPreviewModal,
    setShowPreviewModal,
    selectedOutputItem,
    outputDataList,
    handleAddOutputData,
    handleDeleteOutputData,
    handleDependencyClick,
    handleDeliverableClick,
    handlePreviewClick,
  };
}
