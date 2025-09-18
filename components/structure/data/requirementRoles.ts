import { RequirementRoleKey, RequirementRoleInsight } from '../types';

export const requirementRoles: Array<{ id: RequirementRoleKey; name: string; icon: string; description: string }> = [
  { id: 'system-team', name: '系统组', icon: 'ri-stack-line', description: '聚焦顶层性能指标、接口匹配与链路覆盖' },
  { id: 'assembly-team', name: '总装组', icon: 'ri-tools-line', description: '关注装配约束、物料就绪与XBOM映射' },
  { id: 'component-lead', name: '专业负责人', icon: 'ri-puzzle-line', description: '核对部件指标、接口一致性与风险RPN' },
  { id: 'simulation-team', name: '仿真团队', icon: 'ri-computer-line', description: '关心仿真覆盖、边界条件与验证计划' },
  { id: 'test-team', name: '试验团队', icon: 'ri-test-tube-line', description: '确认试验工况、数据要求与日程安排' },
  { id: 'quality-team', name: '质量审计', icon: 'ri-shield-check-line', description: '检查状态闭环、文档齐备与基线符合性' },
  { id: 'management', name: '项目管理', icon: 'ri-briefcase-4-line', description: '评估风险级别、关键决策点与资源需求' },
  { id: 'data-steward', name: '数据治理', icon: 'ri-database-2-line', description: '维护主数据映射、追溯链路与变更记录' }
];

export const requirementRoleInsights: Record<RequirementRoleKey, RequirementRoleInsight> = {
  'system-team': {
    title: '系统组关注摘要',
    overview: '复核顶层性能指标、接口覆盖度与需求追溯链路，确保系统方案满足总体指标。',
    metrics: [
      { label: '性能指标满足度', value: '92%', trend: '+3%', status: 'good', note: '基于最新仿真结果和试验数据', source: '仿真月报', updatedAt: '2024-01-18' },
      { label: '接口匹配完成率', value: '88%', trend: '+5%', status: 'warning', note: '燃油接口仍待确认', source: '系统集成台账', updatedAt: '2024-01-19' },
      { label: '上下游追溯覆盖', value: '96%', trend: '+1%', status: 'excellent', note: '缺压气机子系统一条反馈链', source: '追溯图谱', updatedAt: '2024-01-17' }
    ],
    focusAreas: [
      { label: '推力/耗油指标', detail: '核查最大推力、巡航推力、一小时耗油量是否与需求一致。', icon: 'ri-speed-up-line' },
      { label: '动力学接口', detail: '确认控制律输入输出、燃油压力接口参数签署完毕。', icon: 'ri-plug-line' },
      { label: '闭环链路', detail: '对照需求-方案-仿真-试验链路，补齐缺失节点。', icon: 'ri-links-line' }
    ],
    structuredParameters: [
      { name: '最大推力', requirement: '118-125 kN', current: '120 kN', gap: '+1.6%', status: 'met', note: '满足并保留裕度', source: '性能仿真-V2.1', updatedAt: '2024-01-18' },
      { name: '推力响应时间', requirement: '< 3 s', current: '2.4 s', gap: '+0.6 s', status: 'met', note: '响应满足计划值', source: '控制仿真', updatedAt: '2024-01-16' },
      { name: '燃油接口压力', requirement: '3.0–4.0 MPa', current: '待提供', gap: '缺数据', status: 'risk', note: '等待供应商反馈', source: '供应商接口确认', updatedAt: '—' }
    ],
    linkedRequirements: ['SOL-REQ-001', 'SOL-REQ-002', 'REQ-PROPULSION-001'],
    actions: [
      { title: '完成燃油接口压力签署', owner: '系统组-李工', due: '2024-01-25', status: 'open', remark: '需协调供应商确认压力等级' },
      { title: '补齐压气机反馈链路', owner: '系统组-王工', due: '2024-01-24', status: 'in-progress' },
      { title: '提交系统层基线评审摘要', owner: '系统组-项目秘书', due: '2024-01-28', status: 'open' }
    ]
  },
  'assembly-team': {
    title: '总装组关注摘要',
    overview: '聚焦装配约束、工装物料就绪和XBOM映射差异，确保交付可执行。',
    metrics: [
      { label: '装配可达性评估', value: '80%', trend: '+4%', status: 'warning', note: '燃烧室段仍需工艺验证', source: '工艺三维审查', updatedAt: '2024-01-20' },
      { label: '物料就绪度', value: '85%', trend: '+2%', status: 'good', note: '关键件已入库', source: '仓储系统', updatedAt: '2024-01-19' },
      { label: 'XBOM映射完成度', value: '91%', trend: '+2%', status: 'good', note: '剩余5项待映射', source: 'XBOM映射表', updatedAt: '2024-01-18' }
    ],
    focusAreas: [
      { label: '接口工装', detail: '核对部装接口公差与工装夹具匹配情况。', icon: 'ri-hammer-line' },
      { label: '工艺特殊性', detail: '识别热配、紧固等特殊工艺的需求约束。', icon: 'ri-tools-line' },
      { label: 'XBOM差异', detail: '跟踪方案/需求视图差异，准备替代定位策略。', icon: 'ri-exchange-box-line' }
    ],
    structuredParameters: [
      { name: '压气机装配间隙', requirement: '0.18–0.22 mm', current: '0.24 mm', gap: '-0.02 mm', status: 'risk', note: '需评估装配偏差', source: '试装记录', updatedAt: '2024-01-19' },
      { name: '燃烧室外壳同轴度', requirement: '≤0.15 mm', current: '0.12 mm', gap: '+0.03 mm', status: 'met', note: '满足需求', source: '测量报告', updatedAt: '2024-01-17' },
      { name: '工装编号绑定率', requirement: '100%', current: '88%', gap: '-12%', status: 'watch', note: '部分工装尚未编目', source: '工装台账', updatedAt: '2024-01-20' }
    ],
    linkedRequirements: ['REQ-COMBUSTOR-LINER', 'REQ-CONTROL-001'],
    actions: [
      { title: '更新5项未映射XBOM节点', owner: '总装-赵工', due: '2024-01-26', status: 'in-progress' },
      { title: '复核压气机间隙控制方案', owner: '工艺-钱工', due: '2024-01-27', status: 'open', remark: '需要试装验证数据' },
      { title: '补齐工装台账', owner: '总装-资料员', due: '2024-01-29', status: 'open' }
    ]
  },
  'component-lead': {
    title: '专业负责人关注摘要',
    overview: '审视部件级关键指标、接口一致性和风险RPN，指导设计迭代。',
    metrics: [
      { label: '指标满足率', value: '89%', trend: '+2%', status: 'good', note: '主要指标趋稳', source: '部件指标看板', updatedAt: '2024-01-18' },
      { label: '接口一致率', value: '93%', trend: '+3%', status: 'good', note: '控制接口尚需调优', source: '接口匹配检查', updatedAt: '2024-01-17' },
      { label: '高RPN项', value: '3', trend: '-1', status: 'warning', note: '轴封磨损风险仍在', source: 'FMEA清单', updatedAt: '2024-01-19' }
    ],
    focusAreas: [
      { label: '热应力裕度', detail: '评估极端工况下材料安全边界。', icon: 'ri-fire-line' },
      { label: '转速/振动', detail: '关注接近共振的临界转速与振型。', icon: 'ri-speed-line' },
      { label: '接口匹配', detail: '同步几何、电气、控制接口参数以防断链。', icon: 'ri-plug-2-line' }
    ],
    structuredParameters: [
      { name: '转速红线距离', requirement: '≥20%', current: '25%', gap: '+5%', status: 'met', note: '安全裕度充足', source: '结构仿真', updatedAt: '2024-01-15' },
      { name: '热流密度红线', requirement: '≤850 kW/m²', current: '910 kW/m²', gap: '-7%', status: 'risk', note: '需优化冷却设计', source: '热分析', updatedAt: '2024-01-18' },
      { name: '控制接口延迟', requirement: '≤40 ms', current: '35 ms', gap: '+5 ms', status: 'met', note: '满足控制要求', source: '控制系统测试', updatedAt: '2024-01-19' }
    ],
    linkedRequirements: ['SOL-REQ-101', 'SOL-REQ-102'],
    actions: [
      { title: '优化燃烧室冷却结构', owner: '燃烧室负责人', due: '2024-02-05', status: 'open', remark: '与仿真团队联动' },
      { title: '完成轴封磨损失效分析', owner: '机械可靠性', due: '2024-01-30', status: 'in-progress' }
    ]
  },
  'simulation-team': {
    title: '仿真团队关注摘要',
    overview: '对照需求定义仿真计划、边界条件与结果回传，保证覆盖完整性。',
    metrics: [
      { label: '仿真覆盖率', value: '87%', trend: '+5%', status: 'good', note: '剩余热耦合工况未完成', source: '仿真任务中心', updatedAt: '2024-01-20' },
      { label: '结果回传率', value: '78%', trend: '+6%', status: 'warning', note: '需要补齐试验关联', source: '数据回传日志', updatedAt: '2024-01-19' },
      { label: '模型有效性', value: 'A级', trend: '稳定', status: 'excellent', note: '与试验差异<5%', source: '模型验证报告', updatedAt: '2024-01-18' }
    ],
    focusAreas: [
      { label: '边界条件一致性', detail: '确保温度、压力、流量等输入与需求一致。', icon: 'ri-flow-chart' },
      { label: '关键工况', detail: '安排极限、失效及稳态工况仿真验证。', icon: 'ri-timer-flash-line' },
      { label: '结果追溯', detail: '将仿真结果与需求ID绑定，支持差异分析。', icon: 'ri-link-m' }
    ],
    structuredParameters: [
      { name: '入口马赫数', requirement: '0.60–0.70', current: '0.65', gap: '+0.0', status: 'met', note: '已对齐需求', source: '流体仿真案例#A21', updatedAt: '2024-01-18' },
      { name: '极限温度工况', requirement: '650 °C', current: '仿真排期中', gap: '待执行', status: 'watch', note: '需调度计算资源', source: '仿真排程', updatedAt: '2024-01-20' },
      { name: '仿真结果回传', requirement: '100%', current: '78%', gap: '-22%', status: 'risk', note: '部分案例未上传数据库', source: '数据仓库', updatedAt: '2024-01-19' }
    ],
    linkedRequirements: ['SOL-REQ-101', 'REQ-CONTROL-001'],
    actions: [
      { title: '完成热耦合仿真并回传', owner: '仿真-刘工', due: '2024-01-31', status: 'open' },
      { title: '补全仿真-试验关联标签', owner: '仿真数据管理员', due: '2024-02-02', status: 'open' }
    ]
  },
  'test-team': {
    title: '试验团队关注摘要',
    overview: '确认试验计划覆盖关键需求指标，跟踪数据采集与脱敏入库。',
    metrics: [
      { label: '计划覆盖度', value: '82%', trend: '+4%', status: 'warning', note: '临界转速试验待排期', source: '试验计划表', updatedAt: '2024-01-19' },
      { label: '数据入库率', value: '74%', trend: '+8%', status: 'warning', note: '台架数据脱敏中', source: '数据治理流程', updatedAt: '2024-01-20' },
      { label: '问题闭环率', value: '68%', trend: '+6%', status: 'warning', note: '4项试验问题未关闭', source: '试验问题单', updatedAt: '2024-01-18' }
    ],
    focusAreas: [
      { label: '工况排程', detail: '确保热态、冷态、极限等工况均有覆盖。', icon: 'ri-calendar-check-line' },
      { label: '数据质量', detail: '关注时序同步、传感器标定及噪声处理。', icon: 'ri-pulse-line' },
      { label: '安全合规', detail: '确认试验风险评估与审批流程到位。', icon: 'ri-shield-keyhole-line' }
    ],
    structuredParameters: [
      { name: '台架试验工况覆盖', requirement: '5/5', current: '4/5', gap: '-1', status: 'risk', note: '缺临界转速工况', source: '台架计划', updatedAt: '2024-01-20' },
      { name: '数据入库完成度', requirement: '100%', current: '74%', gap: '-26%', status: 'risk', note: '待脱敏上传', source: '数据入库监控', updatedAt: '2024-01-19' },
      { name: '试验安全措施', requirement: '全覆盖', current: '已提交审批', gap: '进行中', status: 'watch', note: '等待安全负责人签字', source: '安全审批系统', updatedAt: '2024-01-18' }
    ],
    linkedRequirements: ['REQ-TURBINE-DISK', 'REQ-SENSOR-UNIT'],
    actions: [
      { title: '安排临界转速试验', owner: '试验-孙工', due: '2024-02-03', status: 'open' },
      { title: '完成台架数据脱敏上传', owner: '试验数据员', due: '2024-01-27', status: 'in-progress' }
    ]
  },
  'quality-team': {
    title: '质量/审计关注摘要',
    overview: '检查需求闭环状态、文档齐备性与基线符合性，支撑评审。',
    metrics: [
      { label: '闭环完成率', value: '76%', trend: '+6%', status: 'warning', note: '7条需求尚未完成验证', source: '质量闭环系统', updatedAt: '2024-01-19' },
      { label: '文档齐备率', value: '88%', trend: '+4%', status: 'good', note: '缺少2份签署记录', source: '文档库', updatedAt: '2024-01-20' },
      { label: '基线一致率', value: '94%', trend: '+1%', status: 'excellent', note: '差异已形成评审记录', source: '基线比对报告', updatedAt: '2024-01-18' }
    ],
    focusAreas: [
      { label: '需求状态', detail: '核查需求状态标签与证据是否一致。', icon: 'ri-flag-line' },
      { label: '签署文档', detail: '确认关键节点签署文件/审批流程完备。', icon: 'ri-file-check-line' },
      { label: '基线追溯', detail: '确保需求变更均关联到基线版本。', icon: 'ri-focus-line' }
    ],
    structuredParameters: [
      { name: '需求验证证据', requirement: '100%上传', current: '88%', gap: '-12%', status: 'watch', note: '待上传试验报告', source: '证据台账', updatedAt: '2024-01-19' },
      { name: '审批记录齐备度', requirement: '100%', current: '92%', gap: '-8%', status: 'watch', note: '缺两份电子签', source: '审批系统', updatedAt: '2024-01-20' },
      { name: '基线评审状态', requirement: '通过', current: '进行中', gap: '评审中', status: 'watch', note: '预计M3完成', source: '基线评审会', updatedAt: '2024-01-18' }
    ],
    linkedRequirements: ['SOL-REQ-001', 'REQ-AUXILIARY-001'],
    actions: [
      { title: '补齐试验报告签署件', owner: '质量-审核员', due: '2024-01-29', status: 'open' },
      { title: '更新基线评审记录', owner: '配置管理', due: '2024-01-31', status: 'in-progress' }
    ]
  },
  management: {
    title: '项目管理关注摘要',
    overview: '从风险、进度与资源视角检查需求执行状态，为决策提供依据。',
    metrics: [
      { label: '关键需求风险', value: '5条预警', trend: '-1', status: 'warning', note: '燃油接口与热流密度需关注', source: '风险清单', updatedAt: '2024-01-20' },
      { label: '进度符合度', value: '88%', trend: '+4%', status: 'good', note: '总体按计划推进', source: '里程碑跟踪', updatedAt: '2024-01-19' },
      { label: '资源缺口', value: '仿真+1人', trend: '稳定', status: 'warning', note: '需增补计算资源', source: '资源池', updatedAt: '2024-01-18' }
    ],
    focusAreas: [
      { label: '高优需求', detail: '锁定高优先级需求的风险与缓解措施。', icon: 'ri-error-warning-line' },
      { label: '节点清单', detail: '核对即将到来的M2/M3评审所需交付物。', icon: 'ri-calendar-event-line' },
      { label: '资源调配', detail: '根据风险点分配仿真、试验与质量资源。', icon: 'ri-user-shared-line' }
    ],
    structuredParameters: [
      { name: '高优需求完成度', requirement: '100%', current: '78%', gap: '-22%', status: 'risk', note: '需跨部门跟进', source: 'PRD追踪表', updatedAt: '2024-01-19' },
      { name: '评审物料准备', requirement: 'M2前完成', current: '进行中', gap: '缺2项', status: 'watch', note: '等待试验数据入库', source: '评审物料清单', updatedAt: '2024-01-20' },
      { name: '预算消耗率', requirement: '≤50%', current: '47%', gap: '+3%', status: 'met', note: '费用在可控范围', source: '财务月报', updatedAt: '2024-01-17' }
    ],
    linkedRequirements: ['SOL-REQ-001', 'SOL-REQ-002', 'REQ-PROPULSION-001'],
    actions: [
      { title: '组织高风险需求专项例会', owner: 'PMO', due: '2024-01-24', status: 'open' },
      { title: '提交M2阶段资源调配方案', owner: '项目经理', due: '2024-01-26', status: 'open' }
    ]
  },
  'data-steward': {
    title: '数据治理关注摘要',
    overview: '维护需求主数据映射、追溯链路与变更记录，支撑跨系统一致性。',
    metrics: [
      { label: '主数据绑定率', value: '91%', trend: '+2%', status: 'good', note: '剩余xbom映射中', source: '主数据映射表', updatedAt: '2024-01-19' },
      { label: '追溯链完整度', value: '95%', trend: '+1%', status: 'excellent', note: '仅需求REQ-COMPRESSOR-ROTOR缺试验映射', source: '追溯图谱', updatedAt: '2024-01-18' },
      { label: '变更同步及时性', value: '3.2 天', trend: '-0.8 天', status: 'good', note: '平均同步时长下降', source: '变更同步日志', updatedAt: '2024-01-20' }
    ],
    focusAreas: [
      { label: '需求ID映射', detail: '校验需求与PLM/仿真/试验系统的ID映射。', icon: 'ri-id-card-line' },
      { label: '元数据完整性', detail: '检查参数单位、分类、标签等字段是否缺失。', icon: 'ri-database-line' },
      { label: '变更影响评估', detail: '跟踪需求变更对其它系统的影响范围。', icon: 'ri-notification-badge-line' }
    ],
    structuredParameters: [
      { name: '跨系统ID对齐', requirement: '100%', current: '27/30', gap: '-3', status: 'watch', note: '待补试验系统ID', source: '系统映射清单', updatedAt: '2024-01-20' },
      { name: '参数单位一致性', requirement: '100%', current: '98%', gap: '-2%', status: 'watch', note: '两个参数单位待确认', source: '数据质量报告', updatedAt: '2024-01-18' },
      { name: '变更记录入库', requirement: '实时', current: '24h内', gap: '+24h', status: 'met', note: '满足SLA要求', source: '变更系统', updatedAt: '2024-01-19' }
    ],
    linkedRequirements: ['REQ-COMPRESSOR-ROTOR', 'REQ-CONTROL-001'],
    actions: [
      { title: '补录试验系统需求ID', owner: '数据管理员', due: '2024-01-25', status: 'open' },
      { title: '梳理参数单位词汇表', owner: '数据治理组', due: '2024-02-01', status: 'in-progress' }
    ]
  }
};
