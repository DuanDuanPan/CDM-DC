
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requirementRoles, requirementRoleInsights } from './data/requirementRoles';
import { requirementsByNode } from './data/requirements';
import RequirementDetailPanel from './RequirementDetailPanel';
import { RequirementRoleKey } from './types';
import PerformanceOverview from './performance/PerformanceOverview';
import StructuralOverview from './structure/StructuralOverview';
import ThermalOverview from './thermal/ThermalOverview';
import ControlOverview from './control/ControlOverview';
import ManufacturingOverview from './manufacturing/ManufacturingOverview';
import VerificationOverview from './verification/VerificationOverview';
import ConfigurationQualityOverview from './quality/ConfigurationQualityOverview';
import CollaborationHub from './collaboration/CollaborationHub';
import SimulationTreePanel from './simulation/SimulationTreePanel';
import SimulationContentPanel from './simulation/SimulationContentPanel';
import SimulationFilePreview from './simulation/SimulationFilePreview';
import SimulationCompareDrawer from './simulation/SimulationCompareDrawer';
import { useSimulationExplorerState, TreeNodeReference } from './simulation/useSimulationExplorerState';
import type { SimulationFile, SimulationFilters } from './simulation/types';
import ProductDefinitionPanel from './definition/ProductDefinitionPanel';
import EbomDetailPanel from './ebom/EbomDetailPanel';
import { EBOM_BASELINES } from './ebom/data';

interface BomNode {
  id: string;
  name: string;
  level: number;
  bomType?: string;
  unitType?: string;
  nodeCategory?: string;
  schemeType?: string;
  // 扩展字段：用于专业视图判定
  subsystemType?: string; // e.g., 'compressor', 'combustor'
  children?: BomNode[];
}

interface BomType {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
}


const mapBomType = (nodes: BomNode[], nextType: string): BomNode[] =>
  nodes.map((node) => ({
    ...node,
    bomType: nextType,
    children: node.children ? mapBomType(node.children, nextType) : undefined
  }));


interface Version {
  id: string;
  name: string;
  date: string;
  author: string;
  description: string;
  status: 'current' | 'baseline' | 'archived';
}

interface InputData {
  id: string;
  name: string;
  type: 'parameter' | 'file';
  // 参数特有字段
  value?: string;
  unit?: string;
  category?: 'design' | 'performance' | 'material' | 'geometry';
  source?: 'manual' | 'calculation' | 'simulation' | 'test';
  // 文件特有字段
  fileType?: 'cad' | 'document' | 'simulation' | 'test_data' | 'image';
  size?: string;
  version?: string;
  status?: 'active' | 'archived' | 'draft';
  // 通用字段
  lastUpdated: string;
  updatedBy: string;
}

interface OutputData {
  id: string;
  name: string;
  category: 'scheme_doc' | 'condition_lib' | 'performance_budget' | 'power_balance' | 'control_sequence' | 'vv_plan' | 'risk_reliability' | 'icd_xbom' | 'baseline_strategy';
  type: 'document' | 'model' | 'data' | 'chart' | 'table' | 'plan' | 'matrix';
  format: string;
  status: 'draft' | 'review' | 'approved' | 'baseline';
  completeness: number; // 完整度百分比
  version: string;
  lastUpdated: string;
  updatedBy: string;
  description: string;
  parameters?: Array<{
    name: string;
    value: string;
    unit: string;
    description: string;
  }>;
  dependencies?: string[]; // 依赖的其他输出项
  deliverables?: string[]; // 交付物清单
}

const VIEW_PREFERENCE_PREFIX = 'product-structure-active-tab';

const REQUIREMENT_BOM_TREE: BomNode[] = [
  {
    id: 'REQ-ENGINE-001',
    name: '航空发动机产品级功能单元',
    level: 0,
    bomType: 'requirement',
    unitType: 'product_functional_unit',
    nodeCategory: 'product',
    children: [
      {
        id: 'REQ-PROPULSION-001',
        name: '推进子系统功能单元',
        level: 1,
        bomType: 'requirement',
        unitType: 'subsystem_functional_unit',
        nodeCategory: 'subsystem',
        children: [
          {
            id: 'REQ-COMPRESSOR-BLADE',
            name: '压气机叶片 (成附件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'component_assembly',
            nodeCategory: 'component'
          },
          {
            id: 'REQ-COMPRESSOR-ROTOR',
            name: '压气机转子 (重要零件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'important_part',
            nodeCategory: 'component'
          },
          {
            id: 'REQ-COMBUSTOR-LINER',
            name: '燃烧室内胆 (成附件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'component_assembly',
            nodeCategory: 'component'
          },
          {
            id: 'REQ-TURBINE-DISK',
            name: '涡轮盘 (重要零件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'important_part',
            nodeCategory: 'component'
          }
        ]
      },
      {
        id: 'REQ-CONTROL-001',
        name: '控制子系统功能单元',
        level: 1,
        bomType: 'requirement',
        unitType: 'subsystem_functional_unit',
        nodeCategory: 'subsystem',
        children: [
          {
            id: 'REQ-FADEC-UNIT',
            name: 'FADEC控制器 (成附件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'component_assembly',
            nodeCategory: 'component'
          },
          {
            id: 'REQ-SENSOR-UNIT',
            name: '传感器组件 (重要零件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'important_part',
            nodeCategory: 'component'
          }
        ]
      },
      {
        id: 'REQ-AUXILIARY-001',
        name: '辅助子系统功能单元',
        level: 1,
        bomType: 'requirement',
        unitType: 'subsystem_functional_unit',
        nodeCategory: 'subsystem',
        children: [
          {
            id: 'REQ-LUBRICATION-UNIT',
            name: '润滑系统组件 (成附件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'component_assembly',
            nodeCategory: 'component'
          },
          {
            id: 'REQ-COOLING-UNIT',
            name: '冷却系统组件 (重要零件)',
            level: 2,
            bomType: 'requirement',
            unitType: 'important_part',
            nodeCategory: 'component'
          }
        ]
      }
    ]
  }
];

type JumpEntry = {
  fromBomType: string;
  fromTab: string;
  fromNodeId: string | null;
  fromExpandedNodes: string[];
  requirementIds: string[];
  sourceNodeId: string | null;
  sourceNodeName?: string | null;
  createdAt: number;
};

const BOM_TYPE_LABELS: Record<string, string> = {
  requirement: '需求 BOM',
  solution: '方案 BOM',
  design: '设计 BOM',
  simulation: '仿真 BOM',
  test: '试验 BOM',
  physical: '实物 BOM',
  process: '工艺视图',
  management: '管理视图',
};

function findNodeById(id: string, nodes: BomNode[]): BomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

const getStoredTabPreference = (bomType: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`${VIEW_PREFERENCE_PREFIX}-${bomType}`);
};

const setStoredTabPreference = (bomType: string, tabId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${VIEW_PREFERENCE_PREFIX}-${bomType}`, tabId);
};

const secondaryActionButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryActionButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

/* Simulation interfaces added */
/* Component */
export default function ProductStructure() {
  const [selectedBomType, setSelectedBomType] = useState('solution');
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['001']);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('system');
  const [selectedRequirementRole, setSelectedRequirementRole] = useState<RequirementRoleKey>('system-team');
  const [selectedVersion, setSelectedVersion] = useState('v2.1');
  const [activeTab, setActiveTab] = useState('structure');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [activePhase, setActivePhase] = useState('concept');
  const [requirementsInView, setRequirementsInView] = useState(false);
  const [jumpHistory, setJumpHistory] = useState<JumpEntry[]>([]);
  const [pendingRequirementFocus, setPendingRequirementFocus] = useState<string | null>(null);
  const [pendingTreeScrollTarget, setPendingTreeScrollTarget] = useState<string | null>(null);
  const [skipNextTabPersistence, setSkipNextTabPersistence] = useState(false);
  const autoTransitionRef = useRef(false);
  const previousBomTypeRef = useRef(selectedBomType);
  const previousActiveTabRef = useRef(activeTab);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const requirementIdToNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(requirementsByNode).forEach(([nodeId, list]) => {
      list.forEach((req) => {
        map.set(req.id, nodeId);
      });
    });
    return map;
  }, []);
  const getRequirementNodeIdForRequirement = useCallback(
    (requirementId: string) => requirementIdToNodeMap.get(requirementId) ?? null,
    [requirementIdToNodeMap]
  );
  const getRequirementNodePath = useCallback((targetId: string | null) => {
    if (!targetId) return null;
    const path: string[] = [];
    const dfs = (nodes: BomNode[], trail: string[]): boolean => {
      for (const node of nodes) {
        const nextTrail = [...trail, node.id];
        if (node.id === targetId) {
          path.push(...nextTrail);
          return true;
        }
        if (node.children && dfs(node.children, nextTrail)) {
          return true;
        }
      }
      return false;
    };
    dfs(REQUIREMENT_BOM_TREE, []);
    return path.length ? path : null;
  }, []);
  const clearJumpHistory = useCallback(() => {
    setJumpHistory((prev) => {
      if (!prev.length) return prev;
      if (typeof window !== 'undefined') {
        console.debug('[ProductStructure] jump stack length: 0');
      }
      return [];
    });
    setPendingRequirementFocus(null);
    setPendingTreeScrollTarget(null);
  }, []);
  
  // 添加缺失的状态变量
  const [showInputDataForm, setShowInputDataForm] = useState(false);
  const [newInputData, setNewInputData] = useState({
    name: '',
    type: 'parameter' as 'parameter' | 'file',
    value: '',
    unit: '',
    category: 'design' as 'design' | 'performance' | 'material' | 'geometry',
    source: 'manual' as 'manual' | 'calculation' | 'simulation' | 'test',
    fileType: 'document' as 'cad' | 'document' | 'simulation' | 'test_data' | 'image'
  });
  
  // 合并的输入数据
  const [inputDataList, setInputDataList] = useState<InputData[]>([
    // 参数数据
    {
      id: 'INPUT-001',
      name: '叶片弦长',
      type: 'parameter',
      value: '85.5',
      unit: 'mm',
      category: 'geometry',
      source: 'manual',
      lastUpdated: '2024-01-15 10:30',
      updatedBy: '张工程师'
    },
    {
      id: 'INPUT-002',
      name: '进口马赫数',
      type: 'parameter',
      value: '0.65',
      unit: '-',
      category: 'performance',
      source: 'calculation',
      lastUpdated: '2024-01-15 09:45',
      updatedBy: '李博士'
    },
    {
      id: 'INPUT-003',
      name: '材料密度',
      type: 'parameter',
      value: '4.43',
      unit: 'g/cm³',
      category: 'material',
      source: 'test',
      lastUpdated: '2024-01-14 16:20',
      updatedBy: '王工程师'
    },
    {
      id: 'INPUT-004',
      name: '工作温度',
      type: 'parameter',
      value: '650',
      unit: '°C',
      category: 'performance',
      source: 'simulation',
      lastUpdated: '2024-01-14 14:15',
      updatedBy: '赵博士'
    },
    {
      id: 'INPUT-005',
      name: '叶片厚度',
      type: 'parameter',
      value: '2.8',
      unit: 'mm',
      category: 'geometry',
      source: 'manual',
      lastUpdated: '2024-01-13 11:00',
      updatedBy: '张工程师'
    },
    // 文件数据
    {
      id: 'INPUT-006',
      name: '压气机叶片三维模型.step',
      type: 'file',
      fileType: 'cad',
      size: '15.2 MB',
      version: 'v2.1',
      status: 'active',
      lastUpdated: '2024-01-15 09:30',
      updatedBy: '张工程师'
    },
    {
      id: 'INPUT-007',
      name: '气动设计计算书.pdf',
      type: 'file',
      fileType: 'document',
      size: '3.8 MB',
      version: 'v1.3',
      status: 'active',
      lastUpdated: '2024-01-14 16:45',
      updatedBy: '李博士'
    },
    {
      id: 'INPUT-008',
      name: 'CFD仿真结果.dat',
      type: 'file',
      fileType: 'simulation',
      size: '125.6 MB',
      version: 'v2.0',
      status: 'active',
      lastUpdated: '2024-01-14 14:20',
      updatedBy: '赵博士'
    },
    {
      id: 'INPUT-009',
      name: '材料试验报告.xlsx',
      type: 'file',
      fileType: 'test_data',
      size: '2.1 MB',
      version: 'v1.0',
      status: 'active',
      lastUpdated: '2024-01-13 10:15',
      updatedBy: '王工程师'
    },
    {
      id: 'INPUT-010',
      name: '叶片截面图.png',
      type: 'file',
      fileType: 'image',
      size: '1.5 MB',
      version: 'v1.1',
      status: 'draft',
      lastUpdated: '2024-01-12 15:30',
      updatedBy: '张工程师'
    }
  ]);

  const [showOutputDataForm, setShowOutputDataForm] = useState(false);
  const outputDataFormDefaults = {
    name: '',
    category: 'scheme_doc' as OutputData['category'],
    type: 'document' as OutputData['type'],
    format: '',
    description: ''
  };
  const [newOutputData, setNewOutputData] = useState(outputDataFormDefaults);

  // 添加新的状态变量
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOutputItem, setSelectedOutputItem] = useState<OutputData | null>(null);

  const {
    state: simulationState,
    dispatch: simulationDispatch,
    category: currentSimulationCategory,
    instance: currentSimulationInstance,
    folder: currentSimulationFolder,
    files: currentSimulationFiles
  } = useSimulationExplorerState();
  const [previewSimulationFile, setPreviewSimulationFile] = useState<SimulationFile | null>(null);
  const [isSimulationNavOpen, setIsSimulationNavOpen] = useState(false);
  const [compareToast, setCompareToast] = useState<{ label: string; type: 'file' | 'instance' } | null>(null);

  useEffect(() => {
    const canShowSimulationNav = activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation');
    if (!canShowSimulationNav) {
      setIsSimulationNavOpen(false);
    }
  }, [activeTab, selectedBomType]);

  useEffect(() => {
    if (!simulationState.lastCompareEvent) return;
    setCompareToast({
      label: simulationState.lastCompareEvent.label,
      type: simulationState.lastCompareEvent.type
    });
    const timer = window.setTimeout(() => setCompareToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [simulationState.lastCompareEvent]);

  useEffect(() => {
    const isSimulationViewActive = activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation');
    if (!isSimulationViewActive) {
      setPreviewSimulationFile(null);
      return;
    }
    const node = simulationState.selectedNode;
    if (node?.type === 'file') {
      const file = currentSimulationFiles.find(f => f.id === node.fileId);
      if (file) {
        setPreviewSimulationFile(file);
        return;
      }
    }
    setPreviewSimulationFile(null);
  }, [activeTab, selectedBomType, simulationState.selectedNode, currentSimulationFiles]);

  // 输出数据状态
  const [outputDataList, setOutputDataList] = useState<OutputData[]>([
    // 方案说明书 & 架构模型
    {
      id: 'OUT-001',
      name: '系统架构模型(SysML)',
      category: 'scheme_doc',
      type: 'model',
      format: 'SysML/Capella',
      status: 'review',
      completeness: 75,
      version: 'v2.1',
      lastUpdated: '2024-01-15 14:30',
      updatedBy: '系统架构师',
      description: '包含Block定义图、内部块图(IBD)、活动图及接口骨架定义',
      parameters: [
        { name: 'Block数量', value: '45', unit: '个', description: '系统功能块总数' },
        { name: 'IBD图数量', value: '12', unit: '个', description: '内部块图数量' },
        { name: '活动图数量', value: '8', unit: '个', description: '关键流程活动图' },
        { name: '接口定义', value: '156', unit: '个', description: '系统接口总数' }
      ],
      dependencies: ['REQ-ENGINE-001'],
      deliverables: ['系统架构模型文件', 'Block定义文档', 'IBD图集', '活动图集', '接口规范']
    },
    {
      id: 'OUT-002',
      name: '方案设计说明书',
      category: 'scheme_doc',
      type: 'document',
      format: 'PDF/Word',
      status: 'draft',
      completeness: 60,
      version: 'v1.8',
      lastUpdated: '2024-01-14 16:20',
      updatedBy: '总体设计师',
      description: '系统总体方案设计说明，包含技术路线、设计理念、关键技术等',
      parameters: [
        { name: '章节数量', value: '12', unit: '章', description: '说明书章节总数' },
        { name: '页数', value: '156', unit: '页', description: '文档总页数' },
        { name: '图表数量', value: '89', unit: '个', description: '插图和表格数量' }
      ],
      deliverables: ['方案说明书正文', '技术附件', '图表集']
    },

    // (rest of output data omitted for brevity, same as original)
  ]);

  const versions: Version[] = [
    { id: 'v2.1', name: 'V2.1', date: '2024-01-15', author: '张工程师', description: '最新版本 - 性能优化', status: 'current' },
    { id: 'v2.0', name: 'V2.0', date: '2024-01-10', author: '李博士', description: '基线版本 - 设计基准', status: 'baseline' },
    { id: 'v1.5', name: 'V1.5', date: '2024-01-05', author: '王总师', description: '归档版本 - 初始设计', status: 'archived' }
  ];

  const solutionOverview = {
    baseline: 'V2.1 - 最新版本',
    owner: '总体设计师 · 张工程师',
    updatedAt: '2024-01-18 09:30',
    compareTo: 'V2.0 基线',
    metrics: [
      { label: '最大推力', value: '120 kN', trend: '+2%', status: 'good' },
      { label: '比冲', value: '320 s', trend: '+1.5%', status: 'good' },
      { label: '燃油消耗率', value: '0.52 kg/kN·h', trend: '-0.8%', status: 'warning' },
      { label: '可靠性 MTBF', value: '1,200 h', trend: '+5%', status: 'good' }
    ],
    risks: [
      { label: '燃油接口压力未确认', level: 'warning' },
      { label: '热负荷验证待完成', level: 'risk' }
    ],
    phases: [
      {
        id: 'concept',
        label: '概念',
        timeline: '2023 Q3',
        status: 'done',
        summary: '完成需求匹配度评估与概念方案审查。',
        highlights: [
          '需求匹配度 85%',
          '关键风险识别 6 项',
          '概念审查通过'
        ]
      },
      {
        id: 'preliminary',
        label: '初样',
        timeline: '2023 Q4',
        status: 'in-progress',
        summary: '聚焦性能迭代与控制律补偿，关键接口基本冻结。',
        highlights: [
          '性能指标达成 78%',
          '接口冻结率 82%',
          '开放风险 5 项'
        ]
      },
      {
        id: 'detailed',
        label: '试样',
        timeline: '2024 Q1',
        status: 'attention',
        summary: '试样件制造排产进入关键窗口，验证闭环推进中。',
        highlights: [
          '制造就绪度 68%',
          '验证闭环率 72%',
          '待审签文档 3 份'
        ]
      },
      {
        id: 'production',
        label: '正样',
        timeline: '2024 Q2',
        status: 'pending',
        summary: '正样阶段准备中，需锁定供应链节奏与质量门通过方案。',
        highlights: [
          '质量门计划 3 项',
          '供应风险监控 4 项',
          '正样装配窗口 待确认'
        ]
      }
    ],
    performance: {
      operatingPoints: [
        {
          id: 'takeoff',
          name: '起飞工况',
          description: '最大推力输出，燃油消耗与推重比校核',
          parameters: {
            thrust: '120 kN',
            specificImpulse: '310 s',
            fuelFlow: '0.65 kg/s',
            pressureRatio: '22.5',
            turbineInletTemp: '1,720 K'
          },
          margins: {
            surgeMargin: 0.18,
            turbineMargin: 0.12,
            thrustMargin: 0.05
          }
        },
        {
          id: 'cruise',
          name: '巡航工况',
          description: '经济性优化，关注耗油与余度',
          parameters: {
            thrust: '70 kN',
            specificImpulse: '330 s',
            fuelFlow: '0.32 kg/s',
            pressureRatio: '19.2',
            turbineInletTemp: '1,520 K'
          },
          margins: {
            surgeMargin: 0.24,
            turbineMargin: 0.18,
            thrustMargin: 0.09
          }
        },
        {
          id: 'loiter',
          name: '待机/盘旋工况',
          description: '低推力模式，关注响应与稳定性',
          parameters: {
            thrust: '45 kN',
            specificImpulse: '340 s',
            fuelFlow: '0.22 kg/s',
            pressureRatio: '17.0',
            turbineInletTemp: '1,380 K'
          },
          margins: {
            surgeMargin: 0.27,
            turbineMargin: 0.21,
            thrustMargin: 0.11
          }
        }
      ],
      assumptions: [
        {
          title: '环境条件',
          detail: '海平面标准大气，ISA+10℃，相对湿度 40%'
        },
        {
          title: '燃料型号',
          detail: '航空煤油 RP-3，流量计校准至 2024-01'
        },
        {
          title: '进气畸变',
          detail: '满足 ARP1420，最大畸变角 15°'
        },
        {
          title: '排气背压',
          detail: '飞机安装后背压 18 kPa，采用最新机型数据'
        }
      ]
    },
    structure: {
      loadCases: [
        {
          id: 'LC-TO-001',
          name: '起飞最大推力',
          description: '发动机推力达到最大值，检查叶片、盘件的极限应力。',
          load: '1.8 g / 120 kN',
          boundary: '转速 108% N1 · TET 1,720 K',
          status: 'completed' as const
        },
        {
          id: 'LC-CR-002',
          name: '巡航稳态',
          description: '巡航推力下长时稳态，高温爬升对结构影响评估。',
          load: '1.1 g / 70 kN',
          boundary: '转速 94% N1 · TET 1,520 K',
          status: 'in-progress' as const
        },
        {
          id: 'LC-SE-003',
          name: '转子瞬态加速',
          description: '节流指令 0→100% 2.5s，对转子动平衡与轴向窜动的影响。',
          load: 'ΔN1 35% / 0.2 s',
          boundary: '扭矩峰值 1.3 倍',
          status: 'pending' as const
        }
      ],
      margins: [
        {
          label: '叶片危险截面应力裕度',
          value: '+12%',
          status: 'warning' as const,
          note: '根部局部超过 85% 设计极限，需要补充局部加强'
        },
        {
          label: '涡轮盘寿命裕度',
          value: '+18%',
          status: 'good' as const,
          note: '符合基线要求'
        },
        {
          label: '轴承载荷裕度',
          value: '+8%',
          status: 'good' as const,
          note: '动态仿真与试验数据一致'
        },
        {
          label: '机匣热膨胀间隙',
          value: '0.35 mm',
          status: 'risk' as const,
          note: '需要确认补偿策略'
        }
      ],
      validation: [
        {
          title: '整体有限元仿真',
          owner: '结构组 · 李工',
          due: '2024-01-16',
          status: 'done' as const,
          note: 'V2.1 模型已审阅'
        },
        {
          title: '叶片高周疲劳分析',
          owner: '结构组 · 孙工',
          due: '2024-01-22',
          status: 'doing' as const,
          note: '待补充边界条件曲线'
        },
        {
          title: '热载荷试验准备',
          owner: '试验组 · 周工',
          due: '2024-02-05',
          status: 'pending' as const,
          note: '工装审核中'
        }
      ]
    },
    thermal: {
      scenarios: [
        {
          id: 'thermal-core',
          name: '燃烧室核心区',
          maxTemp: '980 °C',
          target: '≤1,000 °C',
          heatFlux: '1.8 MW/m²',
          cooling: '薄膜冷却 + 气膜冷却',
          status: 'warning' as const
        },
        {
          id: 'thermal-turbine',
          name: '高压涡轮叶片',
          maxTemp: '920 °C',
          target: '≤940 °C',
          heatFlux: '1.2 MW/m²',
          cooling: '内腔对流 + 孔冷却',
          status: 'good' as const
        },
        {
          id: 'thermal-nozzle',
          name: '尾喷口',
          maxTemp: '780 °C',
          target: '≤800 °C',
          heatFlux: '0.6 MW/m²',
          cooling: '辐射换热 + 环境冷却',
          status: 'good' as const
        }
      ],
      effectiveness: [
        {
          label: '薄膜冷却效率',
          value: 0.78,
          trend: '-0.02',
          status: 'warning' as const,
          note: '燃烧室中部受高热流影响'
        },
        {
          label: '对流冷却效率',
          value: 0.82,
          trend: '+0.01',
          status: 'good' as const
        },
        {
          label: '材料热裕度',
          value: 0.15,
          trend: '+0.03',
          status: 'good' as const
        }
      ],
      assumptions: [
        '环境换热系数 90 W/m²·K，符合最新安装环境',
        '燃料热值按照 RP-3 低位热值 43 MJ/kg 计算',
        '涡轮叶片冷却孔综合阻塞率 3%',
        '尾喷口辐射系数 0.82，待试验验证'
      ],
    },
    control: {
      interfaces: [
        {
          name: '燃油调节阀传感器',
          signal: '4-20mA · 16 bit',
          latency: '12 ms',
          redundancy: '双冗余',
          status: 'ok' as const,
          note: '满足控制律要求'
        },
        {
          name: '推力杆指令通道',
          signal: 'ARINC429 · 100 Hz',
          latency: '18 ms',
          redundancy: '三冗余',
          status: 'warning' as const,
          note: '待验证极端温度下延迟'
        },
        {
          name: '发动机健康监测总线',
          signal: 'Ethernet TSN',
          latency: '8 ms',
          redundancy: '双冗余',
          status: 'ok' as const
        }
      ],
      strategies: [
        {
          title: '推力控制律 v3.2',
          mode: '自动/手动/防喘振',
          update: '2024-01-10',
          owner: '控制团队 · 刘工',
          note: '加入燃油压力补偿，优化喷口响应'
        },
        {
          title: '健康管理策略',
          mode: '诊断/预测',
          update: '2024-01-15',
          owner: '健康管理 · 赵工',
          note: '新增振动趋势模型'
        }
      ],
      diagnostics: [
        {
          label: '传感器覆盖度',
          value: 0.92,
          status: 'good' as const,
          note: '剩余两个传感器待校准'
        },
        {
          label: '故障检测成功率',
          value: 0.86,
          status: 'warning' as const,
          note: '需要增加燃油泄漏检测场景'
        },
        {
          label: '控制律稳定裕度',
          value: 0.18,
          status: 'good' as const,
          note: '满足设计要求'
        }
      ]
    },
    manufacturing: {
      readiness: [
        {
          label: '关键件制造就绪度',
          value: 0.82,
          status: 'warning' as const,
          note: '涡轮盘批次等待热处理结果'
        },
        {
          label: '特殊工艺覆盖度',
          value: 0.76,
          status: 'warning' as const,
          note: '涂层工艺验证未完成'
        },
        {
          label: '物料入库率',
          value: 0.68,
          status: 'risk' as const,
          note: '供应商延迟交付燃烧室衬套'
        },
        {
          label: '质量文件齐备度',
          value: 0.91,
          status: 'good' as const
        }
      ],
      specialProcesses: [
        {
          name: '涡轮盘热等静压',
          owner: '制造中心 · 许工',
          status: '进行中' as const,
          risk: '高' as const,
          note: '等待设备维护完成'
        },
        {
          name: '叶片涂层工艺',
          owner: '表面处理 · 李工',
          status: '计划中' as const,
          risk: '中' as const,
          note: '需要试验验证数据'
        },
        {
          name: '机匣精密机加工',
          owner: '机加中心 · 王工',
          status: '已完成' as const,
          risk: '低' as const
        }
      ],
      delivery: [
        {
          item: '高压涡轮盘',
          supplier: '航材集团',
          eta: '2024-02-02',
          status: 'delay' as const,
          note: '热处理排产延后 5 天'
        },
        {
          item: '燃烧室衬套',
          supplier: '复合材料厂',
          eta: '2024-01-28',
          status: 'pending' as const,
          note: '等待工艺评审'
        },
        {
          item: '控制电子盒',
          supplier: '电子系统公司',
          eta: '2024-01-22',
          status: 'on-time' as const,
          note: '检验计划已安排'
        }
      ],
      constraints: [
        {
          id: 'PROC-HT-01',
          area: '表面处理 · 涂层车间',
          constraint: '等离子喷涂设备维护占用 2 天',
          impact: '高温部件喷涂排队延长，影响高压部件装配窗口（W05）。',
          mitigation: '与 3# 线共享夜班排产',
          owner: '表面处理 · 李工',
          status: 'mitigating' as const
        },
        {
          id: 'PROC-HIP-02',
          area: '制造中心 · 热等静压',
          constraint: '炉温均匀性 ±6°C 需重新标定',
          impact: '新批次涡轮盘需延后热处理，验证件交付存在风险。',
          mitigation: '外协检测完成前启用备份工装',
          owner: '制造中心 · 许工',
          status: 'open' as const
        },
        {
          id: 'PROC-NDT-03',
          area: '质检中心 · 无损探伤',
          constraint: '超声探伤检测脚本升级完成',
          impact: '检测效率提升 20%，可恢复常规排产。',
          mitigation: '脚本回归测试通过',
          owner: '质检中心 · 赵工',
          status: 'resolved' as const
        }
      ],
      capacity: [
        {
          line: '涡轮盘生产线',
          window: 'W04-W06',
          utilization: 0.82,
          capacity: '12 套/周',
          risk: 'medium' as const,
          note: '热等静压设备需夜班排产以满足基线节奏。'
        },
        {
          line: '燃烧室装配线',
          window: 'W03-W05',
          utilization: 0.68,
          capacity: '10 套/周',
          risk: 'low' as const,
          note: '有 2 人新入场培训，产能爬坡可覆盖额外需求。'
        },
        {
          line: '控制系统集成线',
          window: 'W05-W07',
          utilization: 0.9,
          capacity: '8 套/周',
          risk: 'high' as const,
          note: '试验用电子盒占用 3 套，需要提前协调备件。'
        }
      ],
      supplierRisks: [
        {
          item: '高压涡轮盘毛坯',
          supplier: '航材集团',
          status: 'red' as const,
          ottr: 0.74,
          nextDelivery: '2024-02-02',
          impact: '上一批次合格率 85%，需返工两件，压缩验证节奏。',
          mitigation: '派驻质量工程师驻场并启动备份供应商切换预案。'
        },
        {
          item: '燃烧室复合材料件',
          supplier: '复合材料厂',
          status: 'amber' as const,
          ottr: 0.81,
          nextDelivery: '2024-01-28',
          impact: '工艺评审待通过，存在 3 天滑移风险。',
          mitigation: '提前锁定材料批次，同步提交评审补充资料。'
        },
        {
          item: '控制电子盒',
          supplier: '电子系统公司',
          status: 'green' as const,
          ottr: 0.95,
          nextDelivery: '2024-01-22',
          impact: '生产节奏稳定，可支持样机装配。',
          mitigation: '维持现有看板协同与双周例会机制。'
        }
      ]
    },
    verification: {
      summary: [
        {
          label: '验证闭环率',
          value: '72%',
          trend: '+6%',
          status: 'warning' as const,
          note: '距目标 85% 仍缺 5 条试验证据。'
        },
        {
          label: '试验准时率',
          value: '88%',
          trend: '-2%',
          status: 'warning' as const,
          note: '燃烧室热试任务需重新排期。'
        },
        {
          label: '数据包完成度',
          value: '63%',
          trend: '+8%',
          status: 'warning' as const,
          note: '8 个包已完成 5 个，剩余需补齐仿真数据。'
        },
        {
          label: '问题关闭率',
          value: '64%',
          trend: '+10%',
          status: 'good' as const,
          note: '最新一轮评审关闭 7 个验证动作。'
        }
      ],
      coverage: [
        {
          area: '核心机热端',
          coverage: 0.68,
          tests: 12,
          critical: 5,
          lastRun: '2024-01-18',
          status: 'attention' as const,
          note: '热冲击试验数据待补录，中温段试验安排 1 月底完成。'
        },
        {
          area: '整机性能对比',
          coverage: 0.82,
          tests: 9,
          critical: 3,
          lastRun: '2024-01-16',
          status: 'on-track' as const,
          note: '巡航与起飞工况数据齐备，剩余失速工况等待仿真复核。'
        },
        {
          area: '控制律验证',
          coverage: 0.56,
          tests: 7,
          critical: 4,
          lastRun: '2024-01-20',
          status: 'delayed' as const,
          note: '极端低温工况设备故障，需调配备用试验台。'
        }
      ],
      campaigns: [
        {
          id: 'VVP-FT-01',
          name: 'V2.1 首轮功能试车',
          scope: '覆盖基础性能、起飞推力与加速响应验证。',
          window: 'W04-W05',
          owner: '试验组 · 周工',
          progress: 0.72,
          status: 'running' as const,
          note: '第二阶段采集正在进行，注意燃油温控。'
        },
        {
          id: 'VVP-ENV-02',
          name: '环境应力筛选',
          scope: '高低温循环与振动试验，确认关键部件可靠性。',
          window: 'W05-W06',
          owner: '环境实验室 · 朱工',
          progress: 0.38,
          status: 'preparing' as const,
          note: '待完成试验件二次检查与仪器校准。'
        },
        {
          id: 'VVP-SIM-03',
          name: '仿真-试验对标',
          scope: '对比仿真模型与试验结果，确认指标偏差控制。',
          window: 'W03-W06',
          owner: '仿真团队 · 孙工',
          progress: 0.86,
          status: 'done' as const,
          note: '差异小于 4%，等待归档报告。'
        }
      ],
      packages: [
        {
          id: 'PKG-ENV-001',
          name: '环境试验阶段数据包',
          owner: '环境实验室 · 朱工',
          updatedAt: '2024-01-19 18:20',
          size: '1.8 GB',
          status: 'in-review' as const,
          type: 'CSV/图像/报告',
          note: '评审中，需补充热像仪原始文件。'
        },
        {
          id: 'PKG-FUNC-002',
          name: '功能试车采集包',
          owner: '试验组 · 周工',
          updatedAt: '2024-01-18 22:05',
          size: '3.2 GB',
          status: 'uploaded' as const,
          type: '时序数据/视频',
          note: '已推送控制团队校核。'
        },
        {
          id: 'PKG-CONT-003',
          name: '控制律验证包',
          owner: '控制团队 · 刘工',
          updatedAt: '2024-01-17 14:40',
          size: '850 MB',
          status: 'pending' as const,
          type: '仿真结果/脚本',
          note: '等待上传低温工况仿真结果。'
        }
      ],
      blockers: [
        {
          id: 'BLK-01',
          title: '低温试验台液压异常',
          impact: '阻塞控制律低温响应验证，影响验证闭环率 6%。',
          owner: '试验保障 · 王工',
          due: '2024-01-24',
          status: 'open' as const,
          note: '需备件更换并重新标定传感器。'
        },
        {
          id: 'BLK-02',
          title: '热防护试验报告待审',
          impact: '未通过审签，导致环境工况数据包无法归档。',
          owner: '热防护小组 · 陈工',
          due: '2024-01-23',
          status: 'mitigating' as const,
          note: '评审委员已排期 1 月 22 日加会。'
        },
        {
          id: 'BLK-03',
          title: '试验参数同步滞后',
          impact: '试验与仿真参数版本不一致，需统一配置文件。',
          owner: '数据管理 · 赵工',
          due: '2024-01-25',
          status: 'cleared' as const,
          note: '脚本已更新，将在下一轮试验验证。'
        }
      ]
    },
    configuration: {
      baselineMetrics: [
        {
          label: '基线一致性',
          value: '94%',
          trend: '+3%',
          status: 'aligned' as const,
          note: '核心模块配置已与 V2.1 基线同步。'
        },
        {
          label: '变更积压',
          value: '7 项',
          trend: '-2',
          status: 'deviation' as const,
          note: '两项高风险变更需要本周评审。'
        },
        {
          label: '质量逃逸',
          value: '1 起',
          trend: '0',
          status: 'risk' as const,
          note: '热防护件批次需追加取样。'
        },
        {
          label: '审查完成率',
          value: '68%',
          trend: '+5%',
          status: 'deviation' as const,
          note: '配置评审预计 W05 完成 80%。'
        }
      ],
      changeImpacts: [
        {
          id: 'CCB-2024-017',
          title: '燃油系统管路 reroute',
          domain: '动力系统',
          impact: '需调整安装包络并更新 CFD 模型，可能影响热负荷分布。',
          scope: '燃油系统/热防护/维护手册',
          owner: '配置管理 · 赵工',
          status: 'approving' as const,
          risk: 'medium' as const,
          due: '2024-01-26',
          note: '等待热防护小组补充风险评估。'
        },
        {
          id: 'CCB-2024-019',
          title: '控制律版本 3.3 升级',
          domain: '控制系统',
          impact: '引入低温补偿逻辑，需要同步更新仿真模型与试验脚本。',
          scope: '控制软件/试验脚本/诊断库',
          owner: '控制团队 · 刘工',
          status: 'assessing' as const,
          risk: 'high' as const,
          due: '2024-01-29',
          note: '需确认低温试验窗口是否可用。'
        },
        {
          id: 'CCB-2024-021',
          title: '线束固定点优化',
          domain: '装配工艺',
          impact: '减少振动失效风险，对 BOM 节点与装配指令轻量变动。',
          scope: '装配指令/BOM/质检作业',
          owner: '总装专家 · 马工',
          status: 'implemented' as const,
          risk: 'low' as const,
          due: '2024-01-18'
        }
      ],
      baselineGaps: [
        {
          item: 'XBOM 节点同步',
          plan: '100%',
          current: '92%',
          delta: '-8%',
          owner: '配置组 · 孙工',
          status: 'watch' as const,
          note: '仿真视图新增节点待归档，影响接口一致性。'
        },
        {
          item: '配置手册更新',
          plan: 'V2.1',
          current: 'V2.0',
          delta: '滞后 1 版',
          owner: '文控组 · 王工',
          status: 'issue' as const,
          note: '待集成最新变更记录，需调配编制资源。'
        },
        {
          item: '质量策划闭环',
          plan: '95%',
          current: '90%',
          delta: '-5%',
          owner: '质量部 · 李工',
          status: 'ok' as const,
          note: '剩余问题来自供应商件取样。'
        }
      ],
      qualityGates: [
        {
          name: '配置基线审查 (CBR)',
          stage: 'W04 · 生产准备',
          owner: '配置管理 · 赵工',
          scheduled: '2024-01-24',
          completion: 0.62,
          status: 'attention' as const,
          finding: '需补充控制律升级关联矩阵。'
        },
        {
          name: '供应商质量例会',
          stage: 'W05 · 交付保证',
          owner: '质量部 · 李工',
          scheduled: '2024-01-27',
          completion: 0.48,
          status: 'delayed' as const,
          finding: '航材集团未提交最新过程能力报告。'
        },
        {
          name: '数字主线一致性审核',
          stage: 'W06 · 交付准备',
          owner: '数字工程 · 钱工',
          scheduled: '2024-02-02',
          completion: 0.35,
          status: 'on-track' as const
        }
      ],
      nonConformances: [
        {
          id: 'NC-2024-012',
          type: '热防护涂层气孔偏高',
          severity: 'major' as const,
          module: '燃烧室段',
          owner: '质量部 · 李工',
          status: 'containment' as const,
          due: '2024-01-25',
          note: '已隔离批次，等待复检数据。'
        },
        {
          id: 'NC-2024-015',
          type: '文档版本冲突',
          severity: 'minor' as const,
          module: '控制系统',
          owner: '文控组 · 王工',
          status: 'open' as const,
          due: '2024-01-23',
          note: '控制律指令 V3.3 未同步至维护手册。'
        },
        {
          id: 'NC-2024-016',
          type: '供应商质检缺陷',
          severity: 'critical' as const,
          module: '高压涡轮盘',
          owner: '供应商质量 · 周工',
          status: 'closed' as const,
          due: '2024-01-18',
          note: '返工完成并验证通过。'
        }
      ]
    },
    collaboration: {
      presence: [
        {
          id: 'presence-01',
          name: '张工程师',
          role: '总体设计',
          status: 'online' as const,
          location: '上海 · 办公室'
        },
        {
          id: 'presence-02',
          name: '李博士',
          role: '控制系统',
          status: 'busy' as const,
          location: '在线 · 评审会议'
        },
        {
          id: 'presence-03',
          name: '周工',
          role: '试验组',
          status: 'online' as const,
          location: '西安 · 试验台站'
        },
        {
          id: 'presence-04',
          name: '王工',
          role: '文控',
          status: 'offline' as const,
          location: '同步中'
        }
      ],
      activities: [
        {
          id: 'activity-01',
          title: 'V2.1 方案设计评审纪要更新',
          summary: '补充了控制律 3.3 版本新增的低温补偿策略，评审意见已处理 5/6 条。',
          owner: '控制团队 · 刘工',
          timestamp: '10 分钟前',
          status: 'in-progress' as const,
          type: 'review' as const
        },
        {
          id: 'activity-02',
          title: '风扇叶片验证工况数据对齐',
          summary: '仿真与试验参数差异 <3%，待 QA 复核后可关闭验证阻塞项 BLK-03。',
          owner: '试验组 · 周工',
          timestamp: '35 分钟前',
          status: 'completed' as const,
          type: 'handover' as const
        },
        {
          id: 'activity-03',
          title: '供应商质量例会议程草稿',
          summary: '重点跟踪涡轮盘返工进展与新供应商切换方案，需提前提交资料。',
          owner: '质量部 · 李工',
          timestamp: '1 小时前',
          status: 'pending' as const,
          type: 'sync' as const
        }
      ],
      notifications: [
        {
          id: 'notification-01',
          message: '热防护试验报告待审签，需在 1 月 23 日前完成。',
          severity: 'warning' as const,
          time: '7 分钟前',
          action: '查看报告'
        },
        {
          id: 'notification-02',
          message: '控制律 3.3 版本已上传，请安排评审。',
          severity: 'info' as const,
          time: '24 分钟前',
          action: '安排评审'
        },
        {
          id: 'notification-03',
          message: '低温试验台液压异常待确认恢复窗口，如延迟需同步 VVP-ENV-02。',
          severity: 'critical' as const,
          time: '50 分钟前'
        }
      ],
      actions: [
        {
          id: 'action-01',
          label: '分配整改任务',
          icon: 'ri-task-line',
          description: '将新的评审结论分配给责任人'
        },
        {
          id: 'action-02',
          label: '同步供应风险',
          icon: 'ri-alert-line',
          description: '推送最新的供应链风险到消息流'
        },
        {
          id: 'action-03',
          label: '导出协同日志',
          icon: 'ri-file-history-line',
          description: '下载最近 7 天的协同记录'
        }
      ],
      reviews: [
        {
          id: 'review-01',
          title: '控制策略专项评审',
          date: '1 月 22 日 09:00',
          owner: '控制团队 · 刘工',
          scope: '聚焦低温补偿逻辑及诊断覆盖调整',
          status: 'scheduled' as const
        },
        {
          id: 'review-02',
          title: '供应链例行同步',
          date: '1 月 23 日 13:30',
          owner: '质量部 · 李工',
          scope: '检查返工批次状态与备份供应商切换计划',
          status: 'drafting' as const
        },
        {
          id: 'review-03',
          title: 'V2.1 基线评审总结',
          date: '1 月 18 日',
          owner: '总体设计 · 张工程师',
          scope: '输出最终基线包并归档会议纪要',
          status: 'completed' as const
        }
      ]
    }
  };

  const handleDeleteOutputData = (id: string) => {
    setOutputDataList(prev => prev.filter(item => item.id !== id));
  };

  const handleAddOutputData = () => {
    if (!newOutputData.name.trim()) {
      return;
    }

    const timestamp = new Date();
    const formatted = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(
      timestamp.getDate()
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
      description: newOutputData.description || '新建输出项，待完善详细内容。'
    };

    setOutputDataList(prev => [outputItem, ...prev]);
    setNewOutputData(outputDataFormDefaults);
    setShowOutputDataForm(false);
  };

  const roles = [
    { id: 'system', name: '系统组', icon: 'ri-stack-line' },
    { id: 'assembly', name: '总装专家', icon: 'ri-tools-line' },
    { id: 'component', name: '部件负责人', icon: 'ri-puzzle-line' }
  ];
  const [contentScrolled, setContentScrolled] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);
  // 需求视图的全局筛选（与需求面板联动）
  const [requirementFilters, setRequirementFilters] = useState({
    keyword: '',
    status: 'all' as 'all' | 'in-progress' | 'pending' | 'completed',
    priority: 'all' as 'all' | 'high' | 'medium' | 'low',
    type: 'all' as 'all' | 'performance' | 'functional' | 'interface' | 'quality',
    showOnlyLinked: false,
  });

  const bomTypes: BomType[] = [
    // 调整顺序：需求BOM 放在 方案BOM 前面
    { id: 'requirement', name: '需求BOM', count: 23, icon: 'ri-file-list-2-line', color: 'green' },
    { id: 'solution', name: '方案BOM', count: 15, icon: 'ri-lightbulb-line', color: 'blue' },
    { id: 'design', name: '设计BOM', count: 45, icon: 'ri-pencil-ruler-2-line', color: 'purple' },
    { id: 'simulation', name: '仿真BOM', count: 32, icon: 'ri-computer-line', color: 'orange' },
    { id: 'test', name: '试验BOM', count: 18, icon: 'ri-test-tube-line', color: 'red' },
    { id: 'physical', name: '实物BOM', count: 67, icon: 'ri-cube-line', color: 'indigo' }
  ];

  // 根据BOM类型获取对应的数据结构
  const getBomStructureData = (): BomNode[] => {
    const solutionStructure: BomNode[] = [
      {
          id: '001',
          name: '航空发动机总成',
          level: 0,
          bomType: 'solution',
          unitType: 'product',
          nodeCategory: 'assembly',
          children: [
            {
              id: '001-01',
              name: '推进系统',
              level: 1,
              bomType: 'solution',
              unitType: 'system',
              nodeCategory: 'system',
              children: [
                {
                  id: '001-01-01',
                  name: '压气机分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  subsystemType: 'compressor',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-01-01-A',
                      name: '方案A-三级低压设计',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    },
                    {
                      id: '001-01-01-B',
                      name: '方案B-二级低压设计',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_b',
                      nodeCategory: 'component',
                      schemeType: 'B'
                    }
                  ]
                },
                {
                  id: '001-01-02',
                  name: '燃烧室分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-01-02-A',
                      name: '方案A-环形燃烧室',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    },
                    {
                      id: '001-01-02-B',
                      name: '方案B-管形燃烧室',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_b',
                      nodeCategory: 'component',
                      schemeType: 'B'
                    }
                  ]
                }
              ]
            },
            {
              id: '001-02',
              name: '控制系统',
              level: 1,
              bomType: 'solution',
              unitType: 'system',
              nodeCategory: 'system',
              children: [
                {
                  id: '001-02-01',
                  name: '燃油控制分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-02-01-A',
                      name: '方案A-FADEC控制',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    }
                  ]
                }
              ]
            }
          ]
      }
    ];

    if (selectedBomType === 'solution') {
      return solutionStructure;
    }

    if (selectedBomType === 'simulation') {
      return mapBomType(solutionStructure, 'simulation');
    }

    if (selectedBomType === 'requirement') {
      return REQUIREMENT_BOM_TREE;
    }

    // 设计BOM（E-BOM）树
    if (selectedBomType === 'design') {
      const current = EBOM_BASELINES[EBOM_BASELINES.length - 1]; // 使用最新基线作为浏览树
      const convert = (n: any, level = 0): BomNode => ({
        id: n.id,
        name: `${n.name}`,
        level,
        bomType: 'design',
        unitType: 'part',
        nodeCategory: n.phantom ? 'phantom' : 'part',
        children: (n.children || []).map((c: any) => convert(c, level + 1))
      });
      return [convert(current.root, 0)];
    }

    // 默认返回空数组
    return [];
  };

  const handleBomTypeChange = useCallback((bomTypeId: string) => {
    const auto = autoTransitionRef.current;
    if (!auto && selectedBomType === 'requirement' && bomTypeId !== 'requirement') {
      clearJumpHistory();
    }
    setSelectedBomType(bomTypeId);
    setSelectedNode(null);

    if (bomTypeId === 'solution') {
      setActiveTab('structure');
      setExpandedNodes(['001']);
      setSelectedRole('system');
      setCompareToast(null);
    } else if (bomTypeId === 'simulation') {
      setActiveTab('simulation');
      setExpandedNodes(['001']);
      setIsSimulationNavOpen(false);
      setPreviewSimulationFile(null);
      setCompareToast(null);
      simulationDispatch({ type: 'RESET' });
    } else if (bomTypeId === 'requirement') {
      setActiveTab('requirement');
      setExpandedNodes(['REQ-ENGINE-001']);
      setSelectedRequirementRole('system-team');
    } else if (bomTypeId === 'design') {
      setActiveTab('structure');
      setExpandedNodes(['EBOM-ROOT']);
      setSelectedNode('EBOM-ROOT');
    } else {
      setActiveTab('structure');
      setExpandedNodes([]);
    }
  }, [selectedBomType, clearJumpHistory, simulationDispatch]);

  // 读取对比中心写入的 EBOM 定位指令（一次性消费）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ebomDeepLink');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.module === 'structure' && obj.bomType === 'design' && typeof obj.nodeId === 'string') {
          setPendingDeepLink(obj.nodeId);
          if (selectedBomType !== 'design') {
            handleBomTypeChange('design');
          }
        }
      }
    } catch {}
  }, [selectedBomType, handleBomTypeChange]);

  // 在设计BOM视图就绪后定位到目标节点并展开父层
  useEffect(() => {
    if (selectedBomType !== 'design' || !pendingDeepLink) return;
    const root = EBOM_BASELINES[EBOM_BASELINES.length - 1].root as any;
    const pathIds: string[] = [];
    const walk = (n: any, path: string[]): boolean => {
      if (n.id === pendingDeepLink) { pathIds.push(...path); return true; }
      for (const c of (n.children || [])) {
        if (walk(c, [...path, c.id])) return true;
      }
      return false;
    };
    walk(root, [root.id]);
    if (pathIds.length) {
      setExpandedNodes(prev => Array.from(new Set([...prev, ...pathIds])));
      setSelectedNode(pendingDeepLink);
    }
    try { window.localStorage.removeItem('ebomDeepLink'); } catch {}
    setPendingDeepLink(null);
  }, [selectedBomType, pendingDeepLink]);

  const bomStructureData = getBomStructureData();
  const currentRequirementNode = selectedNode ? findNodeById(selectedNode, bomStructureData) : null;
  const currentRequirementList = selectedNode ? requirementsByNode[selectedNode] || [] : [];
  const requirementStats = {
    total: currentRequirementList.length,
    high: currentRequirementList.filter(item => item.priority === 'high').length,
    inProgress: currentRequirementList.filter(item => item.status === 'in-progress').length,
    pending: currentRequirementList.filter(item => item.status === 'pending').length
  };

  const handleNavigateRequirement = useCallback(
    ({
      requirementIds,
      sourceNodeId,
      sourceNodeName,
    }: {
      requirementIds: string[];
      sourceNodeId?: string | null;
      sourceNodeName?: string | null;
    }) => {
      if (!requirementIds?.length) return;
      const firstRequirementId = requirementIds[0];
      const targetRequirementNodeId = getRequirementNodeIdForRequirement(firstRequirementId);
      const resolvedSourceNodeId = sourceNodeId ?? selectedNode ?? null;
      let resolvedSourceName = sourceNodeName ?? null;
      if (!resolvedSourceName && resolvedSourceNodeId) {
        const sourceNode = findNodeById(resolvedSourceNodeId, bomStructureData);
        resolvedSourceName = sourceNode?.name ?? null;
      }

      const entry: JumpEntry = {
        fromBomType: selectedBomType,
        fromTab: activeTab,
        fromNodeId: selectedNode,
        fromExpandedNodes: [...expandedNodes],
        requirementIds: [...requirementIds],
        sourceNodeId: resolvedSourceNodeId,
        sourceNodeName: resolvedSourceName,
        createdAt: Date.now(),
      };

      autoTransitionRef.current = true;
      setJumpHistory((prev) => {
        const next = [...prev, entry];
        if (typeof window !== 'undefined') {
          console.debug('[ProductStructure] jump stack length:', next.length);
        }
        return next;
      });

      const path = getRequirementNodePath(targetRequirementNodeId);
      const expandIds = path ? path.slice(0, -1) : ['REQ-ENGINE-001'];
      const uniqueExpandIds = Array.from(new Set(expandIds.length ? expandIds : ['REQ-ENGINE-001']));
      setExpandedNodes(uniqueExpandIds);
      setSkipNextTabPersistence(true);
      setSelectedBomType('requirement');
      setActiveTab('requirement');
      setSelectedRequirementRole('system-team');
      const resolvedRequirementNode = targetRequirementNodeId ?? 'REQ-ENGINE-001';
      setSelectedNode(resolvedRequirementNode);
      setPendingRequirementFocus(firstRequirementId);
      setPendingTreeScrollTarget(resolvedRequirementNode);
    },
    [
      selectedBomType,
      activeTab,
      selectedNode,
      expandedNodes,
      bomStructureData,
      getRequirementNodeIdForRequirement,
      getRequirementNodePath,
    ]
  );

  const handleJumpBack = useCallback(() => {
    if (!jumpHistory.length) return;
    const entry = jumpHistory[jumpHistory.length - 1];
    autoTransitionRef.current = true;
    setSkipNextTabPersistence(true);
    setJumpHistory((prev) => {
      const next = prev.slice(0, -1);
      if (typeof window !== 'undefined') {
        console.debug('[ProductStructure] jump stack length:', next.length);
      }
      return next;
    });
    setSelectedBomType(entry.fromBomType);
    setActiveTab(entry.fromTab);
    setExpandedNodes(entry.fromExpandedNodes.length ? [...entry.fromExpandedNodes] : []);
    setSelectedNode(entry.fromNodeId ?? null);
    setPendingRequirementFocus(null);
    setPendingTreeScrollTarget(entry.fromNodeId ?? null);
  }, [jumpHistory]);

  const latestJump = jumpHistory.length ? jumpHistory[jumpHistory.length - 1] : null;
  const backButtonLabel = latestJump
    ? `返回${BOM_TYPE_LABELS[latestJump.fromBomType] ?? '上一视图'}${latestJump.sourceNodeName ? ` · ${latestJump.sourceNodeName}` : ''}`
    : '';
  const hasJumpContext = Boolean(latestJump && selectedBomType === 'requirement' && activeTab === 'requirement');

  // 添加参数
  // 添加缺失的处理函数
  const handleAddInputData = () => {
    if (!newInputData.name) return;
    
    const inputData: InputData = {
      id: `INPUT-${Date.now()}`,
      name: newInputData.name,
      type: newInputData.type,
      lastUpdated: new Date().toLocaleString('zh-CN'),
      updatedBy: '当前用户'
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
    
    setInputDataList(prev => [...prev, inputData]);
    setNewInputData({
      name: '',
      type: 'parameter',
      value: '',
      unit: '',
      category: 'design',
      source: 'manual',
      fileType: 'document'
    });
    setShowInputDataForm(false);
  };

  // 删除输入数据
  const handleDeleteInputData = (id: string) => {
    setInputDataList(prev => prev.filter(item => item.id !== id));
  };

  // 获取参数类别标签
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'design': return '设计参数';
      case 'performance': return '性能参数';
      case 'material': return '材料参数';
      case 'geometry': return '几何参数';
      default: return '其他参数';
    }
  };

  // 获取参数来源标签
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual': return '手动输入';
      case 'calculation': return '计算得出';
      case 'simulation': return '仿真结果';
      case 'test': return '试验数据';
      default: return '其他来源';
    }
  };

  // 获取文件类型标签和图标
  const getFileTypeInfo = (type: string) => {
    switch (type) {
      case 'cad': return { label: 'CAD模型', icon: 'ri-cube-line', color: 'text-blue-600 bg-blue-100' };
      case 'document': return { label: '文档', icon: 'ri-file-text-line', color: 'text-green-600 bg-green-100' };
      case 'simulation': return { label: '仿真文件', icon: 'ri-computer-line', color: 'text-purple-600 bg-purple-100' };
      case 'test_data': return { label: '试验数据', icon: 'ri-test-tube-line', color: 'text-orange-600 bg-orange-100' };
      case 'image': return { label: '图片', icon: 'ri-image-line', color: 'text-pink-600 bg-pink-100' };
      default: return { label: '其他', icon: 'ri-file-line', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);

    // 需求BOM点击节点时自动切换到需求Tab
    if (selectedBomType === 'requirement') {
      setActiveTab('requirement');
    }

    // 根据节点自动切换身份（方案BOM时）
    if (selectedBomType === 'solution') {
      const node = findNodeById(nodeId, bomStructureData);
      if (node) {
        if (node.nodeCategory === 'assembly') {
          setSelectedRole('system');
        } else if (node.nodeCategory === 'system') {
          setSelectedRole('assembly');
          // 点击系统级节点（如推进系统）时，直接进入“产品定义”视图
          setActiveTab('definition');
        } else if (node.nodeCategory === 'subsystem' || node.nodeCategory === 'component') {
          setSelectedRole('component');
        }
      }
    }
  };

  const getFirstAvailableNode = (nodes: BomNode[]): BomNode | null => {
    if (!nodes || nodes.length === 0) return null;
    const [firstNode] = nodes;
    if (!firstNode) return null;
    if (firstNode.children && firstNode.children.length > 0) {
      return firstNode;
    }
    return firstNode;
  };

  useEffect(() => {
    if (autoTransitionRef.current) {
      autoTransitionRef.current = false;
      return;
    }
    if (!bomStructureData.length) return;
    const firstNode = getFirstAvailableNode(bomStructureData);
    if (firstNode) {
      handleNodeClick(firstNode.id);
    }

    const storedTab = getStoredTabPreference(selectedBomType);
    const normalizedTab = storedTab === 'solution' ? 'overview' : storedTab;
    const availableTabs = selectedBomType === 'solution'
      ? ['overview', 'definition', 'design', 'simulation', 'test', 'process', 'management']
      : selectedBomType === 'simulation'
      ? ['simulation']
      : selectedBomType === 'requirement'
      ? ['requirement']
      : selectedBomType === 'design'
      ? ['structure', 'cockpit']
      : ['structure'];

    if (normalizedTab && availableTabs.includes(normalizedTab)) {
      setActiveTab(normalizedTab);
      return;
    }

    if (selectedBomType === 'solution') {
      setActiveTab('overview');
    } else if (selectedBomType === 'simulation') {
      setActiveTab('simulation');
    } else if (selectedBomType === 'requirement') {
      setActiveTab('requirement');
    } else if (selectedBomType === 'design') {
      setActiveTab('structure');
    } else {
      setActiveTab('structure');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBomType]);

  useEffect(() => {
    if (skipNextTabPersistence) {
      setSkipNextTabPersistence(false);
      return;
    }
    setStoredTabPreference(selectedBomType, activeTab);
  }, [activeTab, selectedBomType, skipNextTabPersistence]);

  useEffect(() => {
    if (previousBomTypeRef.current === 'requirement' && selectedBomType !== 'requirement' && !autoTransitionRef.current) {
      clearJumpHistory();
    }
    previousBomTypeRef.current = selectedBomType;
  }, [selectedBomType, clearJumpHistory]);

  useEffect(() => {
    if (selectedBomType === 'requirement' && activeTab !== 'requirement' && !autoTransitionRef.current) {
      clearJumpHistory();
    }
    previousActiveTabRef.current = activeTab;
  }, [activeTab, selectedBomType, clearJumpHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pendingTreeScrollTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const container = treeContainerRef.current;
      if (!container) {
        setPendingTreeScrollTarget(null);
        return;
      }
      const el = container.querySelector<HTMLElement>(`[data-tree-node-id="${pendingTreeScrollTarget}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setPendingTreeScrollTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingTreeScrollTarget, expandedNodes, selectedBomType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTab !== 'definition') {
      setRequirementsInView(false);
      return;
    }
    const target = document.getElementById('requirements-section');
    if (!target) {
      setRequirementsInView(false);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setRequirementsInView(entry ? entry.isIntersecting : false);
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75]
      }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, selectedNode]);

  const getNodeIcon = (node: BomNode) => {
    if (node.bomType === 'solution') {
      if (node.schemeType) {
        return 'ri-lightbulb-line';
      }
      switch (node.nodeCategory) {
        case 'assembly': return 'ri-stack-line';
        case 'system': return 'ri-settings-4-line';
        case 'subsystem': return 'ri-puzzle-line';
        default: return 'ri-circle-line';
      }
    }
    
    if (node.bomType === 'requirement') {
      switch (node.unitType) {
        case 'product_functional_unit': return 'ri-stack-line';
        case 'subsystem_functional_unit': return 'ri-settings-4-line';
        case 'component_assembly': return 'ri-puzzle-line';
        case 'important_part': return 'ri-tools-line';
        default: return 'ri-file-list-2-line';
      }
    }
    
    switch (node.bomType) {
      case 'design': return 'ri-pencil-ruler-2-line';
      case 'simulation': return 'ri-computer-line';
      case 'test': return 'ri-test-tube-line';
      case 'physical': return 'ri-cube-line';
      default: return 'ri-circle-line';
    }
  };

  const getNodeColor = (node: BomNode) => {
    if (node.bomType === 'solution' && node.schemeType) {
      return node.schemeType === 'A' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100';
    }
    
    if (node.bomType === 'requirement') {
      switch (node.unitType) {
        case 'product_functional_unit': return 'text-purple-600 bg-purple-100';
        case 'subsystem_functional_unit': return 'text-indigo-600 bg-indigo-100';
        case 'component_assembly': return 'text-blue-600 bg-blue-100';
        case 'important_part': return 'text-cyan-600 bg-cyan-100';
        default: return 'text-green-600 bg-green-100';
      }
    }
    
    switch (node.bomType) {
      case 'solution': return 'text-blue-600 bg-blue-100';
      case 'design': return 'text-purple-600 bg-purple-100';
      case 'simulation': return 'text-orange-600 bg-orange-100';
      case 'test': return 'text-red-600 bg-red-100';
      case 'physical': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTreeNode = (node: BomNode) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id}>
        <div 
          className={`flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ marginLeft: `${node.level * 20}px` }}
          data-tree-node-id={node.id}
          onClick={() => handleNodeClick(node.id)}
        >
          <div className="w-5">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
              >
                <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line text-xs`}></i>
              </button>
            )}
          </div>

          <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 ${getNodeColor(node)}`}>
            <i className={`${getNodeIcon(node)} text-xs`}></i>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-900 truncate">{node.name}</span>
              {node.schemeType && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  node.schemeType === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {node.schemeType}
                </span>
              )}
              {/* 需求BOM显示单元类型标识 */}
              {node.bomType === 'requirement' && node.unitType && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  node.unitType === 'component_assembly' ? 'bg-blue-100 text-blue-700' : 
                  node.unitType === 'important_part' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {node.unitType === 'component_assembly' ? '成附件' : 
                   node.unitType === 'important_part' ? '重要零件' : 
                   node.unitType === 'product_functional_unit' ? '产品级' :
                   node.unitType === 'subsystem_functional_unit' ? '子系统级' : ''}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{node.id}</div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  // 渲染输入数据区域（合并版本）
  const renderSolutionInputData = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center text-gray-500">
          <i className="ri-database-line text-4xl mb-2"></i>
          <p>请选择方案BOM节点查看输入数据</p>
        </div>
      );
    }

    const currentNode = findNodeById(selectedNode, bomStructureData);
    const parameters = inputDataList.filter(item => item.type === 'parameter');
    const files = inputDataList.filter(item => item.type === 'file');

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
              <span className="text-sm text-gray-500">
                参数: {parameters.length} 个
              </span>
              <span className="text-sm text-gray-500">
                文件: {files.length} 个
              </span>
              <span className="text-sm text-gray-500">
                总计: {inputDataList.length} 条
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowInputDataForm(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            添加数据
          </button>
        </div>

        {/* 输入数据列表 */}
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
                        {/* 图标区域 */}
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          item.type === 'parameter' 
                            ? 'bg-blue-100 text-blue-600' 
                            : getFileTypeInfo(item.fileType || '').color
                        }`}>
                          <i className={`${
                            item.type === 'parameter' 
                              ? 'ri-settings-3-line' 
                              : getFileTypeInfo(item.fileType || '').icon
                          } text-sm`}></i>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              item.type === 'parameter' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {item.type === 'parameter' ? '参数' : '文件'}
                            </span>
                          </div>
                          
                          {/* 参数特有信息 */}
                          {item.type === 'parameter' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4">
                                <span className="text-lg font-semibold text-gray-900">
                                  {item.value} {item.unit}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.category === 'performance' ? 'bg-blue-100 text-blue-700' :
                                  item.category === 'geometry' ? 'bg-green-100 text-green-700' :
                                  item.category === 'material' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {getCategoryLabel(item.category || '')}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.source === 'manual' ? 'bg-gray-100 text-gray-700' :
                                  item.source === 'calculation' ? 'bg-yellow-100 text-yellow-700' :
                                  item.source === 'simulation' ? 'bg-purple-100 text-purple-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {getSourceLabel(item.source || '')}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* 文件特有信息 */}
                          {item.type === 'file' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-600">
                                  {getFileTypeInfo(item.fileType || '').label}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{item.size}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{item.version}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.status === 'active' ? 'bg-green-100 text-green-700' :
                                  item.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.status === 'active' ? '活跃' :
                                   item.status === 'draft' ? '草稿' : '归档'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-2">
                            <span>更新时间: {item.lastUpdated}</span>
                            <span className="mx-2">•</span>
                            <span>更新人: {item.updatedBy}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <i className={item.type === 'parameter' ? 'ri-edit-line' : 'ri-download-line'}></i>
                        </button>
                        {item.type === 'file' && (
                          <button className="text-gray-600 hover:text-gray-800 text-sm">
                            <i className="ri-eye-line"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteInputData(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 添加数据弹窗 */}
        {showInputDataForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">添加输入数据</h3>
                <button 
                  onClick={() => setShowInputDataForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">数据类型</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="dataType"
                          value="parameter"
                          checked={newInputData.type === 'parameter'}
                          onChange={(e) => setNewInputData(prev => ({ ...prev, type: e.target.value as 'parameter' | 'file' }))}
                          className="mr-2"
                        />
                        <span className="text-sm">参数</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="dataType"
                          value="file"
                          checked={newInputData.type === 'file'}
                          onChange={(e) => setNewInputData(prev => ({ ...prev, type: e.target.value as 'parameter' | 'file' }))}
                          className="mr-2"
                        />
                        <span className="text-sm">文件</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {newInputData.type === 'parameter' ? '参数名称' : '文件名称'}
                    </label>
                    <input
                      type="text"
                      value={newInputData.name}
                      onChange={(e) => setNewInputData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={newInputData.type === 'parameter' ? '请输入参数名称' : '请输入文件名称'}
                    />
                  </div>
                  
                  {/* 参数特有字段 */}
                  {newInputData.type === 'parameter' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">数值</label>
                          <input
                            type="text"
                            value={newInputData.value}
                            onChange={(e) => setNewInputData(prev => ({ ...prev, value: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="数值"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                          <input
                            type="text"
                            value={newInputData.unit}
                            onChange={(e) => setNewInputData(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-5  focus:border-blue-500"
                            placeholder="单位"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">参数类别</label>
                        <select
                          value={newInputData.category}
                          onChange={(e) => setNewInputData(prev => ({ ...prev, category: e.target.value as any }))}
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
                          onChange={(e) => setNewInputData(prev => ({ ...prev, source: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                        >
                          <option value="manual">手动输入</option>
                          <option value="calculation">计算得出</option>
                          <option value="simulation">仿真结果</option>
                          <option value="test">试验数据</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  {/* 文件特有字段 */}
                  {newInputData.type === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">文件类型</label>
                      <select
                        value={newInputData.fileType}
                        onChange={(e) => setNewInputData(prev => ({ ...prev, fileType: e.target.value as any }))}
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
                  onClick={() => setShowInputDataForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const phaseStatusStyle: Record<string, string> = {
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'in-progress': 'border-blue-200 bg-blue-50 text-blue-600',
    attention: 'border-amber-200 bg-amber-50 text-amber-700',
    pending: 'border-slate-200 bg-slate-50 text-slate-600'
  };

  const renderPhaseSwitcher = () => {
    if (!solutionOverview.phases?.length) return null;
    const active = solutionOverview.phases.find(phase => phase.id === activePhase) || solutionOverview.phases[0];

    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {solutionOverview.phases.map(phase => (
            <button
              key={phase.id}
              type="button"
              onClick={() => setActivePhase(phase.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                activePhase === phase.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
              aria-pressed={activePhase === phase.id}
            >
              <span>{phase.label}</span>
              <span className="ml-2 text-[11px] text-gray-400">{phase.timeline}</span>
            </button>
          ))}
        </div>

        {active && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
              <div className="text-xs text-gray-400">阶段状态</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${phaseStatusStyle[active.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  {active.label}
                </span>
                <span className="text-xs text-gray-400">{active.timeline}</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{active.summary}</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
              <div className="text-xs text-gray-400">阶段重点</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {active.highlights?.map((item, index) => (
                  <li key={`${active.id}-highlight-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">
              <i className="ri-compass-3-line"></i>
              概览
            </span>
            <span>基线版本：{solutionOverview.baseline}</span>
            <span>对比：{solutionOverview.compareTo}</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">航空发动机方案状态</h2>
          <p className="mt-1 text-sm text-gray-500">责任人：{solutionOverview.owner} · 最近更新 {solutionOverview.updatedAt}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <i className="ri-database-2-line"></i>
            <span>数据来源 · 方案基线台账 / 风险库</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button type="button" className={secondaryActionButtonClass}>
            <i className="ri-refresh-line mr-1"></i>
            切换基线
          </button>
          <button type="button" className={secondaryActionButtonClass}>
            <i className="ri-git-merge-line mr-1"></i>
            变更影响
          </button>
          <button type="button" className={primaryActionButtonClass}>
            <i className="ri-download-2-line mr-1"></i>
            导出报告
          </button>
        </div>
      </div>

      {renderPhaseSwitcher()}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {solutionOverview.metrics.map((metric, index) => (
          <div
            key={`${metric.label}-${index}`}
            className="rounded-xl border border-gray-100 bg-slate-50/70 p-4"
          >
            <div className="text-xs font-medium text-gray-500">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{metric.value}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs ${
              metric.status === 'good'
                ? 'text-emerald-600'
                : metric.status === 'warning'
                ? 'text-orange-600'
                : 'text-gray-500'
            }`}>
              <i className={`ri-arrow-${metric.trend.startsWith('-') ? 'down' : 'up'}-line`}></i>
              {metric.trend}
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            风险提示
          </div>
          <ul className="mt-2 space-y-2 text-sm text-amber-700">
            {solutionOverview.risks.map((risk, index) => (
              <li key={`${risk.label}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                <span>{risk.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderRoleBasedSummary = () => {
    if (selectedBomType !== 'solution' || activeTab !== 'overview') return null;

    const summaryData = {
      system: {
        title: '系统组视图',
        cards: [
          {
            title: '性能/裕度',
            items: [
              { label: '推力裕度', value: '8.5%', status: 'good', trend: '+0.5%' },
              { label: '比冲裕度', value: '12.3%', status: 'excellent', trend: '+1.2%' },
              { label: '功率平衡偏差', value: '2.1%', status: 'warning', trend: '-0.3%' }
            ]
          },
          {
            title: '覆盖/断链',
            items: [
              { label: '仿真覆盖率', value: '87%', status: 'good', trend: '+5%' },
              { label: '试验覆盖率', value: '72%', status: 'warning', trend: '+2%' },
              { label: '需求追溯', value: '94%', status: 'excellent', trend: '+1%' }
            ]
          },
          {
            title: '控制时序',
            items: [
              { label: '启动序列', value: '完整', status: 'excellent', trend: '稳定' },
              { label: '关机序列', value: '完整', status: 'excellent', trend: '稳定' },
              { label: '节流响应', value: '2.1s', status: 'good', trend: '-0.1s' }
            ]
          }
        ]
      },
      assembly: {
        title: '总装专家视图',
        cards: [
          {
            title: '装配就绪度R',
            items: [
              { label: '综合就绪度', value: '78%', status: 'warning', trend: '+3%' },
              { label: '物料就绪', value: '85%', status: 'good', trend: '+2%' },
              { label: '工装就绪', value: '92%', status: 'excellent', trend: '+1%' }
            ]
          },
          {
            title: 'XBOM差异',
            items: [
              { label: '映射一致率', value: '91%', status: 'good', trend: '+2%' },
              { label: '新增项目', value: '12', status: 'warning', trend: '+3' },
              { label: '未映射项', value: '5', status: 'warning', trend: '-2' }
            ]
          },
          {
            title: '风险/变更',
            items: [
              { label: '高RPN项目', value: '8', status: 'warning', trend: '+1' },
              { label: '开放ECN', value: '15', status: 'good', trend: '-3' },
              { label: '开放MRB', value: '3', status: 'excellent', trend: '-1' }
            ]
          }
        ]
      },
      component: {
        title: '部件负责人视图',
        cards: [
          {
            title: 'KPI与红线距离',
            items: [
              { label: '压差红线', value: '15%', status: 'good', trend: '+2%' },
              { label: '转速红线', value: '25%', status: 'excellent', trend: '+1%' },
              { label: '温度红线', value: '8%', status: 'warning', trend: '-1%' }
            ]
          },
          {
            title: '接口一致性',
            items: [
              { label: '几何接口', value: '96%', status: 'excellent', trend: '+1%' },
              { label: '电气接口', value: '89%', status: 'good', trend: '0%' },
              { label: '控制接口', value: '92%', status: 'excellent', trend: '+2%' }
            ]
          },
          {
            title: '可靠性高RPN',
            items: [
              { label: '轴封磨损', value: 'RPN:120', status: 'warning', trend: '-10' },
              { label: '临界转速', value: 'RPN:85', status: 'good', trend: '-15' },
              { label: '气蚀风险', value: 'RPN:65', status: 'good', trend: '-5' }
            ]
          }
        ]
      }
    };

    const currentData = summaryData[selectedRole as keyof typeof summaryData];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'excellent': return 'text-green-600';
        case 'good': return 'text-blue-600';
        case 'warning': return 'text-orange-600';
        case 'danger': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusBg = (status: string) => {
      switch (status) {
        case 'excellent': return 'bg-green-50 text-green-700 border-green-200';
        case 'good': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'danger': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <>
        <div className="p-6 bg-gray-50/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{currentData.title}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">基于&quot;分类—汇总—呈现&quot;的跨域数据摘要</span>
              <button 
                onClick={() => setShowDetailedReport(true)}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                查看详细报告
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentData.cards.map((card, cardIndex) => (
              <div key={cardIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{card.title}</h4>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    查看明细
                  </button>
                </div>

                <div className="space-y-4">
                  {card.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <div className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBg(item.status)}`}>
                            {item.status === 'excellent' ? '优秀' : 
                             item.status === 'good' ? '良好' : 
                             item.status === 'warning' ? '警告' : '危险'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-lg font-semibold ${getStatusColor(item.status)}`}>
                            {item.value}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.trend.startsWith('+') ? '↗' : item.trend.startsWith('-') ? '↘' : '→'} {item.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between">
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      专业操作
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">
                      历史趋势
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            * 基于标准化指标计算，支持多维度汇总和版本差异追踪
          </div>
        </div>

        {/* 详细报告弹窗 */}
        {showDetailedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentData.title} - 详细报告
                </h2>
                <button 
                  onClick={() => setShowDetailedReport(false)}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-8">
                  {/* 报告概览 */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">报告概览</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">85.7%</div>
                        <div className="text-sm text-gray-600">总体健康度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">23</div>
                        <div className="text-sm text-gray-600">优秀指标</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">8</div>
                        <div className="text-sm text-gray-600">警告指标</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <div className="text-sm text-gray-600">风险指标</div>
                      </div>
                    </div>
                  </div>

                  {/* 详细分析 */}
                  {currentData.cards.map((card, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{card.title} - 详细分析</h3>
                      
                      <div className="space-y-6">
                        {card.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{item.label}</h4>
                              <div className={`px-2 py-0.5 text-xs rounded-full ${
                                item.status === 'excellent' ? 'bg-green-100 text-green-700' :
                                item.status === 'good' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status === 'excellent' ? '优秀' : 
                                 item.status === 'good' ? '良好' : 
                                 item.status === 'warning' ? '警告' : '危险'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">当前值: </span>
                                <span className={`font-semibold ${getStatusColor(item.status)}`}>
                                  {item.value}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">变化趋势: </span>
                                <span className="font-medium">
                                  {item.trend.startsWith('+') ? '↗ 上升' : item.trend.startsWith('-') ? '↘ 下降' : '→ 稳定'} {item.trend}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">目标值: </span>
                                <span className="font-medium text-green-600">
                                  {item.label.includes('推力') ? '>8.0%' :
                                   item.label.includes('覆盖') ? '>90%' :
                                   item.label.includes('响应') ? '<3.0s' : '达标'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              <strong>分析建议: </strong>
                              {item.status === 'excellent' ? '指标表现优秀，建议继续保持当前策略。' :
                               item.status === 'good' ? '指标表现良好，可考虑进一步优化提升。' :
                               item.status === 'warning' ? '指标存在警告，建议重点关注并制定改进措施。' :
                               '指标存在风险，需要立即采取纠正行动。'}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 历史趋势图 */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">历史趋势分析</h4>
                        <div className="h-32 bg-white rounded border flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <i className="ri-line-chart-line text-3xl mb-2"></i>
                            <p className="text-sm">过去30天趋势图表</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 改进建议 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">改进建议</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-check-line text-green-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">优化功率平衡控制</h4>
                          <p className="text-sm text-gray-700">当前功率平衡偏差为2.1%，建议调整控制算法参数，目标控制在1.5%以内。</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-lightbulb-line text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">提升试验覆盖率</h4>
                          <p className="text-sm text-gray-700">试验覆盖率为72%，建议增加关键工况的试验验证，目标提升到85%以上。</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-alert-line text-orange-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">关注温度红线距离</h4>
                          <p className="text-sm text-gray-700">温度红线距离仅为8%，需要密切监控并考虑增加冷却措施。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowDetailedReport(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  关闭
                </button>
                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                  导出PDF报告
                </button>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                  生成改进计划
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // 新的点击处理函数
  const handleDependencyClick = (item: OutputData) => {
    setSelectedOutputItem(item);
    setShowDependencyModal(true);
  };

  const handleDeliverableClick = (item: OutputData) => {
    setSelectedOutputItem(item);
    setShowDeliverableModal(true);
  };

  const handlePreviewClick = (item: OutputData) => {
    setSelectedOutputItem(item);
    setShowPreviewModal(true);
  };


  const renderSimulationData = () => {
    if (selectedBomType !== 'solution' && selectedBomType !== 'simulation') {
      return null;
    }

    const handleNodeSelect = (ref: TreeNodeReference) => {
      simulationDispatch({ type: 'SELECT_NODE', payload: ref });
      setIsSimulationNavOpen(false);
    };

    const handleSelectCategory = (categoryId: string) => {
      handleNodeSelect({ type: 'category', categoryId });
    };

    const handleToggleExpand = (id: string) => {
      simulationDispatch({ type: 'TOGGLE_EXPAND', payload: id });
    };

    const handleSearchChange = (keyword: string) => {
      simulationDispatch({ type: 'SET_SEARCH', payload: keyword });
    };

    const handlePageChange = (page: number) => {
      simulationDispatch({ type: 'SET_PAGE', payload: page });
    };

    const handlePageSizeChange = (size: number) => {
      simulationDispatch({ type: 'SET_PAGE_SIZE', payload: size });
    };

    const handleAddCompareFile = (file: SimulationFile) => {
      const conditionId = file.activeConditionId || file.conditions?.[0]?.id;
      const conditionName = file.activeConditionName || file.conditions?.find(condition => condition.id === conditionId)?.name;
      const compareKey = file.compareKey ?? (conditionId ? `${file.id}::${conditionId}` : file.id);
      const variant = conditionId ? file.conditionVariants?.[conditionId] : undefined;
      simulationDispatch({
        type: 'ADD_COMPARE',
        payload: {
          ...file,
          activeConditionId: conditionId,
          activeConditionName: conditionName,
          compareKey,
          preview: variant ? { ...variant } : file.preview
        }
      });
    };

    const handleFilterChange = (nextFilters: Partial<SimulationFilters>) => {
      simulationDispatch({ type: 'SET_FILTERS', payload: nextFilters });
    };

    const handleRemoveCompareFile = (fileId: string) => {
      simulationDispatch({ type: 'REMOVE_COMPARE', payload: fileId });
    };

    const handleClearCompare = () => {
      simulationDispatch({ type: 'CLEAR_COMPARE' });
    };

    const handleRegisterCompareInstance = (instanceId: string, instanceName: string) => {
      simulationDispatch({
        type: 'REGISTER_COMPARE_EVENT',
        payload: { type: 'instance', id: instanceId, label: instanceName }
      });
    };

    const handleSelectInstance = (instanceId: string) => {
      if (!currentSimulationCategory) return;
      handleNodeSelect({
        type: 'instance',
        categoryId: currentSimulationCategory.id,
        instanceId
      });
    };

    const handleSelectFolder = (folderId: string) => {
      if (!currentSimulationCategory || !currentSimulationInstance) return;
      handleNodeSelect({
        type: 'folder',
        categoryId: currentSimulationCategory.id,
        instanceId: currentSimulationInstance.id,
        folderId
      });
    };

    const handlePreviewFile = (file: SimulationFile) => {
      setPreviewSimulationFile(file);
    };

    const handleOpenFolderFromPreview = (file: SimulationFile) => {
      const match = simulationState.categories.flatMap(cat =>
        cat.instances.flatMap(inst =>
          inst.folders.map(folder => ({ cat, inst, folder }))
        )
      ).find(entry => entry.folder.files.some(f => f.id === file.id));

      if (!match) return;
      handleNodeSelect({
        type: 'folder',
        categoryId: match.cat.id,
        instanceId: match.inst.id,
        folderId: match.folder.id
      });
      setPreviewSimulationFile(null);
    };

    const renderTreePanel = () => (
      <SimulationTreePanel
        categories={simulationState.categories}
        selectedNode={simulationState.selectedNode}
        expandedNodeIds={simulationState.expandedNodeIds}
        onToggleExpand={handleToggleExpand}
        onSelectNode={handleNodeSelect}
      />
    );

    return (
      <div className="relative flex h-full">
        {isSimulationNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsSimulationNavOpen(false)}></div>
            <div className="relative ml-auto h-full w-72 max-w-full bg-white shadow-xl">
              {renderTreePanel()}
            </div>
          </div>
        )}
        <div className="hidden md:flex h-full">
          {renderTreePanel()}
        </div>
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto">
            <SimulationContentPanel
              category={currentSimulationCategory}
              instance={currentSimulationInstance}
              folder={currentSimulationFolder}
              page={simulationState.page}
              pageSize={simulationState.pageSize}
              searchKeyword={simulationState.searchKeyword}
              hasInteracted={simulationState.hasInteracted}
              categories={simulationState.categories}
              filters={simulationState.filters}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onSelectInstance={handleSelectInstance}
              onSelectCategory={handleSelectCategory}
              onSelectFolder={handleSelectFolder}
              onPreviewFile={handlePreviewFile}
              onAddCompareFile={handleAddCompareFile}
              onAddCompareInstance={handleSelectInstance}
              onRegisterCompareInstance={handleRegisterCompareInstance}
              onOpenNavigation={() => setIsSimulationNavOpen(true)}
            />
          </div>
          <SimulationCompareDrawer
            items={simulationState.compareQueue}
            onRemove={handleRemoveCompareFile}
            onClear={handleClearCompare}
          />
        </div>
        <SimulationFilePreview
          file={previewSimulationFile}
          onClose={() => setPreviewSimulationFile(null)}
          onOpenFolder={handleOpenFolderFromPreview}
          onAddCompare={handleAddCompareFile}
        />
        {compareToast && (
          <div className="pointer-events-none fixed bottom-28 right-8 z-50">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
              <i className="ri-checkbox-circle-line text-lg text-green-400"></i>
              <div className="flex flex-col">
                <span>{compareToast.type === 'file' ? '文件已加入对比栏' : '实例文件已加入对比栏'}</span>
                <span className="text-xs text-slate-300">{compareToast.label}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'scheme_doc': return { label: '方案说明书', icon: 'ri-file-text-line', color: 'text-blue-600 bg-blue-100' };
      case 'condition_lib': return { label: '工况库', icon: 'ri-database-line', color: 'text-green-600 bg-green-100' };
      case 'performance_budget': return { label: '性能预算', icon: 'ri-line-chart-line', color: 'text-purple-600 bg-purple-100' };
      case 'power_balance': return { label: '功率平衡', icon: 'ri-flashlight-line', color: 'text-orange-600 bg-orange-100' };
      case 'control_sequence': return { label: '控制序列', icon: 'ri-time-line', color: 'text-indigo-600 bg-indigo-100' };
      case 'vv_plan': return { label: 'V&V计划', icon: 'ri-calendar-line', color: 'text-cyan-600 bg-cyan-100' };
      case 'risk_reliability': return { label: '风险可靠性', icon: 'ri-shield-check-line', color: 'text-red-600 bg-red-100' };
      case 'icd_xbom': return { label: 'ICD/XBOM', icon: 'ri-node-tree', color: 'text-teal-600 bg-teal-100' };
      case 'baseline_strategy': return { label: '基线策略', icon: 'ri-bookmark-line', color: 'text-pink-600 bg-pink-100' };
      default: return { label: '其他', icon: 'ri-file-line', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return 'ri-file-text-line';
      case 'model': return 'ri-cube-line';
      case 'data': return 'ri-database-line';
      case 'chart': return 'ri-bar-chart-line';
      case 'table': return 'ri-table-line';
      case 'plan': return 'ri-calendar-line';
      case 'matrix': return 'ri-grid-line';
      default: return 'ri-file-line';
    }
  };



  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已批准';
      case 'review': return '评审中';
      case 'draft': return '草稿';
      case 'baseline': return '基线';
      default: return '未知';
    }
  };

  const renderOutputDataManagement = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center text-gray-500">
          <i className="ri-file-list-3-line text-4xl mb-2"></i>
          <p>请选择方案BOM节点查看输出数据</p>
        </div>
      );
    }

    const currentNode = findNodeById(selectedNode, bomStructureData);
    
    // 按类别分组输出数据
    const groupedOutputData = outputDataList.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, OutputData[]>);

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
              <span className="text-sm text-gray-500">
                总计: {outputDataList.length} 项输出
              </span>
              <span className="text-sm text-gray-500">
                平均完整度: {Math.round(outputDataList.reduce((sum, item) => sum + item.completeness, 0) / outputDataList.length)}%
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowOutputDataForm(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            添加输出项
          </button>
        </div>

        {/* 输出数据分类展示 */}
        <div className="space-y-6">
          {Object.entries(groupedOutputData).map(([category, items]) => {
            const categoryInfo = getCategoryInfo(category);
            const avgCompleteness = Math.round(items.reduce((sum, item) => sum + item.completeness, 0) / items.length);
            
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
                        <p className="text-sm text-gray-500">{items.length} 项输出 • 平均完整度 {avgCompleteness}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${avgCompleteness}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{avgCompleteness}%</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* 类型图标 */}
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className={`${getTypeIcon(item.type)} text-gray-600`}></i>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                                {getStatusText(item.status)}
                              </span>
                              <span className="text-xs text-gray-500">{item.version}</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            
                            {/* 完整度进度条 */}
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-sm text-gray-500">完整度:</span>
                              <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    item.completeness >= 90 ? 'bg-green-500' :
                                    item.completeness >= 70 ? 'bg-blue-500' :
                                    item.completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${item.completeness}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{item.completeness}%</span>
                            </div>
                            
                            {/* 基本信息 */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">格式: </span>
                                <span className="text-gray-900">{item.format}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">更新时间: </span>
                                <span className="text-gray-900">{item.lastUpdated}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">更新人: </span>
                                <span className="text-gray-900">{item.updatedBy}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">交付物: </span>
                                <button 
                                  onClick={() => handleDeliverableClick(item)}
                                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                  {item.deliverables?.length || 0} 项
                                </button>
                              </div>
                            </div>
                            
                            {/* 结构化参数 */}
                            {item.parameters && item.parameters.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <h6 className="text-sm font-medium text-gray-900 mb-2">关键参数</h6>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  {item.parameters.map((param, index) => (
                                    <div key={index} className="text-sm">
                                      <div className="text-gray-600">{param.name}</div>
                                      <div className="font-medium text-gray-900">
                                        {param.value} {param.unit}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 依赖关系和交付物 */}
                            <div className="flex items-center space-x-6 text-sm">
                              {item.dependencies && item.dependencies.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <i className="ri-links-line text-gray-400"></i>
                                  <button 
                                    onClick={() => handleDependencyClick(item)}
                                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    依赖: {item.dependencies.length} 项
                                  </button>
                                </div>
                              )}
                              {item.deliverables && item.deliverables.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <i className="ri-file-list-line text-gray-400"></i>
                                  <button 
                                    onClick={() => handleDeliverableClick(item)}
                                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    交付物: {item.deliverables.length} 项
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button 
                            onClick={() => handlePreviewClick(item)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm">
                            <i className="ri-download-line"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteOutputData(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <i className="ri-delete-bin-line"></i>
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

        {/* 添加输出数据弹窗 */}
        {showOutputDataForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">添加输出数据项</h3>
                <button 
                  onClick={() => setShowOutputDataForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">输出项名称</label>
                    <input
                      type="text"
                      value={newOutputData.name}
                      onChange={(e) => setNewOutputData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入输出项名称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                    <select
                      value={newOutputData.category}
                      onChange={(e) => setNewOutputData(prev => ({ ...prev, category: e.target.value as OutputData['category'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                    >
                      <option value="scheme_doc">方案说明书 & 架构模型</option>
                      <option value="condition_lib">工况库</option>
                      <option value="performance_budget">性能预算与包线</option>
                      <option value="power_balance">功率/流量平衡表</option>
                      <option value="control_sequence">控制与序列草案</option>
                      <option value="vv_plan">V&V计划 & 覆盖矩阵</option>
                      <option value="risk_reliability">风险与可靠性</option>
                      <option value="icd_xbom">ICD/XBOM骨架</option>
                      <option value="baseline_strategy">基线策略 & 成套性模板</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <select
                      value={newOutputData.type}
                      onChange={(e) => setNewOutputData(prev => ({ ...prev, type: e.target.value as OutputData['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">格式</label>
                    <input
                      type="text"
                      value={newOutputData.format}
                      onChange={(e) => setNewOutputData(prev => ({ ...prev, format: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="如: PDF, Excel, SysML等"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={newOutputData.description}
                      onChange={(e) => setNewOutputData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入输出项描述"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowOutputDataForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleAddOutputData}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  添加输出项
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 依赖关系弹窗 */}
        {showDependencyModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">依赖关系 - {selectedOutputItem.name}</h3>
                <button 
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
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            已满足
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
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
                  onClick={() => setShowDependencyModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  添加依赖
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 交付物弹窗 */}
        {showDeliverableModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">交付物清单 - {selectedOutputItem.name}</h3>
                <button 
                  onClick={() => setShowDeliverableModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedOutputItem.deliverables && selectedOutputItem.deliverables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOutputItem.deliverables.map((deliverable, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="ri-file-list-line text-green-600"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{deliverable}</div>
                            <div className="text-sm text-gray-500">交付文档</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            待交付
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            <i className="ri-download-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-file-list-line text-4xl mb-2"></i>
                    <p>暂无交付物</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowDeliverableModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  批量下载
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 预览弹窗 */}
        {showPreviewModal && selectedOutputItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">预览 - {selectedOutputItem.name}</h3>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    全屏预览
                  </button>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className={`${getTypeIcon(selectedOutputItem.type)} text-blue-600 text-2xl`}></i>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedOutputItem.name}</h4>
                    <p className="text-gray-600 mb-4">{selectedOutputItem.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-gray-500">格式</div>
                        <div className="font-medium text-gray-900">{selectedOutputItem.format}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-gray-500">版本</div>
                        <div className="font-medium text-gray-900">{selectedOutputItem.version}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-gray-500">完整度</div>
                        <div className="font-medium text-gray-900">{selectedOutputItem.completeness}%</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-gray-500">状态</div>
                        <div className={`font-medium ${
                          selectedOutputItem.status === 'approved' ? 'text-green-600' :
                          selectedOutputItem.status === 'review' ? 'text-blue-600' :
                          selectedOutputItem.status === 'draft' ? 'text-yellow-600' : 'text-purple-600'
                        }`}>
                          {getStatusText(selectedOutputItem.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 预览内容区域 */}
                  <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12">
                    <i className="ri-eye-line text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 text-lg">文档预览功能</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {selectedOutputItem.type === 'document' ? '文档内容预览' :
                       selectedOutputItem.type === 'model' ? '模型渲染预览' :
                       selectedOutputItem.type === 'chart' ? '图表可视化预览' :
                       selectedOutputItem.type === 'table' ? '表格数据预览' : '内容预览'}
                    </p>
                  </div>
                  
                  {/* 参数详情 */}
                  {selectedOutputItem.parameters && selectedOutputItem.parameters.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg p-4 text-left">
                      <h5 className="font-medium text-gray-900 mb-3">关键参数</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedOutputItem.parameters.map((param, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="text-sm text-gray-600">{param.name}</div>
                            <div className="font-medium text-gray-900">{param.value} {param.unit}</div>
                            <div className="text-xs text-gray-500 mt-1">{param.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  编辑文档
                </button>
                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  下载文档
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="h-full bg-slate-50">
      <div className="flex h-full gap-6 px-6 py-6">
        {/* 左侧产品结构区域 */}
        <div className="w-80 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* 版本和BOM类型选择 - 缩小区域 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">产品结构(XBOM)</h2>
              <select 
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 pr-6"
              >
                {versions.map(version => (
                  <option key={version.id} value={version.id}>
                    {version.name} - {version.description}
                  </option>
                ))}
              </select>
            </div>
            
            {/* BOM类型选择 - 简化为水平标签 */}
            <div className="flex flex-wrap gap-2">
              {bomTypes.map((bomType) => (
                <button
                  key={bomType.id}
                  onClick={() => handleBomTypeChange(bomType.id)}
                  className={`flex-1 flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedBomType === bomType.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                  }`}
                >
                  <i className={bomType.icon}></i>
                  <span>{bomType.name}</span>
                  <span className="text-xs opacity-75">({bomType.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* BOM树结构 */}
          <div className="flex-1 overflow-y-auto p-4" ref={treeContainerRef}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3">
                <div className="space-y-1">
                  {bomStructureData.map(node => renderTreeNode(node))}
                </div>
              </div>
            </div>
          </div>

          {/* 角色选择 - 仅方案BOM显示 */}
          {selectedBomType === 'solution' && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">角色视图</h3>
              <div className="flex space-x-1">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                      selectedRole === role.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <i className={role.icon}></i>
                    <span>{role.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* Tab切换 */}
          <div className={`border-b border-gray-200 bg-white px-6 py-4 transition-shadow ${contentScrolled ? 'shadow-sm' : ''}`}>
            <div className="flex space-x-8" role="tablist" aria-label="方案视图">
              {(() => {
                const tabs: Array<{ id: string; name: string; icon: string }> = [];
                if (selectedBomType === 'solution') {
                  tabs.push(
                    { id: 'overview', name: '概览', icon: 'ri-compass-3-line' },
                    { id: 'definition', name: '产品定义', icon: 'ri-book-2-line' },
                    { id: 'design', name: '设计实现', icon: 'ri-pencil-ruler-2-line' },
                    { id: 'simulation', name: '仿真验证', icon: 'ri-computer-line' },
                    { id: 'test', name: '试验与测量', icon: 'ri-test-tube-line' },
                    { id: 'process', name: '工艺与生产', icon: 'ri-tools-line' },
                    { id: 'management', name: '管理与保障', icon: 'ri-shield-check-line' }
                  );
                } else if (selectedBomType === 'simulation') {
                  tabs.push({ id: 'simulation', name: '仿真验证', icon: 'ri-computer-line' });
                } else if (selectedBomType === 'requirement') {
                  tabs.push(
                    { id: 'requirement', name: '需求详情', icon: 'ri-file-list-2-line' }
                  );
                } else if (selectedBomType === 'design') {
                  tabs.push(
                    { id: 'structure', name: '结构视图', icon: 'ri-stack-line' },
                    { id: 'cockpit', name: '实时驾驶舱', icon: 'ri-dashboard-2-line' }
                  );
                } else {
                  tabs.push(
                    { id: 'structure', name: '结构视图', icon: 'ri-node-tree' }
                  );
                }
                return tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.name}</span>
                  </button>
                ));
              })()}
            </div>
          </div>

        {/* 内容区域 */}
        <div
          className="flex-1 overflow-y-auto pr-1 pt-4 md:pt-6 pb-0 scroll-pt-20"
          onScroll={(e) => setContentScrolled((e.currentTarget as HTMLDivElement).scrollTop > 0)}
        >
            {/* 次级工具条：在内容顶部形成层级分隔，可放筛选/导出等操作 */}
            {selectedBomType === 'requirement' && (
              <div className="sticky top-0 z-10 px-6 py-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  {hasJumpContext && latestJump && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleJumpBack}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800"
                      >
                        <i className="ri-arrow-left-line"></i>
                        {backButtonLabel}
                      </button>
                      <button
                        type="button"
                        onClick={clearJumpHistory}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1 text-gray-400 hover:text-gray-600"
                        aria-label="清除跳转上下文"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-medium text-gray-500 mr-2">快速筛选</div>
                    {/* 状态切片 */}
                    {['all','in-progress','pending','completed'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRequirementFilters(prev => ({ ...prev, status: v as any }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${requirementFilters.status === v ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'}`}
                      >
                        {v === 'all' ? '全部' : v === 'in-progress' ? '进行中' : v === 'pending' ? '待启动' : '已完成'}
                      </button>
                    ))}
                    <span className="text-gray-300">|</span>
                    {/* 类型切片 */}
                    {[
                      {v:'all', l:'全部'},
                      {v:'performance', l:'性能'},
                      {v:'functional', l:'功能'},
                      {v:'interface', l:'接口'},
                      {v:'quality', l:'六性'},
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setRequirementFilters(prev => ({ ...prev, type: opt.v as any }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${requirementFilters.type === opt.v ? 'bg-slate-50 border-slate-300 text-slate-700' : 'border-gray-200 text-gray-600 hover:border-slate-300 hover:text-slate-700'}`}
                      >
                        {opt.l}
                      </button>
                    ))}
                    <label className="ml-2 inline-flex items-center gap-1 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={requirementFilters.showOnlyLinked}
                        onChange={(e) => setRequirementFilters(prev => ({ ...prev, showOnlyLinked: e.target.checked }))}
                      />
                      仅关注
                    </label>
                    <div className="relative ml-auto">
                      <i className="ri-search-line pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input
                        value={requirementFilters.keyword}
                        onChange={(e) => setRequirementFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        placeholder="搜索需求关键词"
                        className="w-56 rounded-md border border-gray-200 pl-7 pr-3 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => setRequirementFilters({ keyword: '', status: 'all', priority: 'all', type: 'all', showOnlyLinked: false })}
                    >
                      重置
                    </button>
                    <button type="button" className="text-xs px-3 py-1.5 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50">
                      导出
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="min-h-full space-y-6">
              {activeTab === 'requirement' && selectedBomType === 'requirement' && (
                <div
                  role="tabpanel"
                  id="panel-requirement"
                  aria-labelledby="tab-requirement"
                  className="space-y-6"
                >
                  <RequirementDetailPanel
                    selectedNode={selectedNode}
                    selectedBomType={selectedBomType}
                    selectedRequirementRole={selectedRequirementRole}
                    onRequirementRoleChange={setSelectedRequirementRole}
                    requirementRoles={requirementRoles}
                    requirementRoleInsights={requirementRoleInsights}
                    requirementsByNode={requirementsByNode}
                    currentNode={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name } : null}
                    filters={requirementFilters}
                    onFiltersChange={setRequirementFilters}
                    focusRequirementId={pendingRequirementFocus}
                    onFocusHandled={() => setPendingRequirementFocus(null)}
                  />
                </div>
              )}
              {activeTab === 'structure' && selectedBomType !== 'design' && (
                <div
                  className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500"
                  role="tabpanel"
                  id="panel-structure"
                  aria-labelledby="tab-structure"
                >
                  <i className="ri-node-tree text-4xl mb-2"></i>
                  <p>结构视图内容</p>
                </div>
              )}

              {selectedBomType === 'design' && (activeTab === 'structure' || activeTab === 'cockpit') && (
                <div
                  role="tabpanel"
                  id={`panel-${activeTab}`}
                  aria-labelledby={`tab-${activeTab}`}
                  className="space-y-6"
                >
                  <EbomDetailPanel
                    selectedNodeId={selectedNode}
                    onNavigateBomType={(t) => handleBomTypeChange(t)}
                    onSelectNode={(id) => handleNodeClick(id)}
                    activeView={activeTab === 'cockpit' ? 'cockpit' : 'structure'}
                    onNavigateRequirement={handleNavigateRequirement}
                  />
                </div>
              )}

              {activeTab === 'definition' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-definition" aria-labelledby="tab-definition" className="space-y-6 focus:outline-none">
                  <ProductDefinitionPanel
                    node={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name, unitType: currentRequirementNode.unitType as any, subsystemType: (currentRequirementNode as any).subsystemType } : null}
                    versionId={selectedVersion}
                    onNavigateToNode={(nodeId) => handleNodeClick(nodeId)}
                    defaultRole={selectedRole as 'system' | 'assembly' | 'component'}
                  />
                  <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 px-6 py-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-xl space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <i className="ri-compass-3-line"></i>
                        需求闭环 · Requirement Traceability
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">从产品定义到需求BOM，一次看清状态</h3>
                      <p className="text-sm text-gray-600">
                        当前节点关联 {requirementStats.total} 条需求，进行中 {requirementStats.inProgress} 条，待启动 {requirementStats.pending} 条，高优 {requirementStats.high} 条。
                        支持导出清单、同步主数据与快速筛选。
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-700 hover:border-blue-300 hover:text-blue-800"
                        onClick={() => setActiveTab('definition')}
                      >
                        <i className="ri-refresh-line mr-1"></i>
                        同步主数据
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-3 py-1.5 text-sm shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          requirementsInView ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={() => {
                          const el = document.getElementById('requirements-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        aria-pressed={requirementsInView}
                      >
                        <i className="ri-file-list-2-line mr-1"></i>
                        查看需求清单
                      </button>
                    </div>
                  </section>
                  <div id="requirements-section" className="scroll-mt-[120px]">
                    <RequirementDetailPanel
                      selectedNode={selectedNode}
                      selectedBomType={selectedBomType}
                      selectedRequirementRole={selectedRequirementRole}
                      onRequirementRoleChange={setSelectedRequirementRole}
                      requirementRoles={requirementRoles}
                      requirementRoleInsights={requirementRoleInsights}
                      requirementsByNode={requirementsByNode}
                      currentNode={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name } : null}
                      focusRequirementId={pendingRequirementFocus}
                      onFocusHandled={() => setPendingRequirementFocus(null)}
                    />
                 </div>
               </div>
              )}

              {activeTab === 'overview' && selectedBomType === 'solution' && (
                <div
                  className="space-y-6"
                  role="tabpanel"
                  id="panel-overview"
                  aria-labelledby="tab-overview"
                >
                  {renderOverview()}
                  {/* 概览下仅展示总览信息与阶段切换；专业面板迁移至六域 */}
                </div>
              )}

              {activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation') && (
                <div role="tabpanel" id="panel-simulation" aria-labelledby="tab-simulation" className="space-y-6">
                  {renderSimulationData()}
                </div>
              )}

              {activeTab === 'design' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-design" aria-labelledby="tab-design" className="space-y-6">
                  <PerformanceOverview
                    operatingPoints={solutionOverview.performance.operatingPoints}
                    assumptions={solutionOverview.performance.assumptions}
                  />
                  <StructuralOverview
                    loadCases={solutionOverview.structure.loadCases}
                    margins={solutionOverview.structure.margins}
                    validation={solutionOverview.structure.validation}
                  />
                  <ThermalOverview
                    scenarios={solutionOverview.thermal.scenarios}
                    effectiveness={solutionOverview.thermal.effectiveness}
                    assumptions={solutionOverview.thermal.assumptions}
                  />
                  <ControlOverview
                    interfaces={solutionOverview.control.interfaces}
                    strategies={solutionOverview.control.strategies}
                    diagnostics={solutionOverview.control.diagnostics}
                  />
                  {renderRoleBasedSummary()}
                </div>
              )}

              {activeTab === 'test' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-test" aria-labelledby="tab-test" className="space-y-6">
                  <VerificationOverview
                    summary={solutionOverview.verification.summary}
                    coverage={solutionOverview.verification.coverage}
                    campaigns={solutionOverview.verification.campaigns}
                    packages={solutionOverview.verification.packages}
                    blockers={solutionOverview.verification.blockers}
                  />
                </div>
              )}

              {activeTab === 'process' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-process" aria-labelledby="tab-process" className="space-y-6">
                  <ManufacturingOverview
                    readiness={solutionOverview.manufacturing.readiness}
                    specialProcesses={solutionOverview.manufacturing.specialProcesses}
                    delivery={solutionOverview.manufacturing.delivery}
                    constraints={solutionOverview.manufacturing.constraints}
                    capacity={solutionOverview.manufacturing.capacity}
                    supplierRisks={solutionOverview.manufacturing.supplierRisks}
                  />
                </div>
              )}

              {activeTab === 'management' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-management" aria-labelledby="tab-management" className="space-y-6">
                  <ConfigurationQualityOverview
                    baselineMetrics={solutionOverview.configuration.baselineMetrics}
                    changeImpacts={solutionOverview.configuration.changeImpacts}
                    baselineGaps={solutionOverview.configuration.baselineGaps}
                    qualityGates={solutionOverview.configuration.qualityGates}
                    nonConformances={solutionOverview.configuration.nonConformances}
                  />
                  <CollaborationHub
                    presence={solutionOverview.collaboration.presence}
                    activities={solutionOverview.collaboration.activities}
                    notifications={solutionOverview.collaboration.notifications}
                    actions={solutionOverview.collaboration.actions}
                    reviews={solutionOverview.collaboration.reviews}
                  />
                  {renderSolutionInputData()}
                  {renderOutputDataManagement()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
