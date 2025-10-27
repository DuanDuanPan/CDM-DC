export type ProjectCatalogItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  subCategory?: string;
  level: number;
  type: 'model' | 'tech' | 'simulation' | 'other';
  icon: string;
};

export const PROJECT_CATALOG: ProjectCatalogItem[] = [
  // 型号研制项目
  { id: 'p1', name: '发动机核心机', code: 'CJ-1000A', category: '型号研制项目', subCategory: 'CJ系列', level: 1, type: 'model', icon: 'ri-rocket-line' },
  { id: 'p2', name: '涡扇发动机', code: 'WS-20', category: '型号研制项目', subCategory: 'WS系列', level: 1, type: 'model', icon: 'ri-rocket-line' },
  { id: 'p3', name: '民用航发验证', code: 'CJ-1000AX', category: '型号研制项目', subCategory: 'CJ系列', level: 2, type: 'model', icon: 'ri-rocket-line' },

  // 技术研究项目
  { id: 'p4', name: '高温合金研究', code: 'GH4169', category: '技术研究项目', subCategory: '国家级课题', level: 1, type: 'tech', icon: 'ri-flask-line' },
  { id: 'p5', name: '叶片冷却技术', code: 'BLADE-COOL', category: '技术研究项目', subCategory: '集团级课题', level: 2, type: 'tech', icon: 'ri-flask-line' },
  { id: 'p6', name: '燃烧室优化', code: 'COMBUST-OPT', category: '技术研究项目', subCategory: '公司级课题', level: 1, type: 'tech', icon: 'ri-flask-line' },

  // 仿真型号项目
  { id: 'p7', name: '整机性能仿真', code: 'SIM-PERF', category: '仿真型号项目', subCategory: '性能仿真', level: 1, type: 'simulation', icon: 'ri-computer-line' },
  { id: 'p8', name: '结构强度分析', code: 'SIM-STRUCT', category: '仿真型号项目', subCategory: '结构仿真', level: 1, type: 'simulation', icon: 'ri-computer-line' },

  // 其他项目
  { id: 'p9', name: '质量管理体系', code: 'QMS-2024', category: '其他项目', level: 1, type: 'other', icon: 'ri-settings-3-line' },
  { id: 'p10', name: '人员培训计划', code: 'TRAIN-2024', category: '其他项目', level: 1, type: 'other', icon: 'ri-settings-3-line' },
];

export const PROJECT_TYPE_ICON: Record<ProjectCatalogItem['type'], string> = {
  model: 'ri-rocket-line',
  tech: 'ri-flask-line',
  simulation: 'ri-computer-line',
  other: 'ri-settings-3-line',
};

export const PROJECT_TYPE_COLOR: Record<ProjectCatalogItem['type'], string> = {
  model: 'text-blue-600 bg-blue-100',
  tech: 'text-green-600 bg-green-100',
  simulation: 'text-purple-600 bg-purple-100',
  other: 'text-gray-600 bg-gray-100',
};
