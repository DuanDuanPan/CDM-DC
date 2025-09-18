import { RequirementItem } from '../types';

export const requirementsByNode: Record<string, RequirementItem[]> = {
  '001': [
    {
      id: 'SOL-REQ-001',
      name: '航空发动机总体性能需求',
      type: 'performance',
      priority: 'high',
      status: 'completed',
      content: '航空发动机总成应满足整体推力、燃油经济性、可靠性等核心性能指标，确保在各种飞行工况下稳定运行。',
      parameters: [
        { name: '最大推力', value: '120', unit: 'kN', range: '118-125' },
        { name: '巡航推力', value: '85', unit: 'kN', range: '80-90' },
        { name: '燃油消耗率', value: '0.52', unit: 'kg/kN·h', range: '0.50-0.55' },
        { name: '推重比', value: '8.5', unit: '-', range: '>8.0' },
        { name: '总体重量', value: '1850', unit: 'kg', range: '<1900' }
      ],
      attachments: [
        { type: 'document', name: '发动机总体技术要求.pdf' },
        { type: 'table', name: '性能指标对照表.xlsx' }
      ]
    },
    {
      id: 'SOL-REQ-002',
      name: '发动机系统集成需求',
      type: 'interface',
      priority: 'high',
      status: 'completed',
      content: '发动机与飞机系统的集成接口要求，包括安装接口、电气接口、燃油接口等。',
      parameters: [
        { name: '安装接口数量', value: '8', unit: '个', range: '6-10' },
        { name: '电气接口电压', value: '28', unit: 'V', range: '24-32' },
        { name: '燃油接口压力', value: '3.5', unit: 'MPa', range: '3.0-4.0' }
      ]
    }
  ],
  '001-01': [
    {
      id: 'SOL-REQ-101',
      name: '推进系统性能需求',
      type: 'performance',
      priority: 'high',
      status: 'completed',
      content: '推进系统应提供足够的推力，满足飞行器的推进需求，具备良好的推力特性和燃油经济性。',
      parameters: [
        { name: '系统推力效率', value: '92', unit: '%', range: '>90' },
        { name: '推力矢量角度', value: '±15', unit: '°', range: '±20' },
        { name: '推力响应时间', value: '2.5', unit: 's', range: '<3' },
        { name: '系统可用性', value: '99.8', unit: '%', range: '>99.5' }
      ]
    },
    {
      id: 'SOL-REQ-102',
      name: '推进系统控制需求',
      type: 'functional',
      priority: 'high',
      status: 'in-progress',
      content: '推进系统应具备精确的推力控制能力，支持自动和手动控制模式。',
      parameters: [
        { name: '推力控制精度', value: '±2', unit: '%', range: '±3' },
        { name: '控制响应时间', value: '0.5', unit: 's', range: '<1' },
        { name: '控制模式数量', value: '3', unit: '种', range: '≥3' }
      ]
    }
  ],
  'REQ-ENGINE-001': [
    {
      id: 'REQ-ENG-001-OVERVIEW',
      name: '产品级性能与可靠性指标',
      type: 'performance',
      priority: 'high',
      status: 'in-progress',
      content: '保证整机推力、耗油率、可靠性与寿命指标达到总体要求，并在关键工况下具备足够裕度。',
      parameters: [
        { name: '最大推力', value: '120', unit: 'kN', range: '118-125' },
        { name: '耗油率', value: '0.52', unit: 'kg/kN·h', range: '≤0.55' },
        { name: '无故障时间', value: '1,200', unit: 'h', range: '≥1,000' }
      ],
      attachments: [
        { type: 'document', name: '产品级性能指标清单.xlsx' },
        { type: 'table', name: '寿命与可靠性分解表.xlsx' }
      ]
    },
    {
      id: 'REQ-ENG-001-INTEGRITY',
      name: '系统成套性与接口一致性',
      type: 'interface',
      priority: 'high',
      status: 'pending',
      content: '确保各子系统接口定义一致，成套交付物满足评审基线要求，并与PLM主数据保持同步。',
      parameters: [
        { name: '接口定义完成度', value: '92', unit: '%', range: '≥95%' },
        { name: '成套交付物完成度', value: '18/24', unit: '项', range: '24/24' }
      ],
      attachments: [
        { type: 'document', name: '接口一致性检查表.docx' }
      ]
    }
  ],
  'REQ-PROPULSION-001': [
    {
      id: 'REQ-PROP-001-PERF',
      name: '推进子系统推力与响应指标',
      type: 'performance',
      priority: 'high',
      status: 'in-progress',
      content: '推进子系统需保证不同高度/速度工况下的推力输出稳定，并快速响应节流指令。',
      parameters: [
        { name: '推力稳定度', value: '±1.5', unit: '%', range: '±2%' },
        { name: '节流响应时间', value: '2.3', unit: 's', range: '<=2.5' },
        { name: '工况覆盖', value: '8/10', unit: '工况', range: '10/10' }
      ],
      attachments: [
        { type: 'table', name: '推进工况矩阵.xlsx' },
        { type: 'document', name: '推力响应仿真报告.pdf' }
      ]
    },
    {
      id: 'REQ-PROP-001-ENV',
      name: '环境适应性与抗振要求',
      type: 'quality',
      priority: 'medium',
      status: 'pending',
      content: '在低温、高温、沙尘等复杂环境下保持可靠运行，并满足振动与噪声限制。',
      parameters: [
        { name: '环境温度范围', value: '-40 ~ 55', unit: '°C', range: '-55 ~ 60' },
        { name: '振动级别', value: '4.5', unit: 'g rms', range: '≤5.0' }
      ]
    }
  ],
  'REQ-COMPRESSOR-BLADE': [
    {
      id: 'REQ-BLADE-001-GEOM',
      name: '叶片几何与材料规范',
      type: 'functional',
      priority: 'high',
      status: 'in-progress',
      content: '确保叶片几何精度、涂层厚度和材料性能满足设计指标，为后续装配和试验提供依据。',
      parameters: [
        { name: '弦长公差', value: '±0.12', unit: 'mm', range: '±0.15' },
        { name: '涂层厚度', value: '80', unit: 'µm', range: '75-90' },
        { name: '材料屈服强度', value: '1,120', unit: 'MPa', range: '≥1,100' }
      ],
      attachments: [
        { type: 'document', name: '叶片制造规范.docx' },
        { type: 'image', name: '叶片截面测量.png' }
      ]
    }
  ],
  'REQ-COMPRESSOR-ROTOR': [
    {
      id: 'REQ-ROTOR-001-DYN',
      name: '转子动平衡与临界转速',
      type: 'performance',
      priority: 'high',
      status: 'in-progress',
      content: '确保压气机转子在全速范围内动平衡满足规格，并与临界转速保持安全裕度。',
      parameters: [
        { name: '动平衡等级', value: 'G1.0', unit: '-', range: '≤G1.0' },
        { name: '第一临界转速裕度', value: '25', unit: '%', range: '≥20%' },
        { name: '轴向窜动', value: '0.08', unit: 'mm', range: '≤0.1' }
      ],
      attachments: [
        { type: 'table', name: '转子动平衡试验结果.xlsx' }
      ]
    }
  ],
  'REQ-COMBUSTOR-LINER': [
    {
      id: 'REQ-LINER-001-THERMAL',
      name: '燃烧室衬套热负荷与寿命',
      type: 'performance',
      priority: 'high',
      status: 'pending',
      content: '控制燃烧室壁面温度与热应力，确保寿命满足设计目标并支持维修策略。',
      parameters: [
        { name: '壁面最高温度', value: '980', unit: '°C', range: '≤1,000' },
        { name: '热应力裕度', value: '12', unit: '%', range: '≥10%' },
        { name: '寿命目标', value: '2,500', unit: 'h', range: '≥2,000' }
      ],
      attachments: [
        { type: 'document', name: '燃烧室热分析报告.pdf' }
      ]
    }
  ],
  'REQ-TURBINE-DISK': [
    {
      id: 'REQ-TURBINE-001-STRUCT',
      name: '涡轮盘结构强度与裂纹控制',
      type: 'quality',
      priority: 'high',
      status: 'in-progress',
      content: '保证涡轮盘在最大转速和温度条件下的安全系数，并建立裂纹监测与维修策略。',
      parameters: [
        { name: '安全系数', value: '1.35', unit: '-', range: '≥1.30' },
        { name: '裂纹初检频次', value: '每200h', unit: '-', range: '≤250h' }
      ],
      attachments: [
        { type: 'table', name: '涡轮盘应力校核结果.xlsx' },
        { type: 'document', name: '裂纹监测方案.docx' }
      ]
    }
  ],
  'REQ-CONTROL-001': [
    {
      id: 'REQ-CONTROL-001-LOGIC',
      name: '控制律与冗余策略',
      type: 'functional',
      priority: 'high',
      status: 'in-progress',
      content: '定义主/备份控制律、故障检测与切换策略，确保在控制链路异常时安全降级。',
      parameters: [
        { name: '控制律版本', value: 'v3.1', unit: '-', range: '最新' },
        { name: '冗余切换时间', value: '45', unit: 'ms', range: '≤50' },
        { name: '故障检测覆盖率', value: '92', unit: '%', range: '≥95%' }
      ],
      attachments: [
        { type: 'document', name: '控制律说明书.pdf' },
        { type: 'table', name: 'FMEA-控制子系统.xlsx' }
      ]
    }
  ],
  'REQ-FADEC-UNIT': [
    {
      id: 'REQ-FADEC-001-INT',
      name: 'FADEC 硬件接口与实时性',
      type: 'interface',
      priority: 'high',
      status: 'completed',
      content: '确认FADEC与传感器/执行机构的接口、电源、数据链路及实时性满足要求。',
      parameters: [
        { name: '接口带宽', value: '10', unit: 'Mbps', range: '≥8' },
        { name: '实时任务延时', value: '8', unit: 'ms', range: '≤10' },
        { name: '电源冗余等级', value: 'A', unit: '-', range: 'A' }
      ],
      attachments: [
        { type: 'document', name: 'FADEC 接口规范.docx' },
        { type: 'table', name: '实时任务调度表.xlsx' }
      ]
    }
  ],
  'REQ-SENSOR-UNIT': [
    {
      id: 'REQ-SENSOR-001-ACCURACY',
      name: '传感器精度与可靠性',
      type: 'performance',
      priority: 'medium',
      status: 'in-progress',
      content: '关键传感器需满足测量精度、漂移和可靠性要求，支持在线标定与健康监测。',
      parameters: [
        { name: '压力传感器精度', value: '±0.75', unit: '%FS', range: '±1.0%FS' },
        { name: '温度传感器漂移', value: '0.3', unit: '°C/年', range: '≤0.5' },
        { name: 'MTBF', value: '18,000', unit: 'h', range: '≥15,000' }
      ]
    }
  ],
  'REQ-AUXILIARY-001': [
    {
      id: 'REQ-AUX-001-POWER',
      name: '辅助系统功率与能源管理',
      type: 'performance',
      priority: 'medium',
      status: 'pending',
      content: '协调辅助系统功率分配，保证在极端工况下不超出电气/液压容量。',
      parameters: [
        { name: '最大综合功率', value: '65', unit: 'kW', range: '≤70' },
        { name: '电源冗余度', value: 'N+1', unit: '-', range: '≥N+1' }
      ]
    }
  ],
  'REQ-LUBRICATION-UNIT': [
    {
      id: 'REQ-LUBE-001-FLOW',
      name: '润滑系统流量与颗粒度',
      type: 'performance',
      priority: 'high',
      status: 'in-progress',
      content: '润滑系统需提供稳定流量，并控制油液颗粒度满足轴承寿命要求。',
      parameters: [
        { name: '循环流量', value: '180', unit: 'L/min', range: '≥170' },
        { name: '颗粒度等级', value: 'NAS 6', unit: '-', range: '≤NAS 7' },
        { name: '油温范围', value: '50-85', unit: '°C', range: '45-90' }
      ],
      attachments: [
        { type: 'table', name: '润滑系统测试记录.xlsx' }
      ]
    }
  ],
  'REQ-COOLING-UNIT': [
    {
      id: 'REQ-COOL-001-THERM',
      name: '冷却系统热交换效率',
      type: 'performance',
      priority: 'medium',
      status: 'pending',
      content: '保证关键部位冷却效率和压降满足要求，并预留监测接口用于健康管理。',
      parameters: [
        { name: '换热效率', value: '87', unit: '%', range: '≥85%' },
        { name: '系统压降', value: '0.18', unit: 'MPa', range: '≤0.2' },
        { name: '监测接口数量', value: '6', unit: '个', range: '≥5' }
      ],
      attachments: [
        { type: 'document', name: '冷却系统方案说明.pdf' }
      ]
    }
  ]
};
