import type {
  TestProject,
  TestStructureIndexEntry,
  TestStructureNode,
  TestTypeDescriptor,
  TestAttachment,
  TestItem,
  TestInsight
} from './types';

export const TEST_STRUCTURE_TREE: TestStructureNode[] = [
  {
    id: 'engine',
    name: '航空发动机',
    level: 0,
    description: '型号 A 某型航空发动机整机',
    children: [
      {
        id: 'propulsion-system',
        name: '推进系统',
        level: 1,
        description: '推进与动力传输相关子系统',
        children: [
          {
            id: 'structural-system',
            name: '结构件系统',
            level: 2,
            description: '包含机匣、转子、壳体等结构部件',
            children: [
              {
                id: 'case-structure',
                name: '机匣结构',
                level: 3,
                description: '涵盖高压、中压、低压机匣',
                children: [
                  {
                    id: 'case-complete',
                    name: '结构整栋',
                    level: 4,
                    description: '整机匣装配体',
                    children: [
                      {
                        id: 'case-component',
                        name: '机匣组件',
                        level: 5,
                        description: '机匣组件级别',
                        children: []
                      }
                    ]
                  }
                ]
              },
              {
                id: 'rotor-structure',
                name: '转子部件',
                level: 3,
                description: '转子盘、叶片等高速部件',
                children: [
                  {
                    id: 'disk-module',
                    name: '盘模块',
                    level: 4,
                    description: '压气机/涡轮盘组件',
                    children: []
                  },
                  {
                    id: 'blade-module',
                    name: '叶片模块',
                    level: 4,
                    description: '动叶/静叶组件',
                    children: []
                  }
                ]
              }
            ]
          },
          {
            id: 'combustion-system',
            name: '燃烧系统',
            level: 2,
            description: '燃烧室与喷油单元',
            children: [
              {
                id: 'liner-module',
                name: '燃烧室衬套',
                level: 3,
                description: '热端关键部件',
                children: []
              },
              {
                id: 'fuel-nozzle',
                name: '喷油器组件',
                level: 3,
                description: '燃油供给组件',
                children: []
              }
            ]
          },
          {
            id: 'transmission-system',
            name: '传动系统',
            level: 2,
            description: '传动轴、齿轮箱等部件',
            children: [
              {
                id: 'gearbox',
                name: '附件齿轮箱',
                level: 3,
                children: []
              },
              {
                id: 'shaft',
                name: '传动轴系',
                level: 3,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'control-system',
        name: '控制系统',
        level: 1,
        description: '发动机控制、测量与健康监测',
        children: [
          {
            id: 'fadec',
            name: 'FADEC 控制器',
            level: 2,
            description: '全权限数字发动机控制系统',
            children: []
          },
          {
            id: 'sensor-suite',
            name: '传感器套件',
            level: 2,
            description: '测量与状态反馈组件',
            children: []
          }
        ]
      }
    ]
  }
];

const flattenStructureTree = (
  nodes: TestStructureNode[],
  parentPath: string[] = [],
  map = new Map<string, TestStructureIndexEntry>()
): Map<string, TestStructureIndexEntry> => {
  nodes.forEach((node) => {
    const path = [...parentPath, node.id];
    map.set(node.id, {
      id: node.id,
      name: node.name,
      level: node.level,
      path,
      parentId: parentPath[parentPath.length - 1],
      description: node.description
    });
    if (node.children?.length) {
      flattenStructureTree(node.children, path, map);
    }
  });
  return map;
};

export const TEST_STRUCTURE_INDEX = flattenStructureTree(TEST_STRUCTURE_TREE);

export const TEST_TYPES: TestTypeDescriptor[] = [
  {
    id: 'structural-dynamic',
    name: '结构动力学试验',
    code: 'STR-DYN',
    description: '模态、谐响应、振动耐受等结构动力学验证',
    icon: 'ri-radar-line',
    tone: 'emerald',
    defaultMethods: ['激振器扫频', '自由模态识别', '振动耐受试验'],
    keyMetrics: ['固有频率偏差', '振型相关性', '阻尼比', '响应峰值']
  },
  {
    id: 'thermal-environment',
    name: '热环境试验',
    code: 'THM-ENV',
    description: '热冲击、热循环、温度分布等环境适应性验证',
    icon: 'ri-temp-hot-line',
    tone: 'orange',
    defaultMethods: ['红外测绘', '热循环', '热冲击'],
    keyMetrics: ['温升梯度', '热应变', '裂纹萌生', '热疲劳寿命']
  },
  {
    id: 'performance-acceptance',
    name: '性能验收试验',
    code: 'PER-ACC',
    description: '控制系统性能、响应时间与稳定性验证',
    icon: 'ri-speed-up-line',
    tone: 'blue',
    defaultMethods: ['系统级功能验证', '闭环控制测试', '冗余切换试验'],
    keyMetrics: ['响应时间', '稳态误差', '冗余切换成功率', '数据一致性']
  },
  {
    id: 'durability-fatigue',
    name: '耐久与疲劳试验',
    code: 'DUR-FTG',
    description: '寿命、疲劳载荷、耐久性能验证',
    icon: 'ri-time-line',
    tone: 'violet',
    defaultMethods: ['载荷谱疲劳', '加速寿命试验', '健康监测'],
    keyMetrics: ['循环次数', '裂纹增长速率', '剩余寿命估计', '润滑状态']
  }
];

const attachment = (values: Partial<TestAttachment> & Pick<TestAttachment, 'id' | 'name' | 'type' | 'size' | 'updatedAt' | 'owner'>): TestAttachment => ({
  url: '#',
  description: '',
  ...values
});

const item = (values: TestItem): TestItem => values;

const insight = (values: TestInsight): TestInsight => values;

export const TEST_PROJECTS: TestProject[] = [
  {
    id: 'TEST-PJT-001',
    code: 'T-2025-ENG-STR-001',
    name: '机匣组件结构振动评估',
    structurePath: ['engine', 'propulsion-system', 'structural-system', 'case-structure', 'case-complete', 'case-component'],
    typeId: 'structural-dynamic',
    status: 'in-progress',
    owner: '王向阳',
    team: '结构振动试验组',
    objective: '验证机匣组件在额定及超转速谱下的模态与响应满足设计余量要求。',
    scope: '覆盖 0Hz-120%转速频段模态与谐响应测试，包含装机边界条件与温度加载工况。',
    coverage: 68,
    readiness: 55,
    riskLevel: 'medium',
    startDate: '2025-08-18',
    endDate: '2025-10-30',
    lastUpdated: '2025-10-15',
    summary: '已完成基准模态测试与第一轮谐响应，正在进行温变条件下的补充试验。',
    dependencies: ['结构件系统设计基线冻结（2025-08-05）', '振动夹具 2025-09-05 完成验收'],
    instrumentation: ['三向加速度计阵列（64 通道）', '激振器控制系统', '激光测振仪', '高温加热套'],
    documents: [
      attachment({
        id: 'DOC-STR-01',
        name: '机匣组件振动试验大纲 v2.3',
        type: 'spec',
        size: '2.6 MB',
        updatedAt: '2025-09-20',
        owner: '张工',
        description: '覆盖模态、谐响应及边界条件描述'
      }),
      attachment({
        id: 'DOC-STR-02',
        name: '模态试验原始数据包 (10-12)',
        type: 'dataset',
        size: '4.8 GB',
        updatedAt: '2025-10-12',
        owner: '数据采集服务器'
      }),
      attachment({
        id: 'DOC-STR-03',
        name: '谐响应对比报告-阶段一',
        type: 'report',
        size: '1.2 MB',
        updatedAt: '2025-10-14',
        owner: '刘工',
        description: '含基准模型对比与偏差说明'
      })
    ],
    items: [
      item({
        id: 'TEST-ITEM-001',
        name: '整机基准模态试验',
        status: 'completed',
        method: '激振器扫频 + 多点传感同步采集',
        fixture: '机匣整机专用夹具（含温控模块）',
        sampleBatch: '机匣原型 001#',
        environment: '常温，固定边界',
        criteria: '一阶至六阶固有频率偏差 ≤ ±3%，振型相关系数 ≥ 0.92',
        instrumentation: ['三向加速度计 48 只', '激光测振仪', '多通道数据采集系统'],
        schedule: {
          plannedStart: '2025-09-01',
          plannedEnd: '2025-09-05',
          actualStart: '2025-09-03',
          actualEnd: '2025-09-06',
          chamber: '结构实验室 2 号台'
        },
        metrics: [
          { id: 'M-001', name: '一阶固有频率', value: '265 Hz (+1.5%)', status: 'within-limit', unit: 'Hz', target: '261 ± 8 Hz' },
          { id: 'M-002', name: '三阶固有频率', value: '482 Hz (+4.2%)', status: 'warning', unit: 'Hz', target: '463 ± 10 Hz' },
          { id: 'M-003', name: '振型相关系数', value: '0.95', status: 'within-limit' }
        ],
        attachments: [
          attachment({
            id: 'ATT-STR-001',
            name: '模态识别曲线对比图',
            type: 'image',
            size: '6.2 MB',
            updatedAt: '2025-09-07',
            owner: '数据分析组'
          }),
          attachment({
            id: 'ATT-STR-002',
            name: '试验记录表-模态',
            type: 'report',
            size: '840 KB',
            updatedAt: '2025-09-08',
            owner: '李工'
          })
        ],
        remarks: '三阶固有频率偏差偏大，需联动仿真团队核查边界约束建模。'
      }),
      item({
        id: 'TEST-ITEM-002',
        name: '机匣组件谐响应测试',
        status: 'in-progress',
        method: '扫频激振 + 激光测振',
        fixture: '温控夹具 + 加热套',
        sampleBatch: '机匣原型 001#',
        environment: '300℃ 加热稳态',
        criteria: '关键位置响应峰值 ≤ 基准 × 1.1，阻尼比 ≥ 设计值 95%',
        instrumentation: ['高温加速度计', '激光测振仪', '红外测温系统'],
        schedule: {
          plannedStart: '2025-10-01',
          plannedEnd: '2025-10-18',
          actualStart: '2025-10-08',
          chamber: '结构实验室 3 号台'
        },
        metrics: [
          { id: 'M-004', name: '响应峰值（LVDT-12）', value: '0.82 g', status: 'within-limit', unit: 'g', target: '≤ 0.9 g' },
          { id: 'M-005', name: '阻尼比', value: '4.5%', status: 'warning', unit: '%', target: '≥ 5.0%' }
        ],
        attachments: [
          attachment({
            id: 'ATT-STR-003',
            name: '温度加载曲线',
            type: 'dataset',
            size: '1.1 GB',
            updatedAt: '2025-10-12',
            owner: '热控小组'
          })
        ],
        remarks: '阻尼比偏低，计划追加涂层状态检查。'
      })
    ],
    insights: [
      insight({
        id: 'INS-001',
        title: '三阶固有频率偏差超出 3%',
        status: 'risk',
        description: '疑似夹具边界条件差异，需联合仿真组复核。',
        owners: ['结构振动试验组', '产品仿真中心'],
        dueDate: '2025-10-22'
      }),
      insight({
        id: 'INS-002',
        title: '阻尼比偏低需追加试验',
        status: 'action',
        description: '安排 10-20 进行补测，并采集涂层状态数据。',
        owners: ['试验计划组']
      })
    ]
  },
  {
    id: 'TEST-PJT-002',
    code: 'T-2025-ENG-THM-004',
    name: '燃烧室热冲击验证',
    structurePath: ['engine', 'propulsion-system', 'combustion-system', 'liner-module'],
    typeId: 'thermal-environment',
    status: 'planned',
    owner: '赵倩',
    team: '热环境试验组',
    objective: '验证燃烧室衬套在极端热冲击条件下的结构完整性与裂纹萌生阈值。',
    scope: '高温/低温循环 500 次，包含燃油循环及热浸试验。',
    coverage: 32,
    readiness: 40,
    riskLevel: 'high',
    startDate: '2025-11-05',
    endDate: '2026-01-10',
    lastUpdated: '2025-10-13',
    summary: '试验准备阶段，夹具设计已冻结，等待热源系统完成标定。',
    dependencies: ['燃烧室设计 DCR-145 已关闭', '热源系统标定（2025-10-25）'],
    instrumentation: ['高温炉 + 快速冷却模块', '红外热像仪', '热电偶阵列'],
    documents: [
      attachment({
        id: 'DOC-THM-01',
        name: '热冲击试验方案 v1.1',
        type: 'spec',
        size: '1.8 MB',
        updatedAt: '2025-10-02',
        owner: '赵倩'
      }),
      attachment({
        id: 'DOC-THM-02',
        name: '试验工装设计图纸',
        type: 'spec',
        size: '6.5 MB',
        updatedAt: '2025-10-09',
        owner: '工装中心'
      })
    ],
    items: [
      item({
        id: 'TEST-ITEM-101',
        name: '热冲击循环（±650℃）',
        status: 'planned',
        method: '快速升温 / 速降温循环',
        fixture: '双区热冲击炉 + 冷空气喷嘴',
        sampleBatch: '燃烧室衬套 2025-预研批次',
        environment: '高温腔 + 常温腔交替',
        criteria: '无贯穿裂纹，裂纹扩展速率 ≤ 0.2 mm/100 次循环',
        instrumentation: ['热电偶 16 点阵列', '红外热像仪', '位移传感器'],
        schedule: {
          plannedStart: '2025-11-08',
          plannedEnd: '2025-12-05'
        },
        metrics: [],
        attachments: [],
        remarks: '需在试前完成热源系统精度复验。'
      })
    ],
    insights: [
      insight({
        id: 'INS-101',
        title: '热源系统标定存在 3% 漂移风险',
        status: 'risk',
        description: '近期标定报告显示漂移，需在 10-25 前完成复核。',
        owners: ['热控团队'],
        dueDate: '2025-10-25'
      })
    ]
  },
  {
    id: 'TEST-PJT-003',
    code: 'T-2025-ENG-DUR-003',
    name: '附件齿轮箱耐久寿命试验',
    structurePath: ['engine', 'propulsion-system', 'transmission-system', 'gearbox'],
    typeId: 'durability-fatigue',
    status: 'in-progress',
    owner: '陈斌',
    team: '传动试验组',
    objective: '验证附件齿轮箱在 1.5 倍载荷谱下的疲劳裕度及润滑稳定性。',
    scope: '执行 1.2e6 循环加速寿命试验，包含润滑中断工况。',
    coverage: 54,
    readiness: 62,
    riskLevel: 'medium',
    startDate: '2025-07-10',
    endDate: '2025-12-28',
    lastUpdated: '2025-10-12',
    summary: '寿命循环已完成 68%，润滑油温控制偏高需跟踪。',
    dependencies: ['润滑系统健康监测算法上线', '备用齿轮准备完毕'],
    instrumentation: ['扭矩传感器', '振动监测系统', '油温/油压传感器', '声发射监测'],
    documents: [
      attachment({
        id: 'DOC-DUR-01',
        name: '耐久试验记录（批次 2025-09）',
        type: 'report',
        size: '2.1 MB',
        updatedAt: '2025-09-28',
        owner: '试验记录员'
      })
    ],
    items: [
      item({
        id: 'TEST-ITEM-201',
        name: '1.5×额定扭矩寿命循环',
        status: 'in-progress',
        method: '载荷谱疲劳 + 健康监测',
        fixture: '齿轮箱寿命台架',
        sampleBatch: '附件齿轮箱 批次#AP-05',
        environment: '常温，润滑油温 95℃ ± 5℃',
        criteria: '循环数 ≥ 1.2e6，无异常振动谱，剩余寿命预测 ≥ 200h',
        instrumentation: ['扭矩传感器', '振动传感器阵列', '油温传感器', '声发射探头'],
        schedule: {
          plannedStart: '2025-07-15',
          plannedEnd: '2025-12-18',
          actualStart: '2025-07-18'
        },
        metrics: [
          { id: 'M-201', name: '累计循环数', value: '8.1e5 次', status: 'within-limit' },
          { id: 'M-202', name: '油温峰值', value: '104℃', status: 'warning', target: '≤ 100℃' }
        ],
        attachments: [
          attachment({
            id: 'ATT-DUR-001',
            name: '健康监测日记录 (10-11)',
            type: 'dataset',
            size: '850 MB',
            updatedAt: '2025-10-11',
            owner: '健康监测系统'
          })
        ],
        remarks: '油温略高，已申请换用新冷却模块。'
      })
    ],
    insights: [
      insight({
        id: 'INS-201',
        title: '油温偏高需替换冷却模块',
        status: 'action',
        description: '10-20 安排停机维护，预计 2 天恢复。',
        owners: ['传动试验组', '维护团队'],
        dueDate: '2025-10-20'
      })
    ]
  },
  {
    id: 'TEST-PJT-004',
    code: 'T-2025-CTRL-PER-002',
    name: 'FADEC 综合性能验证',
    structurePath: ['engine', 'control-system', 'fadec'],
    typeId: 'performance-acceptance',
    status: 'completed',
    owner: '李杉',
    team: '控制系统试验组',
    objective: '验证 FADEC 控制器在全飞行包线内的响应时间、冗余切换与故障处理能力。',
    scope: '覆盖 36 个典型工况，包含 12 个异常切换场景与远程升级流程。',
    coverage: 100,
    readiness: 96,
    riskLevel: 'low',
    startDate: '2025-05-05',
    endDate: '2025-09-28',
    lastUpdated: '2025-09-29',
    summary: '试验闭环完成，已生成正式验收报告并归档。',
    dependencies: ['软件版本 V4.2 基线冻结', '冗余通道硬件复验通过'],
    instrumentation: ['高速数据记录仪', '工况仿真器', '故障注入单元'],
    documents: [
      attachment({
        id: 'DOC-PER-01',
        name: 'FADEC 综合性能试验报告',
        type: 'report',
        size: '3.4 MB',
        updatedAt: '2025-09-29',
        owner: '李杉',
        description: '覆盖测试结果、问题清单与闭环情况'
      }),
      attachment({
        id: 'DOC-PER-02',
        name: '异常切换试验录像（节选）',
        type: 'video',
        size: '1.9 GB',
        updatedAt: '2025-09-27',
        owner: '试验录播系统'
      })
    ],
    items: [
      item({
        id: 'TEST-ITEM-301',
        name: '全包线控制响应测试',
        status: 'completed',
        method: '工况仿真 + 实机闭环',
        fixture: '控制系统综合试验台',
        sampleBatch: 'FADEC 控制器 批次#CTRL-07',
        environment: '温度范围 -40℃ ~ +85℃',
        criteria: '响应时间 ≤ 80 ms，稳态误差 ≤ 0.5%，失效保护触发时间 ≤ 120 ms',
        instrumentation: ['数据记录仪', '故障注入模块', '温湿度舱'],
        schedule: {
          plannedStart: '2025-06-01',
          plannedEnd: '2025-08-20',
          actualStart: '2025-05-28',
          actualEnd: '2025-08-18'
        },
        metrics: [
          { id: 'M-301', name: '平均响应时间', value: '62 ms', status: 'within-limit', unit: 'ms', target: '≤ 80 ms' },
          { id: 'M-302', name: '失效保护触发', value: '104 ms', status: 'within-limit', unit: 'ms', target: '≤ 120 ms' },
          { id: 'M-303', name: '冗余切换成功率', value: '100%', status: 'within-limit', unit: '%' }
        ],
        attachments: [
          attachment({
            id: 'ATT-PER-001',
            name: '响应时间原始数据',
            type: 'dataset',
            size: '620 MB',
            updatedAt: '2025-08-19',
            owner: '数据记录仪'
          })
        ]
      })
    ],
    insights: [
      insight({
        id: 'INS-301',
        title: '软件 V4.3 升级计划纳入下一轮试验',
        status: 'info',
        description: '计划于 2026Q1 引入新功能，需要提前筹划验证场景。',
        owners: ['控制系统研发']
      })
    ]
  }
];

export const projectMatchesStructurePath = (project: TestProject, structurePath: string[]): boolean => {
  return structurePath.every((id, index) => project.structurePath[index] === id);
};

export const projectMatchesExactStructure = (project: TestProject, structurePath: string[]): boolean => {
  return project.structurePath.length === structurePath.length && projectMatchesStructurePath(project, structurePath);
};

export const collectProjectsInSubtree = (projects: TestProject[], structurePath: string[]): TestProject[] => {
  return projects.filter(project => projectMatchesStructurePath(project, structurePath));
};

export const collectProjectsByTypeAtStructure = (
  projects: TestProject[],
  structurePath: string[],
  typeId: string
): TestProject[] => {
  return projects.filter(
    project =>
      project.typeId === typeId &&
      project.structurePath.length === structurePath.length &&
      projectMatchesStructurePath(project, structurePath)
  );
};

export const getTestType = (typeId: string): TestTypeDescriptor | undefined => {
  return TEST_TYPES.find(type => type.id === typeId);
};
