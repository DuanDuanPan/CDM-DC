import type { OutputData } from '../types';

export const DEFAULT_OUTPUT_DATA: OutputData[] = [
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
      { name: '接口定义', value: '156', unit: '个', description: '系统接口总数' },
    ],
    dependencies: ['REQ-ENGINE-001'],
    deliverables: ['系统架构模型文件', 'Block定义文档', 'IBD图集', '活动图集', '接口规范'],
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
      { name: '图表数量', value: '89', unit: '个', description: '插图和表格数量' },
    ],
    deliverables: ['方案说明书正文', '技术附件', '图表集'],
  },
];
