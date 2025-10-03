import type { EbomParameterDeck } from '../../components/structure/ebom/types';

const parameterGroups: Record<string, EbomParameterDeck> = {
  'EBOM-ROOT/FAN/BLD-GRP/BLD-01': {
    summary: '风扇叶片 Sprint5 关键参数：覆盖性能、材料、气动包线与寿命等六大分组，Mock 数据仅用于交互演示。',
    groups: [
      {
        id: 'performance',
        title: '系统性能参数',
        caption: '直连整机性能与经济性，关注指标兑现情况。',
        focus: '巡航工况与起飞推力段表现',
        parameters: [
          {
            id: 'PERF-TSFC',
            name: '比油耗贡献',
            value: '-1.8',
            unit: '%',
            dimension: '0D',
            status: 'ok',
            trend: 'down',
            target: '-1.5%',
            limit: '-1.0%',
            description: '相对基线 B 的 TSFC 改善幅度，负值代表节油收益。',
            lastUpdated: '2025-09-12',
            owner: '总体性能组',
            tags: ['巡航', '节油'],
            assumption: '巡航 Mach 0.8，海平面标准大气。',
            verification: ['CFD 结果与风洞试验偏差 1.6%', '装机试车计划：2025-10-15'],
            baselineContribution: '整机比油耗目标达成度 +0.3%',
            sources: [
              {
                id: 'SRC-CFD-45M',
                type: '仿真',
                reference: 'CFD-2025-09-12-RunA',
                summary: '45M cells 混合网格，湍流模型 k-ω SST',
                owner: '仿真中心',
                updatedAt: '2025-09-12',
                confidence: 0.82,
                link: 'https://mock.sim-center.local/runs/CFD-2025-09-12-RunA'
              },
              {
                id: 'SRC-WTT-2308',
                type: '试验',
                reference: '风洞试验 WTT-2308',
                summary: '0.4 缩比风洞，攻角扫线 0°~10°',
                owner: '空气动力试验所',
                updatedAt: '2025-08-30',
                confidence: 0.78
              }
            ]
          },
          {
            id: 'PERF-THRUST',
            name: '起飞推力贡献',
            value: '+2.1',
            unit: '%',
            dimension: '0D',
            status: 'watch',
            trend: 'up',
            target: '+2.5%',
            limit: '+1.5%',
            description: '风扇叶片改型后对起飞推力的贡献。',
            lastUpdated: '2025-09-05',
            owner: '总体性能组',
            tags: ['起飞', '推力'],
            assumption: 'ISA+15℃，起飞推力模式。',
            verification: ['试车台阶段 A 数据拟合完成'],
            sources: [
              {
                id: 'SRC-TCF-0905',
                type: '运行数据',
                reference: 'TCF-StageA-0905',
                summary: '台架 80h 数据，推力传感器零漂已校正',
                owner: '试车站',
                updatedAt: '2025-09-05',
                confidence: 0.71
              }
            ]
          }
        ]
      },
      {
        id: 'material',
        title: '材料与结构参数',
        caption: '聚焦材料性能、成形窗口和结构安全余度。',
        focus: 'Ti-6Al-4V 材料批次一致性',
        parameters: [
          {
            id: 'MAT-YS',
            name: '室温屈服强度',
            value: '980',
            unit: 'MPa',
            dimension: '0D',
            status: 'ok',
            trend: 'flat',
            limit: '920 MPa',
            description: '批次平均屈服强度，含 3σ 安全系数。',
            lastUpdated: '2025-09-08',
            owner: '材料工程组',
            tags: ['材料', '力学'],
            sources: [
              {
                id: 'SRC-MAT-LAB',
                type: '试验',
                reference: 'MAT-LAB-Report-225',
                summary: '常温拉伸，取样 12 件',
                owner: '材料实验室',
                updatedAt: '2025-09-08',
                confidence: 0.9
              },
              {
                id: 'SRC-SPEC-001',
                type: '文档',
                reference: '标准件规范 MAT-SPEC-001',
                summary: '材料规范 A 版',
                owner: '标准化管理部',
                updatedAt: '2025-07-18',
                confidence: 0.6
              }
            ]
          },
          {
            id: 'MAT-COATING',
            name: '表面涂层厚度',
            value: '65 ±5',
            unit: 'µm',
            dimension: '0D',
            status: 'watch',
            trend: 'up',
            limit: '70 µm',
            description: '热障涂层厚度控制，偏离上限需关注热重。',
            lastUpdated: '2025-09-10',
            owner: '工艺工程组',
            tags: ['涂层', '工艺'],
            sources: [
              {
                id: 'SRC-COAT-NDT',
                type: '试验',
                reference: 'NDT-Coating-Scan-18',
                summary: '激光测厚，覆盖率 95%',
                owner: '质检中心',
                updatedAt: '2025-09-10',
                confidence: 0.76
              }
            ]
          }
        ]
      },
      {
        id: 'scalar',
        title: '0D 设计计算参数',
        caption: '标量类设计约束与装配设定。',
        focus: '装配间隙与叶型设定值',
        parameters: [
          {
            id: 'CALC-TIP-CLEAR',
            name: '尖隙冷态间隙',
            value: '0.45',
            unit: 'mm',
            dimension: '0D',
            status: 'risk',
            trend: 'down',
            target: '0.55 mm',
            limit: '0.40 mm',
            description: '冷态尖隙，兼顾热胀与转子偏心。',
            lastUpdated: '2025-09-03',
            owner: '结构组',
            tags: ['装配', '公差'],
            assumption: '机匣热胀 0.38 mm；转子偏心 0.12 mm。',
            verification: ['已提交 CCB-2025-0915 调整机匣镗孔'],
            sources: [
              {
                id: 'SRC-CALC-CLR',
                type: '推导',
                reference: 'CalcSheet-Clearance-v3',
                summary: 'Excel 计算书 + 偏心分析',
                owner: '结构组',
                updatedAt: '2025-09-03',
                confidence: 0.68
              }
            ]
          },
          {
            id: 'CALC-TWIST',
            name: '安装扭角偏置',
            value: '+0.6',
            unit: '°',
            dimension: '0D',
            status: 'ok',
            trend: 'flat',
            description: '安装扭角偏置量，匹配新攻角包线。',
            lastUpdated: '2025-09-01',
            owner: '总体性能组',
            tags: ['攻角', '安装'],
            sources: [
              {
                id: 'SRC-OPT-TWIST',
                type: '仿真',
                reference: 'OptStudy-Twist-2025Q3',
                summary: '多目标优化：总压比+噪声',
                owner: '设计分析室',
                updatedAt: '2025-09-01',
                confidence: 0.74
              }
            ]
          }
        ]
      },
      {
        id: 'curve',
        title: '1D 包线 / 曲线参数',
        caption: '利用样条/序列描述的气动与载荷行为。',
        focus: '攻角-升力系数曲线',
        parameters: [
          {
            id: 'CURVE-CL-ALPHA',
            name: '升力系数包线',
            value: '查看曲线',
            dimension: '1D',
            status: 'watch',
            trend: 'flat',
            description: '攻角 - 升力系数曲线，α=12° 后转折需关注失速。',
            lastUpdated: '2025-09-11',
            owner: '空气动力组',
            tags: ['气动', '包线'],
            sparkline: [
              { label: '0°', value: 0.12 },
              { label: '4°', value: 0.42 },
              { label: '8°', value: 0.73 },
              { label: '12°', value: 0.88 },
              { label: '14°', value: 0.81 }
            ],
            sources: [
              {
                id: 'SRC-CL-DB',
                type: '仿真',
                reference: 'CFD-Polar-DB-2025Q3',
                summary: '攻角步进 2°，雷诺数 1.3e6',
                owner: '仿真中心',
                updatedAt: '2025-09-11',
                confidence: 0.8
              },
              {
                id: 'SRC-WTT-POLAR',
                type: '试验',
                reference: '风洞极曲线报告 WTT-2308',
                summary: '与仿真拟合误差均方根 3.2%',
                owner: '空气动力试验所',
                updatedAt: '2025-08-30',
                confidence: 0.75
              }
            ]
          }
        ]
      },
      {
        id: 'interface',
        title: '接口与环境参数',
        caption: '跨系统耦合与任务环境输入。',
        focus: '流量与噪声约束接口',
        parameters: [
          {
            id: 'INT-MASSFLOW',
            name: '额定质量流量',
            value: '328',
            unit: 'kg/s',
            dimension: '0D',
            status: 'ok',
            description: '同 LPT 接口质量流量，含 2% 余量。',
            lastUpdated: '2025-09-06',
            owner: '总体性能组',
            tags: ['接口', '流量'],
            sources: [
              {
                id: 'SRC-ICD-204',
                type: '文档',
                reference: 'ICD-204 Fan-LPT Interface',
                summary: '接口控制文件 B2',
                owner: '系统工程部',
                updatedAt: '2025-09-02',
                confidence: 0.7
              }
            ]
          },
          {
            id: 'INT-NOISE',
            name: '最大噪声贡献',
            value: '97',
            unit: 'dB',
            dimension: '0D',
            status: 'watch',
            limit: '95 dB',
            description: '滑行+起飞噪声贡献，需与声学组协同。',
            lastUpdated: '2025-09-07',
            owner: '声学组',
            tags: ['噪声', '法规'],
            sources: [
              {
                id: 'SRC-NOISE-CSA',
                type: '仿真',
                reference: 'NoiseCSA-2025Q3',
                summary: '声学半经验模型 + 气动输入',
                owner: '声学组',
                updatedAt: '2025-09-07',
                confidence: 0.65
              }
            ]
          }
        ]
      },
      {
        id: 'reliability',
        title: '可靠性与寿命参数',
        caption: '寿命、维修与风险评估指标。',
        focus: '叶片寿命与风险评估',
        parameters: [
          {
            id: 'REL-LCF',
            name: '低周疲劳寿命',
            value: '14,800',
            unit: 'cycle',
            dimension: '0D',
            status: 'ok',
            trend: 'flat',
            limit: '12,000 cycle',
            description: '基于热/力耦合分析的叶根低周疲劳寿命。',
            lastUpdated: '2025-09-09',
            owner: '结构强度组',
            tags: ['寿命', '风险'],
            sources: [
              {
                id: 'SRC-LCF-ABAQUS',
                type: '仿真',
                reference: 'Abaqus-LCF-2025Q3',
                summary: '热-机耦合，安全系数 1.5',
                owner: '结构强度组',
                updatedAt: '2025-09-09',
                confidence: 0.77
              },
              {
                id: 'SRC-LCF-TEST',
                type: '试验',
                reference: 'LCF-Test-Rep-118',
                summary: '叶根件，R=0.1，温度 550℃',
                owner: '强度实验室',
                updatedAt: '2025-08-25',
                confidence: 0.73
              }
            ]
          },
          {
            id: 'REL-MTBR',
            name: '平均拆换间隔',
            value: '4,200',
            unit: 'hour',
            dimension: '0D',
            status: 'watch',
            target: '4,500 hour',
            description: '基于维护记录推算的平均拆换间隔。',
            lastUpdated: '2025-09-04',
            owner: '保障工程组',
            tags: ['保障', '寿命'],
            sources: [
              {
                id: 'SRC-MCMT-DB',
                type: '运行数据',
                reference: 'Maintenance-DB-2025Q2',
                summary: '样本 36 台套，过滤异常',
                owner: '保障工程组',
                updatedAt: '2025-09-04',
                confidence: 0.6
              }
            ]
          }
        ]
      }
    ]
  },
  'EBOM-ROOT/HPT/DISK': {
    summary: '高压涡轮盘参数集（Mock），覆盖温度、材料与寿命关键项。',
    groups: [
      {
        id: 'thermal',
        title: '热负荷参数',
        caption: '涡轮盘热分布与冷却指标。',
        focus: '盘腹温度与梯度',
        parameters: [
          {
            id: 'THM-HUB-TEMP',
            name: '盘腹最高温度',
            value: '690',
            unit: '℃',
            dimension: '0D',
            status: 'watch',
            limit: '700 ℃',
            description: '盘腹最大等效温度，接近允许上限需关注冷却裕度。',
            lastUpdated: '2025-09-10',
            owner: '热工组',
            tags: ['热负荷'],
            sources: [
              {
                id: 'SRC-THERM-ABAQUS',
                type: '仿真',
                reference: 'Thermal-Run-HTD-2025Q3',
                summary: '三维稳态传热仿真',
                owner: '热工组',
                updatedAt: '2025-09-10',
                confidence: 0.79
              }
            ]
          },
          {
            id: 'THM-GRAD',
            name: '径向温度梯度',
            value: '18',
            unit: '℃/cm',
            dimension: '0D',
            status: 'ok',
            description: '盘腹至轮缘的温度梯度。',
            lastUpdated: '2025-09-10',
            owner: '热工组',
            tags: ['热负荷'],
            sources: [
              {
                id: 'SRC-THERM-GRAD',
                type: '仿真',
                reference: 'Thermal-Gradients-v5',
                summary: '热分析脚本输出',
                owner: '热工组',
                updatedAt: '2025-09-10',
                confidence: 0.78
              }
            ]
          }
        ]
      },
      {
        id: 'struct',
        title: '结构与寿命参数',
        caption: '旋转部件强度、寿命与应力裕度。',
        focus: '应力与寿命评估',
        parameters: [
          {
            id: 'STR-STRESS',
            name: '危险截面主应力',
            value: '1,120',
            unit: 'MPa',
            dimension: '0D',
            status: 'watch',
            limit: '1,150 MPa',
            description: '最大主应力，包含离心 + 热应力。',
            lastUpdated: '2025-09-08',
            owner: '结构强度组',
            tags: ['应力', '寿命'],
            sources: [
              {
                id: 'SRC-STR-ANSYS',
                type: '仿真',
                reference: 'ANSYS-MaxStress-2025Q3',
                summary: '非线性求解，材料 DS Rene 104',
                owner: '结构强度组',
                updatedAt: '2025-09-08',
                confidence: 0.74
              }
            ]
          },
          {
            id: 'STR-LCF',
            name: '低周疲劳寿命',
            value: '9,600',
            unit: 'cycle',
            dimension: '0D',
            status: 'risk',
            limit: '10,000 cycle',
            description: '危险截面寿命低于目标，需评估改进。',
            lastUpdated: '2025-09-09',
            owner: '结构强度组',
            tags: ['寿命', '风险'],
            sources: [
              {
                id: 'SRC-LCF-REPORT',
                type: '试验',
                reference: 'LCF-Report-HTD-22',
                summary: '高温低周疲劳，验证温度 650℃',
                owner: '强度实验室',
                updatedAt: '2025-09-06',
                confidence: 0.72
              }
            ]
          }
        ]
      },
      {
        id: 'interface',
        title: '接口与装配参数',
        caption: '与叶片、轴承及冷却系统的接口约束。',
        focus: '轴向定位与冷却流量',
        parameters: [
          {
            id: 'INT-AXIAL-LOC',
            name: '轴向定位容差',
            value: '±0.08',
            unit: 'mm',
            dimension: '0D',
            status: 'ok',
            description: '与轴承壳体对接的轴向定位公差。',
            lastUpdated: '2025-09-07',
            owner: '装配工程组',
            tags: ['装配', '接口'],
            sources: [
              {
                id: 'SRC-ICD-330',
                type: '文档',
                reference: 'ICD-330 Turbine Disk/Bearing',
                summary: '接口控制文件 B1',
                owner: '系统工程部',
                updatedAt: '2025-09-01',
                confidence: 0.68
              }
            ]
          },
          {
            id: 'INT-COOL-FLOW',
            name: '冷却流量',
            value: '6.5',
            unit: 'kg/s',
            dimension: '0D',
            status: 'watch',
            limit: '6.0 kg/s',
            description: '供叶片冷却的流量需求，需要与附件齿箱供油协调。',
            lastUpdated: '2025-09-10',
            owner: '热工组',
            tags: ['冷却', '接口'],
            sources: [
              {
                id: 'SRC-COOL-CFD',
                type: '仿真',
                reference: 'CoolingFlowBalance-v2',
                summary: '冷却网络分析',
                owner: '热工组',
                updatedAt: '2025-09-10',
                confidence: 0.7
              }
            ]
          }
        ]
      }
    ]
  }
};

export default parameterGroups;
