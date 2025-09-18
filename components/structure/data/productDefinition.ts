import { ProductDefinitionPayload } from "../definition/types";

// 简易Mock：根据节点返回产品定义数据
// 已知BOM节点（见 ProductStructure.getBomStructureData）：
// - 推进系统：id = '001-01'
// - 压气机分系统：id = '001-01-01'

export function getDefinitionByNode(node: { id: string; name?: string; unitType?: string; subsystemType?: string }, versionId: string): ProductDefinitionPayload | null {
  // 推进系统（系统视图 - 通用骨架）
  if (node.id === '001-01' || node.unitType === 'system') {
    return {
      meta: {
        ci: 'CI-PS-0001',
        bomPath: ['航空发动机总成', '推进系统'],
        baseline: 'V2.0',
        version: versionId.toUpperCase(),
        effectivity: { dateRange: ['2024-01-01', '2024-12-31'] },
        status: '受控',
        owner: '推进系统 · 钱工',
        maturity: {
          trl: 'TRL-6',
          dml: 'DML-3',
          milestones: ['PDR', 'CDR', 'TRR'],
          evidenceLinks: [
            { type: 'report', name: '推进系统方案设计说明书' },
            { type: 'model', name: '系统架构模型(SysML)' }
          ]
        }
      },
      interfaces: {
        upstream: { id: '001', label: '航空发动机总成' },
        downstream: { id: '001-01-01', label: '压气机分系统' },
        related: [
          { type: 'drawing', name: '推进系统接口图' },
          { type: 'procedure', name: '推进系统试验规程' }
        ]
      },
      system: {
        functionalBoundary: {
          conditions: ['起动', '稳态', '关机', '节流', '再启动'],
          objectivesConstraints: [
            { name: '混合比范围 OR', value: '2.2 ~ 3.4' },
            { name: '供液总质量流率', value: '0.65', unit: 'kg/s' },
            { name: '接口腔压需求 pc', value: '5.8', unit: 'MPa' },
            { name: '压降预算', value: '≤ 0.3', unit: 'MPa' }
          ]
        },
        performanceEnvelope: [
          { name: '推进系统效率 η_ps', value: '0.92' },
          { name: '环境限值', value: '温度/Vib/加速度合规' }
        ],
        reliabilitySafety: [
          { name: 'MTBF', value: '≥ 1200 h' },
          { name: '关键联锁', value: '8 项' }
        ]
      },
      combustion: {
        injectorSide: [
          { name: 'LOX供液压力', value: '6.2', unit: 'MPa' },
          { name: '燃料Δp/pc目标', value: '0.06', unit: '-' }
        ],
        transients: [
          { name: '起动压力爬升速率', limit: '≤ 0.8 MPa/s' },
          { name: '关机流量下降速率', limit: '≥ -0.5 kg/s^2' }
        ],
        coolingBypass: [
          { name: '再生出口温度', value: '≤ 820 K' }
        ]
      },
      feed: {
        loops: [
          { medium: 'LOX', flow: '0.32 kg/s', inlet: '5.4 MPa/120 K', outlet: '6.1 MPa', cleanliness: 'NAS 6' },
          { medium: 'Fuel', flow: '0.33 kg/s', inlet: '3.2 MPa/300 K', outlet: '3.5 MPa', cleanliness: 'NAS 6' }
        ],
        pumpTurbineMaps: [
          { name: '泵 H–Q–N', mapId: 'MAP-PUMP-01' },
          { name: '涡轮 P–N–η', mapId: 'MAP-TURB-01' }
        ],
        cavitationStability: [
          { name: '最小NPSH裕度', value: '≥ 3.5', unit: 'm' }
        ],
        valves: [
          { type: '开关阀', cv: 'Cv=12', response: '80 ms', failState: 'fail-close' },
          { type: '比例阀', cv: 'Cv=22', response: '120 ms', failState: 'fail-open' }
        ],
        auxiliaries: ['旁通/再循环', '预冷却']
      },
      structures: {
        pressureClass: '压力壳体 II 级',
        safetyFactors: [
          { name: '设计安全系数', value: '1.5' },
          { name: '验证安全系数', value: '1.25' }
        ],
        materialsJoints: [
          { name: '主要材料', spec: 'GH4169 / TC4', reference: '材料允许值-2024' },
          { name: '焊接/钎焊', spec: '见制造规范-WS-001' }
        ],
        lifeTests: [
          { name: '疲劳基线', value: '高周/低周' },
          { name: '耐压/气密', value: '合格' }
        ]
      },
      controls: {
        controlledVars: [
          { name: '泵转速', target: 'N target', limits: '±5%', rateLimit: '≤ 10%/s' },
          { name: '阀开度', target: '开度指令', limits: '0-100%', rateLimit: '≤ 20%/s' }
        ],
        stateMachine: '起动—稳态—关机—异常（含硬/软联锁清单）',
        sensors: [
          { id: 'P1', meas: '压力 Pt', range: '0-10 MPa', acc: '±0.5%FS', rate: '100 Hz', redundancy: 'TMR' },
          { id: 'T1', meas: '温度 Tt', range: '200-1200 K', acc: '±1K', rate: '100 Hz', redundancy: '双冗余' }
        ]
      },
      manufacturing: {
        keyWindows: [
          { name: '焊接热输入', window: '12-16 kJ/cm', procedureRef: 'WPS-01' },
          { name: '表面处理', window: 'Ra ≤ 1.6' }
        ],
        qcPoints: [
          { name: 'NDT方法与覆盖率', spec: 'RT/UT/PT/ET 100%' },
          { name: '关键尺寸公差', spec: '详见图纸' }
        ],
        maintainability: ['模块化接口', '在位检测']
      },
      testvv: {
        plans: [
          { name: '子系统台架', scope: '泵水试/惰性介质/热态' },
          { name: '系统级联试', scope: '功能/包线拓展' }
        ],
        instrumentation: [
          { name: '量纲/不确定度', spec: '符合JJG/GB/T' }
        ],
        acceptance: [
          { name: '性能阈值', criteria: '达标' },
          { name: '泄漏/振动/温升', criteria: '合格' }
        ],
        evidence: [
          { name: '试验数据集ID: DATA-PS-0009' }
        ]
      },
      links: {
        cad_id: 'CAD-PS-001',
        cfd_model_id: 'CFD-PS-001',
        fea_model_id: 'FEA-PS-001',
        reports: ['推进系统性能测试报告', '控制联锁一致性检查表'],
        procedures: ['系统试验规程-2024']
      }
    };
  }

  // 压气机分系统（专业扩展）
  if (node.id === '001-01-01' || node.subsystemType === 'compressor') {
    const base: ProductDefinitionPayload = {
      meta: {
        ci: 'CI-COMP-0001',
        bomPath: ['航空发动机总成', '推进系统', '压气机分系统'],
        baseline: 'V2.0',
        version: versionId.toUpperCase(),
        effectivity: { lot: '试样批', dateRange: ['2024-01-01', '2024-06-30'] },
        status: '受控',
        owner: '压气机 · 李工',
        maturity: {
          trl: 'TRL-5',
          dml: 'DML-2',
          milestones: ['PDR', 'CDR'],
          evidenceLinks: [
            { type: 'model', name: '压气机CFD模型' },
            { type: 'report', name: '压气机性能测试报告' }
          ]
        }
      },
      interfaces: {
        upstream: { id: '001-01', label: '推进系统' },
        downstream: { id: '001-01-02', label: '燃烧室分系统' },
        related: [
          { type: 'drawing', name: '压气机接口图' },
          { type: 'test', name: '并车试验-压气机段' }
        ]
      },
      system: {
        functionalBoundary: {
          conditions: ['起动', '稳态', '关机', '加减速'],
          objectivesConstraints: [
            { name: '压比 πc', value: '≥ 22' },
            { name: '质量流量 ṁ', value: '0.95', unit: 'kg/s' }
          ]
        },
        performanceEnvelope: [
          { name: '效率 η_is', value: '≥ 0.87' },
          { name: '稳定裕度', value: '≥ 15%' }
        ],
        reliabilitySafety: [
          { name: '失效态/联锁', value: '防喘/超速' }
        ]
      },
      combustion: {
        injectorSide: [
          { name: '出口总压 Pt,out', value: '0.9', unit: 'MPa' },
          { name: '出口总温 Tt,out', value: '820', unit: 'K' }
        ],
        transients: [
          { name: '加速斜率', limit: '≤ 30%N/s' },
          { name: '减速斜率', limit: '≤ 40%N/s' }
        ]
      },
      feed: {
        loops: [
          { medium: 'Air', flow: '0.95 kg/s', inlet: 'P_t,in 0.04 MPa / T_t,in 300 K', outlet: 'P_t,out 0.9 MPa' }
        ],
        pumpTurbineMaps: [{ name: '压气机 ṁ–πc–N–η', mapId: 'MAP-COMP-01' }],
        cavitationStability: [{ name: '防喘线参考', value: 'map: SURGE-01' }],
        valves: [],
      },
      structures: {
        pressureClass: '机匣承压 I 级',
        safetyFactors: [ { name: '强度SF', value: '≥ 1.3' } ],
        materialsJoints: [ { name: '叶片材料', spec: '镍基高温合金' } ],
        lifeTests: [ { name: '高周疲劳', value: '合格' } ]
      },
      controls: {
        controlledVars: [
          { name: 'N', target: '设计点', limits: '±3%', rateLimit: '≤ 25%/s' },
          { name: 'πc', target: '≥ 22', limits: '包线内' }
        ],
        stateMachine: '专业视图：防喘/并车/超速保护',
        sensors: [
          { id: 'Pt-in', meas: '总压', range: '0-0.2 MPa', rate: '1000 Hz' },
          { id: 'Tt-out', meas: '总温', range: '300-900 K', rate: '200 Hz' }
        ]
      },
      manufacturing: {
        keyWindows: [ { name: '动平衡', window: 'G2.5' } ],
        qcPoints: [ { name: '端面跳动', spec: '≤ 0.03 mm' } ]
      },
      testvv: {
        plans: [ { name: '气动台试', scope: '单级/整机' } ],
        instrumentation: [ { name: '时间基准', spec: '≤ 1 ms 同步' } ],
        acceptance: [ { name: '防喘裕度', criteria: '≥ 15%' } ],
        evidence: [ { name: '试验件序列 COMP-001' } ]
      },
      links: {
        cad_id: 'CAD-COMP-001',
        cfd_model_id: 'CFD-COMP-001',
        fea_model_id: 'FEA-COMP-001',
        reports: ['压气机台试报告 V2.1'],
        procedures: ['防喘联锁校核记录']
      }
    };

    base.compressor = {
      design_point: { m_dot: '0.95 kg/s', pi_c: '22', N: '13,200 rpm', eta_is: '0.87', W_shaft: '420 kW' },
      map_id: 'MAP-COMP-01',
      surge_margin_min: '15%',
      geometry: { stages: 8, type: 'axial', tip_clearance: '0.35 mm' },
      rotordynamics: { critical_speeds: ['7,800 rpm', '12,300 rpm'], vibration_limits: '≤ 0.12 mm' },
      actuators: {
        igv: { stroke: '±15°', resolution: '0.1°', resp_time_ms: '80', fail_state: 'fail-open' },
        vgv: { stroke: '±10°', resolution: '0.1°', resp_time_ms: '100', fail_state: 'fail-freeze' },
        vbv: { stroke: '0-100%', resolution: '1%', resp_time_ms: '120', fail_state: 'fail-open' }
      },
      sensors: [
        { id: 'Pt-in', meas: '总压', range: '0-0.2 MPa', rate_hz: '1000' },
        { id: 'Tt-in', meas: '总温', range: '250-600 K', rate_hz: '200' },
        { id: 'Vib', meas: '振动', range: '0-2 mm', rate_hz: '2000' }
      ]
    };

    return base;
  }

  return null;
}

