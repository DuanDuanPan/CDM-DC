import type { SimulationCategory } from './types';

export const simulationCategories: SimulationCategory[] = [
  {
    id: 'sim-structure',
    name: '结构仿真',
    description: '静力、疲劳、振动等结构力学分析',
    icon: 'ri-building-3-line',
    color: '#1d4ed8',
    summary: '关注结构安全、疲劳与振动表现的关键仿真实例集合',
    instances: [
      {
        id: 'inst-struct-001',
        name: '机匣刚度与疲劳评估',
        version: 'v3.2',
        status: 'approved',
        owner: '李仿真',
        ownerAvatar: '/mock/avatars/li-fangzhen.png',
        reviewers: ['王总师', '赵审核'],
        createdAt: '2024-01-02 09:30',
        updatedAt: '2024-01-18 17:20',
        summary: '评估机匣在起飞、巡航、关机工况下的刚度与疲劳寿命，确定结构安全裕度。',
        resources: {
          cpuHours: 240,
          memoryGB: 512,
          gpuHours: 12,
          costEstimate: 68.5
        },
        tags: ['结构件', '疲劳', '刚度'],
        riskCount: 1,
        statusSummary: [
          { status: 'completed', count: 14, label: '已完成' },
          { status: 'running', count: 2, label: '运行中' },
          { status: 'failed', count: 1, label: '失败' }
        ],
        conditions: [
          {
            id: 'cond-struct-001',
            name: '起飞工况',
            parameters: [
              { name: '转速', value: 9800, unit: 'rpm' },
              { name: '温度', value: 650, unit: '°C' },
              { name: '压力', value: 3.2, unit: 'MPa' }
            ]
          },
          {
            id: 'cond-struct-002',
            name: '巡航工况',
            parameters: [
              { name: '转速', value: 8500, unit: 'rpm' },
              { name: '温度', value: 580, unit: '°C' },
              { name: '压力', value: 2.6, unit: 'MPa' }
            ]
          }
        ],
        highlights: [
          { metric: '最大位移', value: '1.8 mm', trend: '-3%', status: 'good' },
          { metric: '疲劳寿命裕度', value: '1.25', trend: '+0.08', status: 'good' },
          { metric: '危险截面应力', value: '820 MPa', trend: '+2%', status: 'warning' }
        ],
        folders: [
          {
            id: 'struct-001-geom',
            name: '几何模型',
            type: 'geometry',
            description: '用于本次仿真的几何模型与网格',
            riskLevel: 'medium',
            statusSummary: [
              { status: 'completed', count: 2, label: '几何/网格就绪' }
            ],
            files: [
              {
                id: 'file-geom-001',
                name: '机匣_v3.2.step',
                type: 'geometry',
                version: 'v3.2',
                size: '48 MB',
                status: 'completed',
                createdBy: '张建模',
                ownerAvatar: '/mock/avatars/zhang-jianmo.png',
                createdAt: '2024-01-03 10:15',
                updatedAt: '2024-01-05 09:40',
                description: '优化后的机匣几何模型，包含加强筋细节。',
                tags: ['几何', '优化'],
                statusReason: '完成网格修正与质量检查',
                lastRunAt: '2024-01-05 09:30',
                preview: {
                  meshInfo: {
                    nodes: 182340,
                    elements: 905220,
                    previewImage: '/mock/previews/geom-case.png'
                  }
                },
                contexts: {
                  project: '航空发动机核心机',
                  requirementLinks: ['SOL-REQ-101']
                }
              },
              {
                id: 'file-geom-002',
                name: '机匣网格_v3.2.msh',
                type: 'geometry',
                version: 'v3.2',
                size: '125 MB',
                status: 'completed',
                createdBy: '李网格',
                ownerAvatar: '/mock/avatars/li-wangge.png',
                createdAt: '2024-01-04 14:10',
                updatedAt: '2024-01-06 16:55',
                description: '机匣结构精细网格，局部加密危险截面。',
                statusReason: '网格质检通过，等待与求解器联调',
                lastRunAt: '2024-01-06 16:40',
                preview: {
                  meshInfo: {
                    nodes: 452380,
                    elements: 2134500,
                    previewImage: '/mock/previews/mesh-case.png'
                  }
                }
              }
            ]
          },
          {
            id: 'struct-001-model',
            name: '仿真模型',
            type: 'model',
            riskLevel: 'low',
            statusSummary: [
              { status: 'completed', count: 1, label: '模型已通过检查' }
            ],
            files: [
              {
                id: 'file-model-001',
                name: '机匣结构_ANSYS.apdl',
                type: 'model',
                version: 'v3.2',
                size: '3.4 MB',
                status: 'completed',
                createdBy: '李仿真',
                ownerAvatar: '/mock/avatars/li-fangzhen.png',
                createdAt: '2024-01-05 11:25',
                updatedAt: '2024-01-10 18:40',
                description: '包含材料、边界条件、加载的 ANSYS 模型脚本。',
                statusReason: '已联调完成，可直接提交运行',
                lastRunAt: '2024-01-10 18:30'
              }
            ]
          },
          {
            id: 'struct-001-docs',
            name: '说明文件',
            type: 'document',
            riskLevel: 'low',
            statusSummary: [
              { status: 'completed', count: 1, label: '文档同步完成' }
            ],
            files: [
              {
                id: 'file-doc-001',
                name: '仿真方案说明.docx',
                type: 'document',
                version: 'v3.2',
                size: '1.2 MB',
                status: 'completed',
                createdBy: '李仿真',
                ownerAvatar: '/mock/avatars/li-fangzhen.png',
                createdAt: '2024-01-05 09:20',
                updatedAt: '2024-01-12 14:50',
                description: '说明工况、材料、加载及求解器设置。',
                preview: {
                  documentSummary: '包含仿真目的、工况、材料、网格划分及求解策略，附带敏感度分析计划。'
                },
                statusReason: '完成最新评审意见修订',
                lastRunAt: '2024-01-12 14:45'
              }
            ]
          },
          {
            id: 'struct-001-results',
            name: '结果文件',
            type: 'result',
            riskLevel: 'medium',
            statusSummary: [
              { status: 'completed', count: 2, label: '已生成关键结果' }
            ],
            files: [
              {
                id: 'file-res-001',
                name: '起飞工况_位移曲线.csv',
                type: 'result',
                version: 'v3.2',
                size: '2.6 MB',
                status: 'completed',
                createdBy: '仿真平台自动',
                ownerAvatar: '/mock/avatars/system.png',
                createdAt: '2024-01-12 03:20',
                updatedAt: '2024-01-12 03:20',
                tags: ['曲线', '位移', '起飞'],
                statusReason: '运行完成，等待分析复核',
                lastRunAt: '2024-01-12 03:20',
                preview: {
                  curveData: [
                    [
                      { x: 0, y: 0 },
                      { x: 1, y: 0.3 },
                      { x: 2, y: 0.8 },
                      { x: 3, y: 1.2 },
                      { x: 4, y: 1.5 }
                    ],
                    [
                      { x: 0, y: 0 },
                      { x: 1, y: 0.28 },
                      { x: 2, y: 0.75 },
                      { x: 3, y: 1.1 },
                      { x: 4, y: 1.45 }
                    ]
                  ]
                },
                conditions: [
                  {
                    id: 'cond-struct-001',
                    name: '起飞工况',
                    parameters: [
                      { name: '时间', value: '0-4', unit: 's' },
                      { name: '载荷', value: '最大推力' }
                    ]
                  }
                ]
              },
              {
                id: 'file-res-002',
                name: '巡航工况_应力云图.png',
                type: 'result',
                version: 'v3.2',
                size: '4.1 MB',
                status: 'completed',
                createdBy: '仿真平台自动',
                ownerAvatar: '/mock/avatars/system.png',
                createdAt: '2024-01-12 05:10',
                updatedAt: '2024-01-12 05:10',
                tags: ['云图', '应力'],
                statusReason: '生成成功，待导入可视化台账',
                lastRunAt: '2024-01-12 05:10',
                preview: {
                  documentSummary: '图片预览: 巡航工况最大应力位置位于加强筋交界处。'
                },
                conditions: [
                  {
                    id: 'cond-struct-002',
                    name: '巡航工况',
                    parameters: [
                      { name: '速度', value: 0.82, unit: 'Mach' }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'struct-001-reports',
            name: '仿真报告',
            type: 'report',
            files: [
              {
                id: 'file-report-001',
                name: '机匣结构仿真报告_v3.2.pdf',
                type: 'report',
                version: 'v3.2',
                size: '6.8 MB',
                status: 'completed',
                createdBy: '李仿真',
                createdAt: '2024-01-13 10:25',
                updatedAt: '2024-01-14 09:10',
                preview: {
                  reportSections: [
                    { title: '1. 摘要', excerpt: '总结仿真目的、主要结论与建议。' },
                    { title: '2. 模型与工况', excerpt: '描述几何、网格、材料与边界条件。' },
                    { title: '3. 结果评估', excerpt: '列出关键指标、敏感性分析、可靠性评估。' }
                  ]
                }
              }
            ]
          }
        ],
        versionHistory: [
          { version: 'v3.2', date: '2024-01-18', change: '增加起飞工况疲劳分析', owner: '李仿真' },
          { version: 'v3.1', date: '2024-01-10', change: '优化网格细化方案', owner: '李仿真' },
          { version: 'v3.0', date: '2024-01-02', change: '建立新材料模型', owner: '李仿真' }
        ],
        compareBaselines: [
          { id: 'cmp-struct-ver', name: '版本对比', type: 'version', referenceVersion: 'v3.1' },
          { id: 'cmp-struct-cond', name: '工况对比', type: 'condition', referenceCondition: 'cond-struct-002' }
        ]
      },
      {
        id: 'inst-struct-002',
        name: '涡轮叶片振动分析',
        version: 'v2.4',
        status: 'in-progress',
        owner: '陈振动',
        reviewers: ['黄专家'],
        createdAt: '2023-12-12 08:40',
        updatedAt: '2024-01-15 19:30',
        summary: '分析叶片一阶/二阶模态与共振风险，评估振动疲劳寿命。',
        resources: {
          cpuHours: 180,
          memoryGB: 256,
          gpuHours: 6,
          costEstimate: 42.3
        },
        conditions: [
          {
            id: 'cond-vib-001',
            name: '共振工况',
            parameters: [
              { name: '转速', value: 10200, unit: 'rpm' },
              { name: '模态阶次', value: 2 }
            ]
          }
        ],
        highlights: [
          { metric: '最大振幅', value: '0.85 mm', trend: '+0.12', status: 'risk' },
          { metric: '阻尼比', value: '2.5%', trend: '+0.3%', status: 'good' }
        ],
        folders: [
          {
            id: 'vib-002-geom',
            name: '几何模型',
            type: 'geometry',
            riskLevel: 'medium',
            statusSummary: [
              { status: 'completed', count: 1, label: '几何已同步' }
            ],
            files: [
              {
                id: 'file-geom-050',
                name: '叶片几何_v2.4.step',
                type: 'geometry',
                version: 'v2.4',
                size: '32 MB',
                status: 'completed',
                createdBy: '何设计',
                createdAt: '2023-12-12 09:30',
                updatedAt: '2023-12-20 12:50',
                statusReason: '已同步叶片减重后的最终几何',
                lastRunAt: '2023-12-20 12:40',
                tags: ['几何', '叶片']
              }
            ]
          },
          {
            id: 'vib-002-results',
            name: '结果文件',
            type: 'result',
            files: [
              {
                id: 'file-res-050',
                name: '模态频率表.xlsx',
                type: 'result',
                version: 'v2.4',
                size: '1.1 MB',
                status: 'completed',
                createdBy: '仿真平台自动',
                createdAt: '2024-01-15 02:10',
                updatedAt: '2024-01-15 02:10',
                description: '包含前十阶模态频率与振型说明。'
              }
            ]
          }
        ],
        compareBaselines: [
          { id: 'cmp-vib-cond', name: '共振 vs 标准工况', type: 'condition', referenceCondition: 'cond-vib-001' }
        ]
      }
    ]
  },
  {
    id: 'sim-fluid',
    name: '流体仿真',
    description: '冷却、燃烧、流场、热力学分析',
    icon: 'ri-water-flash-line',
    instances: [
      {
        id: 'inst-fluid-001',
        name: '燃烧室流场分析',
        version: 'v1.6',
        status: 'in-progress',
        owner: '王流体',
        reviewers: ['李热力'],
        createdAt: '2024-01-06 11:22',
        updatedAt: '2024-01-18 21:40',
        summary: '分析燃烧室流场均匀性、温度分布及燃烧效率。',
        resources: {
          cpuHours: 320,
          memoryGB: 768,
          gpuHours: 24,
          costEstimate: 98.4
        },
        conditions: [
          {
            id: 'cond-fluid-001',
            name: '海平面起飞',
            parameters: [
              { name: '流量', value: 42, unit: 'kg/s' },
              { name: '燃油喷射温度', value: 520, unit: 'K' }
            ]
          },
          {
            id: 'cond-fluid-002',
            name: '高原巡航',
            parameters: [
              { name: '流量', value: 28, unit: 'kg/s' },
              { name: '燃油喷射温度', value: 490, unit: 'K' }
            ]
          }
        ],
        highlights: [
          { metric: '燃烧效率', value: '98.2%', trend: '+0.6%', status: 'good' },
          { metric: '出口温差', value: '±12 K', trend: '-3 K', status: 'good' },
          { metric: '最高温度', value: '1780 K', trend: '+20 K', status: 'warning' }
        ],
        folders: [
          {
            id: 'fluid-001-geom',
            name: '几何模型',
            type: 'geometry',
            riskLevel: 'medium',
            statusSummary: [
              { status: 'completed', count: 1, label: '几何最新' }
            ],
            files: [
              {
                id: 'file-geom-300',
                name: '燃烧室几何_v1.6.step',
                type: 'geometry',
                version: 'v1.6',
                size: '55 MB',
                status: 'completed',
                createdBy: '赵设计',
                createdAt: '2024-01-06 12:00',
                updatedAt: '2024-01-07 09:50',
                statusReason: '完成喷嘴段增厚调整',
                lastRunAt: '2024-01-07 09:40',
                tags: ['几何', '燃烧室']
              }
            ]
          },
          {
            id: 'fluid-001-model',
            name: '仿真模型',
            type: 'model',
            files: [
              {
                id: 'file-model-220',
                name: '燃烧室CFD设置.cas',
                type: 'model',
                version: 'v1.6',
                size: '6.5 MB',
                status: 'running',
                createdBy: '王流体',
                createdAt: '2024-01-08 13:40',
                updatedAt: '2024-01-17 20:10',
                description: 'Fluent 案例文件，包含湍流模型、燃烧模型、化学反应设置。'
              }
            ]
          },
          {
            id: 'fluid-001-results',
            name: '结果文件',
            type: 'result',
            files: [
              {
                id: 'file-res-320',
                name: '温度分布_海平面.vtk',
                type: 'result',
                version: 'v1.6',
                size: '32 MB',
                status: 'completed',
                createdBy: '仿真平台自动',
                createdAt: '2024-01-15 06:20',
                updatedAt: '2024-01-15 06:20',
                preview: {
                  documentSummary: '海平面起飞工况，最高温度1780K，出口温差±12K。'
                },
                conditions: [
                  {
                    id: 'cond-fluid-001',
                    name: '海平面起飞',
                    parameters: [
                      { name: '燃料热值', value: 42.5, unit: 'MJ/kg' }
                    ]
                  }
                ]
              },
              {
                id: 'file-res-321',
                name: '效率曲线_多工况.csv',
                type: 'result',
                version: 'v1.6',
                size: '2.1 MB',
                status: 'completed',
                createdBy: '仿真平台自动',
                createdAt: '2024-01-18 02:55',
                updatedAt: '2024-01-18 02:55',
                preview: {
                  curveData: [
                    [
                      { x: 0.7, y: 95.5 },
                      { x: 0.8, y: 97.2 },
                      { x: 0.85, y: 98.2 }
                    ],
                    [
                      { x: 0.7, y: 94.8 },
                      { x: 0.8, y: 96.4 },
                      { x: 0.85, y: 97.6 }
                    ]
                  ]
                },
                conditions: [
                  {
                    id: 'cond-fluid-001',
                    name: '海平面起飞',
                    parameters: []
                  },
                  {
                    id: 'cond-fluid-002',
                    name: '高原巡航',
                    parameters: []
                  }
                ]
              }
            ]
          },
          {
            id: 'fluid-001-reports',
            name: '仿真报告',
            type: 'report',
            files: [
              {
                id: 'file-report-210',
                name: '燃烧室流场仿真报告_v1.6.pdf',
                type: 'report',
                version: 'v1.6',
                size: '8.4 MB',
                status: 'draft',
                createdBy: '王流体',
                createdAt: '2024-01-18 18:30',
                updatedAt: '2024-01-18 18:30',
                preview: {
                  reportSections: [
                    { title: '关键指标', excerpt: '燃烧效率、出口温差、最高温度等关键结果。' },
                    { title: '敏感性分析', excerpt: '不同喷射温度对燃烧效率影响。' }
                  ]
                }
              }
            ]
          }
        ],
        compareBaselines: [
          { id: 'cmp-fluid-cond', name: '工况对比', type: 'condition', referenceCondition: 'cond-fluid-001' },
          { id: 'cmp-fluid-ver', name: '版本对比', type: 'version', referenceVersion: 'v1.5' }
        ]
      }
    ]
  }
];
