export type ExplorerFacetOption = {
  name: string;
  count: number;
  icon: string;
};

export type ExplorerFacet = {
  name: string;
  count: number;
  options: ExplorerFacetOption[];
};

export type ExplorerAsset = {
  id: number;
  name: string;
  type: string;
  version: string;
  size: string;
  lastModified: string;
  author: string;
  department: string;
  status: string;
  tags: string[];
  uploadTime: string;
};

export const DEFAULT_CUSTOM_TAGS = ['热分析', '强度校核', '疲劳寿命', '振动分析'];

export const EXPLORER_FACETS: ExplorerFacet[] = [
  {
    name: '文件类型',
    count: 1234,
    options: [
      { name: 'CAD模型', count: 456, icon: 'ri-cube-line' },
      { name: '仿真结果', count: 234, icon: 'ri-line-chart-line' },
      { name: '测试数据', count: 345, icon: 'ri-file-chart-line' },
      { name: '技术文档', count: 199, icon: 'ri-file-text-line' },
      { name: '图片资料', count: 156, icon: 'ri-image-line' },
      { name: '视频资料', count: 89, icon: 'ri-video-line' },
      { name: '表格数据', count: 234, icon: 'ri-table-line' },
      { name: 'PDF文档', count: 198, icon: 'ri-file-pdf-line' },
    ],
  },
  {
    name: '标签分类',
    count: 856,
    options: [
      { name: '结构设计', count: 123, icon: 'ri-building-line' },
      { name: '热力分析', count: 98, icon: 'ri-fire-line' },
      { name: '流体仿真', count: 87, icon: 'ri-drop-line' },
      { name: '材料特性', count: 76, icon: 'ri-palette-line' },
      { name: '控制系统', count: 65, icon: 'ri-settings-4-line' },
      { name: '性能测试', count: 54, icon: 'ri-speed-line' },
    ],
  },
  {
    name: '上传人员',
    count: 432,
    options: [
      { name: '张工程师', count: 89, icon: 'ri-user-line' },
      { name: '李博士', count: 76, icon: 'ri-user-line' },
      { name: '王总师', count: 67, icon: 'ri-user-line' },
      { name: '赵研究员', count: 54, icon: 'ri-user-line' },
    ],
  },
  {
    name: '部门分类',
    count: 321,
    options: [
      { name: '结构设计部', count: 89, icon: 'ri-building-2-line' },
      { name: '仿真分析部', count: 76, icon: 'ri-computer-line' },
      { name: '试验验证部', count: 67, icon: 'ri-test-tube-line' },
      { name: '材料工艺部', count: 54, icon: 'ri-tools-line' },
      { name: '质量保证部', count: 35, icon: 'ri-shield-check-line' },
    ],
  },
  {
    name: '版本状态',
    count: 678,
    options: [
      { name: '最新版本', count: 234, icon: 'ri-check-line' },
      { name: '基线版本', count: 187, icon: 'ri-bookmark-line' },
      { name: '草稿', count: 145, icon: 'ri-draft-line' },
      { name: '已归档', count: 112, icon: 'ri-archive-line' },
    ],
  },
];

export const EXPLORER_ASSETS: ExplorerAsset[] = [
  {
    id: 1,
    name: '涡轮叶片三维模型',
    type: 'CAD模型',
    version: 'V3.2',
    size: '245 MB',
    lastModified: '2024-01-15',
    author: '张工程师',
    department: '结构设计部',
    status: '最新版本',
    tags: ['结构设计', '叶片优化'],
    uploadTime: '2024-01-15 14:23',
  },
  {
    id: 2,
    name: '燃烧室温度场仿真',
    type: '仿真结果',
    version: 'V2.1',
    size: '1.2 GB',
    lastModified: '2024-01-14',
    author: '李博士',
    department: '仿真分析部',
    status: '基线版本',
    tags: ['热力分析', '燃烧室'],
    uploadTime: '2024-01-14 09:45',
  },
  {
    id: 3,
    name: '压气机性能测试报告',
    type: '测试数据',
    version: 'V1.5',
    size: '89 MB',
    lastModified: '2024-01-13',
    author: '王总师',
    department: '试验验证部',
    status: '最新版本',
    tags: ['性能测试', '压气机'],
    uploadTime: '2024-01-13 16:12',
  },
];
