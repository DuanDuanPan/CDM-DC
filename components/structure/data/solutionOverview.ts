import type { Version } from '../types';
import type { ManufacturingOverviewData } from '../manufacturing/types';

export const SOLUTION_VERSIONS: Version[] = [
    { id: 'v2.1', name: 'V2.1', date: '2024-01-15', author: '张工程师', description: '最新版本 - 性能优化', status: 'current' },
    { id: 'v2.0', name: 'V2.0', date: '2024-01-10', author: '李博士', description: '基线版本 - 设计基准', status: 'baseline' },
    { id: 'v1.5', name: 'V1.5', date: '2024-01-05', author: '王总师', description: '归档版本 - 初始设计', status: 'archived' }
  ];

const manufacturing: ManufacturingOverviewData = {
  readinessSummary: {
    score: 0.78,
    gateCompletion: 0.62,
    riskHeat: 0.4,
    metrics: [
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
    ]
  },
  stageGates: [
    {
      id: 'SG-01',
      title: 'PBOM Stage-Gate：关键件工艺评审完成',
      owner: '制造中心 · 许工',
      status: 'in-progress' as const,
      updatedAt: '2025-10-18',
      note: '待完成热等静压验证，计划 10-24 回传结论。'
    },
    {
      id: 'SG-02',
      title: '供应链就绪确认（核心供应商）',
      owner: '供应链 · 陈工',
      status: 'done' as const,
      updatedAt: '2025-10-12',
      note: '核心四家供应商均签署交付节奏承诺。'
    },
    {
      id: 'SG-03',
      title: '制造风险评审 & 缓解计划锁定',
      owner: '制造工程 · 李娜',
      status: 'open' as const,
      updatedAt: '2025-10-17',
      note: '需补齐涂层工艺替代路线假设验证结果。'
    }
  ],
  assumptions: [
    {
      id: 'ASS-01',
      topic: '热等静压设备夜班排产可覆盖样机',
      source: '制造例会纪要 2025-10-15',
      confidence: 'medium' as const,
      status: 'validating' as const,
      nextAction: '10-22 完成设备维护后复核排产窗口',
      dueAt: '2025-10-24'
    },
    {
      id: 'ASS-02',
      topic: '叶片涂层可外协至备份供应商',
      source: '工艺应急预案 V1.1',
      confidence: 'low' as const,
      status: 'pending' as const,
      nextAction: '待仿真团队确认外协参数与热特性影响',
      dueAt: '2025-10-28'
    },
    {
      id: 'ASS-03',
      topic: '控制电子盒软硬件构型与设计基线一致',
      source: '设计-制造对齐会 2025-10-10',
      confidence: 'high' as const,
      status: 'validated' as const,
      nextAction: '正样版本冻结后同步量产团队'
    }
  ],
  riskHighlights: [
    {
      id: 'RISK-01',
      title: '燃烧室衬套交付滑移',
      severity: 'red' as const,
      impact: '若延迟 5 天，将影响 W06 样机装配窗口。',
      mitigation: '已启动备份供应商切换预案并派驻质量工程师。',
      owner: '供应链 · 陈工',
      reviewAt: '2025-10-24',
      updatedAt: '2025-10-18'
    },
    {
      id: 'RISK-02',
      title: '涂层工艺验证待完成',
      severity: 'amber' as const,
      impact: '若验证失败需启用备选工艺，增加 3 天再验证时间。',
      mitigation: '与试验团队联合安排 10-21 补充样件测试。',
      owner: '表面处理 · 李工',
      reviewAt: '2025-10-23',
      updatedAt: '2025-10-17'
    },
    {
      id: 'RISK-03',
      title: '热等静压工装可用性',
      severity: 'amber' as const,
      impact: '工装标定若延期将压缩验证窗口 2 天。',
      mitigation: '维护结束后进行快速首件验证，必要时启用备份工装。',
      owner: '制造中心 · 许工',
      reviewAt: '2025-10-25',
      updatedAt: '2025-10-18'
    }
  ],
  riskRegisterLink: '#/manufacturing/risk-register',
  collaboration: {
    triggers: [
      {
        id: 'review',
        label: '发起工艺评审',
        description: 'PBOM Stage-Gate 复核会议',
        owner: '制造工程 · 李娜',
        lastTriggeredAt: '2025-10-17T09:00:00+08:00'
      },
      {
        id: 'request-input',
        label: '请求工艺输入',
        description: '向制造侧收集假设与风险更新',
        owner: '系统工程 · 赵强',
        lastTriggeredAt: '2025-10-19T14:30:00+08:00'
      },
      {
        id: 'sync-baseline',
        label: '同步至设计基线',
        description: '确认制造假设反馈至设计 V2.1',
        owner: '设计负责人 · 孙工',
        lastTriggeredAt: '2025-10-16T11:20:00+08:00'
      }
    ],
    updatedAt: '2025-10-19T15:30:00+08:00',
    note: '等待 10-24 Stage-Gate 复核结果后更新基线计划。'
  },
  snapshot: {
    version: 'PBOM-2025.10-S1',
    publishedAt: '2025-10-18',
    author: '工艺团队 · 李娜',
    note: '适用于 W05-W08 初样验证窗口'
  }
};

export const SOLUTION_OVERVIEW = {
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
    manufacturing,
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
      ,
      maturity: [
        {
          phase: '概念',
          target: 0.8,
          actual: 0.92,
          eta: '已完成',
          status: 'done' as const,
          owner: '系统工程 · 刘工'
        },
        {
          phase: '初样',
          target: 0.85,
          actual: 0.74,
          eta: '2024-02-05',
          status: 'warning' as const,
          owner: '试验经理 · 周工'
        },
        {
          phase: '试样',
          target: 0.9,
          actual: 0.58,
          eta: '2024-03-12',
          status: 'risk' as const,
          owner: '项目经理 · 王总'
        }
      ],
      assets: [
        {
          id: 'PLAN-REQ-001',
          name: '试验技术要求 V2.0',
          owner: '系统工程 · 刘工',
          version: 'v2.0',
          status: 'approved',
          updatedAt: '2024-01-15 14:00'
        },
        {
          id: 'PLAN-OUTLINE-002',
          name: '试验大纲 V1.3（初样）',
          owner: '试验保障 · 王工',
          version: 'v1.3',
          status: 'in-review',
          updatedAt: '2024-01-19 09:20'
        },
        {
          id: 'CARD-ENV-003',
          name: '环境应力试验卡片',
          owner: '环境实验室 · 朱工',
          version: 'v0.9',
          status: 'draft',
          updatedAt: '2024-01-17 18:45'
        }
      ],
      structureCoverage: [
        {
          nodeId: 'EBOM-ROOT/FAN/BLD-GRP/BLD-01',
          nodeName: '风扇叶片分段',
          target: 0.95,
          actual: 0.68,
          blockers: 2,
          risk: '高'
        },
        {
          nodeId: 'EBOM-ROOT/COMB/LINER',
          nodeName: '燃烧室内胆',
          target: 0.9,
          actual: 0.82,
          blockers: 0,
          risk: '中'
        },
        {
          nodeId: 'EBOM-ROOT/ACC/PUMP',
          nodeName: '燃油泵组件',
          target: 0.88,
          actual: 0.54,
          blockers: 1,
          risk: '高'
        }
      ],
      requirementMappings: [
        {
          requirementId: 'REQ-FT-001',
          title: '起飞推力保持 ≥120 kN',
          linkedTests: 4,
          status: 'partial',
          owner: '动力系统 · 孙工'
        },
        {
          requirementId: 'REQ-ENV-010',
          title: '整机环境应力合格',
          linkedTests: 3,
          status: 'planned',
          owner: '环境实验室 · 朱工'
        },
        {
          requirementId: 'REQ-CONT-021',
          title: '低温控制律稳定性',
          linkedTests: 2,
          status: 'gap',
          owner: '控制系统 · 李工'
        }
      ],
      resourceDependencies: [
        {
          type: '台架',
          name: '高空台 HAT-02',
          availability: 'W05-W07',
          status: 'conflict',
          owner: '试验保障 · 王工',
          impact: '与环境筛选冲突',
          mitigation: '计划调整至 W08'
        },
        {
          type: '仪器',
          name: '多通道压力采集 128ch',
          availability: 'W04-W06',
          status: 'ok',
          owner: '测量组 · 何工',
          impact: '可复用 TB-ENV-02',
          mitigation: '无需'
        }
      ],
      measurementAssets: [
        {
          instrument: '热像仪 FLIR-X900',
          calibrationDue: '2024-02-12',
          uncertainty: '±1.5°C',
          status: 'warning',
          owner: '计量室 · 马工'
        },
        {
          instrument: '六分力传感器 FS-6D',
          calibrationDue: '2024-03-01',
          uncertainty: '±0.2%',
          status: 'ok',
          owner: '计量室 · 马工'
        }
      ],
      simulationPlan: [
        {
          id: 'SIM-CORR-01',
          name: '起飞推力对标',
          model: 'CFD-V21-takeoff',
          metric: '推力偏差 ≤2%',
          window: 'W04',
          status: 'scheduled',
          targetDelta: '≤2%',
          lastSyncedAt: '2024-01-19 11:40',
          comparePayload: {
            runId: 'RUN-FT-20240118',
            projectId: 'PRJ-FT-01',
            testId: 'TEST-TK-ACC',
            channels: [
              { channel: 'ACC_X', unit: 'g', sampleRate: 5120, min: -1.8, max: 2.1 },
              { channel: 'ACC_Y', unit: 'g', sampleRate: 5120, min: -1.5, max: 1.9 },
              { channel: 'THRUST', unit: 'kN', sampleRate: 256, min: 95, max: 123 }
            ]
          }
        },
        {
          id: 'SIM-CORR-02',
          name: '低温控制律稳定性',
          model: 'CTRL-V18-lowtemp',
          metric: '超调 <5%',
          window: 'W05-W06',
          status: 'risk',
          targetDelta: '≤5%',
          guidance: '仿真模型待输出最新低温补偿结果，预计 2024-01-25 完成。'
        },
        {
          id: 'SIM-CORR-03',
          name: '巡航燃油效率核对',
          model: 'SYS-V20-cruise',
          metric: '耗油差异 ≤1.5%',
          window: 'W03',
          status: 'done',
          targetDelta: '≤1.5%',
          lastSyncedAt: '2024-01-15 17:20',
          guidance: 'Compare 已完成对齐并导出报告，归档于 验证数据包 PKG-FUNC-002。',
          comparePayload: {
            runId: 'RUN-CRUISE-20240112',
            projectId: 'PRJ-FT-01',
            testId: 'TEST-CR-PSD',
            channels: [
              { channel: 'PSD_THRUST', unit: 'kN^2/Hz', sampleRate: 1024, min: 0.12, max: 0.48 },
              { channel: 'FUEL_FLOW', unit: 'kg/s', sampleRate: 256, min: 0.28, max: 0.35 }
            ]
          }
        }
      ]
    } as SolutionVerificationData,
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
  } as const;
