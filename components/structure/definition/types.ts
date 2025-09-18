export interface Effectivity {
  // 示例：按批次/序列/时间范围管理效期
  lot?: string;
  serialRange?: [string, string];
  dateRange?: [string, string];
}

export interface MaturityVV {
  trl: string; // TRL等级
  dml?: string; // DML等级
  milestones: string[]; // 评审/里程碑
  evidenceLinks: Array<{ type: string; name: string; id?: string }>; // 证据挂接
}

export interface NodeMetadata {
  ci: string; // CI编号
  bomPath: string[]; // BOM路径
  baseline: string; // 基线
  version: string; // 当前版本
  effectivity?: Effectivity; // 效期
  status: '草案' | '受控' | '冻结';
  owner: string; // 专业Owner
  maturity: MaturityVV; // 成熟度与V&V
}

export interface InterfaceRef {
  upstream?: { id: string; label: string };
  downstream?: { id: string; label: string };
  related: Array<{ type: 'drawing' | 'model' | 'procedure' | 'test'; name: string; id?: string }>; // 关联图纸/模型/规程/试验编号
}

// 1) 系统工程
export interface SystemDefinition {
  functionalBoundary: {
    conditions: string[]; // 工况包
    objectivesConstraints: Array<{ name: string; value: string; unit?: string }>; // 目标与约束
  };
  performanceEnvelope: Array<{ name: string; value: string }>; // 包线摘要
  reliabilitySafety: Array<{ name: string; value: string }>; // 可靠性与安全
}

// 2) 燃烧/热工接口
export interface CombustionInterfaceDefinition {
  injectorSide: Array<{ name: string; value: string; unit?: string }>;
  transients: Array<{ name: string; limit: string; remark?: string }>;
  coolingBypass?: Array<{ name: string; value: string }>; // 可选
}

// 3) 输送/涡轮泵
export interface FeedTurbopumpDefinition {
  loops: Array<{ medium: string; flow: string; inlet: string; outlet: string; cleanliness?: string }>;
  pumpTurbineMaps: Array<{ name: string; mapId: string; remark?: string }>;
  cavitationStability: Array<{ name: string; value: string; unit?: string }>;
  valves: Array<{ type: string; cv?: string; response?: string; failState?: string }>;
  auxiliaries?: string[];
}

// 4) 结构与材料
export interface StructuresMaterialsDefinition {
  pressureClass: string;
  safetyFactors: Array<{ name: string; value: string }>;
  materialsJoints: Array<{ name: string; spec: string; reference?: string }>;
  lifeTests: Array<{ name: string; value: string }>; // 寿命与试验
}

// 5) 控制与测量
export interface ControlsInstrumentationDefinition {
  controlledVars: Array<{ name: string; target: string; limits?: string; rateLimit?: string }>;
  stateMachine: string; // 状态机与联锁（链接或摘要）
  sensors: Array<{ id: string; meas: string; range: string; acc?: string; rate?: string; redundancy?: string }>;
}

// 6) 工艺与制造
export interface ManufacturingProcessDefinition {
  keyWindows: Array<{ name: string; window: string; procedureRef?: string }>;
  qcPoints: Array<{ name: string; spec: string }>; // 质量控制点
  maintainability?: string[];
}

// 7) 试验与验证
export interface TestVVDefinition {
  plans: Array<{ name: string; scope: string }>; // 型式/鉴定/接收试验
  instrumentation: Array<{ name: string; spec: string }>; // 仪表与精度
  acceptance: Array<{ name: string; criteria: string; ref?: string }>; // 合格准则
  evidence: Array<{ name: string; id?: string }>; // 证据挂接
}

// 压气机专业扩展（MUDF）
export interface CompressorMUDF {
  design_point: { m_dot: string; pi_c: string; N: string; eta_is: string; W_shaft: string };
  map_id: string;
  surge_margin_min: string; // %
  geometry: { stages: number; type: 'axial' | 'centrifugal' | 'mixed'; tip_clearance: string };
  rotordynamics: { critical_speeds: string[]; vibration_limits?: string };
  actuators: {
    igv?: { stroke?: string; resolution?: string; resp_time_ms?: string; fail_state?: string };
    vgv?: { stroke?: string; resolution?: string; resp_time_ms?: string; fail_state?: string };
    vbv?: { stroke?: string; resolution?: string; resp_time_ms?: string; fail_state?: string };
  };
  sensors: Array<{ id: string; meas: string; range: string; acc?: string; rate_hz?: string; delay_ms?: string; loc?: string }>;
}

export interface ProductDefinitionPayload {
  meta: NodeMetadata;
  interfaces: InterfaceRef;
  system: SystemDefinition;
  combustion: CombustionInterfaceDefinition;
  feed: FeedTurbopumpDefinition;
  structures: StructuresMaterialsDefinition;
  controls: ControlsInstrumentationDefinition;
  manufacturing: ManufacturingProcessDefinition;
  testvv: TestVVDefinition;
  // 压气机扩展（可选）
  compressor?: CompressorMUDF;
  links?: {
    cad_id?: string;
    cfd_model_id?: string;
    fea_model_id?: string;
    reports?: string[];
    procedures?: string[];
  };
}

