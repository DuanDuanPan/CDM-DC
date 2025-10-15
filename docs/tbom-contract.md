# 试验BOM（TBOM）最小上载契约 v0.1

> 日期：2025-10-15｜适用范围：前端原型数据导入与演示｜状态：草案

本契约用于在未对接真源系统前，以 CSV/JSON 包的形式为“试验 BOM（TBOM）”提供最小可用数据。目标是：
- 支撑 TBOM 结构导航（Type → Project → Test → Run）；
- 展示运行详情（过程记录、结果数据、事件、附件）；
- 形成与需求/设计/仿真的跨域可追溯键；
- 为 Compare 与查看器统一口径（单位/信号代号）。

---

## 1. 层级与标识
- TestType（试验类型）
- TestProject（试验项目）
- Test（XX 试验）
- TestRun（XX 次上台/试车）

统一标识与版本：`type_id`, `project_id`, `test_id`, `run_id`, `version`, `baseline_id`。
时间与执行信息：`planned_at`, `executed_at`, `operator`。
工况：`environment`（JSON，可包含温度/平台/设备等）。

挂接到产品结构树节点（EBOM Node）：
- `ebom_node_id`（结构节点 ID，必填，建议在 Test 层级给出，Run 可覆盖）；
- `ebom_path`（可选，便于 UI 直接显示路径，如 `ASSY-001/COMP-123/SUB-45`）。

---

## 2. 文件构成（最小集）
- `tbom_project.json`：项目（Project）主档
- `tbom_test.json`：试验（Test）主档
- `tbom_run.json`：运行（Run）主档
- `result_timeseries.csv`：时序数据（多通道）
- `process_event.csv`：过程事件/故障
- `test_card.csv`：试验卡片（参数表）
- `attachments.csv`：附件索引（图片/视频/文件）

可选：`result_psd.csv`（频谱/PSD）、`result_frf.csv`（FRF/相干）

---

## 3. 字段定义（摘要）

### 3.1 tbom_project.json（数组）
- `project_id` string
- `type` string（试验类型）
- `title` string
- `objectives` string
- `input_docs` string[]（技术要求/大纲/评审记录/项目方案）
- `baseline_id` string
- `relations` object[]（`{ kind: 'requirement'|'ebom'|'simulation', ref_id: string }`）

### 3.2 tbom_test.json（数组）
- `test_id` string, `project_id` string
- `name` string, `purpose` string
- `spec_refs` string[]（标准/方法）
- `ebom_node_id` string（挂接的产品结构树节点 ID，必填）
- `ebom_path` string（可选：结构路径显示）

### 3.3 tbom_run.json（数组）
- `run_id` string, `test_id` string, `run_index` number
- `planned_at` ISO8601, `executed_at` ISO8601, `operator` string
- `environment` object（温度/台架/设备/方向等）
- `test_item_sn` string（实物 BOM SN）
- `assembly_bom_id` string（试验件本次装配 BOM）
- `attachments` string[]（与 attachments.csv 交叉引用的 `file_id`）
- `ebom_node_id` string（可选：若与 Test 不同，可在 Run 覆盖挂接节点）

### 3.4 result_timeseries.csv（宽表）
- 列：`ts`（ISO8601 或相对秒）+ 多通道列（见第 4 节“通道字典”）

### 3.5 process_event.csv
- 列：`event_id`, `run_id`, `category`（fault/anomaly/note）, `severity`, `start_ts`, `end_ts`, `desc`, `code`

### 3.6 test_card.csv
- 列：`param_name`, `value`, `unit`, `source`

### 3.7 attachments.csv
- 列：`file_id`, `type`（image/video/file）, `path`, `ts`, `desc`, `run_id`

---

## 4. 通道字典（结构振动试验·样例）

为统一 Compare 与查看器口径，建议以下代号/单位（结合行业常见做法：随机振动 PSD 使用 `g^2/Hz`；模态试验 FRF 常见为加速度/力的比值等）。

- 输入/控制
  - `FORCE_IN`（N）：激振力（力锤/力传感器/拉杆测力计）
  - `CTRL_ACC`（g 或 m/s^2）：控制加速度（随机/正弦控制点）
- 响应（加速度/速度/位移，按需派生）
  - `ACC_<LOC>_[X|Y|Z]`（g 或 m/s^2）：测点加速度
  - `VEL_<LOC>`（mm/s 或 m/s）：（可由加速度积分得到）
  - `DISP_<LOC>`（mm）：（可由速度再积分得到）
- 频域与派生
  - `PSD_<LOC>`（g^2/Hz）：随机振动功率谱密度
  - `FRF_ACC_<LOC>`（m/s^2/N 或 g/N）：加速度-力 FRF（Accelerance/H1）
  - `COH_<LOC>`（0..1）：相干函数
- 监测/环境
  - `TEMP_<LOC>`（°C）、`STRAIN_<LOC>`（με）
  - `SR`（Hz，采样率，作为元数据或列）

说明与参考：
- MIL‑STD‑810（Method 514.x）与 NASA GEVS 均以 `g^2/Hz` 表达随机振动 PSD，常见频带 5/10–2000 Hz，RMS 由积分得到。
- 模态/结构试验常用 FRF（加速度/力、速度/力或位移/力），常配合相干函数用于质量评估。

---

## 5. 示例（节选）

### 5.1 tbom_project.json
```json
[
  {
    "project_id": "P-EX-001",
    "type": "结构振动",
    "title": "机匣组件结构振动评估",
    "objectives": "获取固有频率/阻尼，校核环境耐受，建立对比基线",
    "input_docs": [
      "docs/incoming/试验技术要求.pdf",
      "docs/incoming/试验大纲_v1.0.pdf",
      "docs/incoming/大纲评审记录.docx",
      "docs/incoming/试验项目方案.docx"
    ],
    "baseline_id": "BL-2025-10",
    "relations": [
      { "kind": "requirement", "ref_id": "REQ-123" },
      { "kind": "ebom", "ref_id": "EBOM-ASSY-456" },
      { "kind": "simulation", "ref_id": "SIM-CSE-789" }
    ]
  }
]
```

### 5.2 tbom_test.json
```json
[
  {
    "test_id": "T-EX-001",
    "project_id": "P-EX-001",
    "name": "整机随机+正弦扫描+模态",
    "purpose": "随机验证环境耐受，正弦扫频识别共振，模态提取 FRF",
    "spec_refs": ["MIL-STD-810H 514.8", "NASA GEVS", "B&K Modal Testing"]
  }
]
```

### 5.3 tbom_run.json
```json
[
  {
    "run_id": "R-EX-001",
    "test_id": "T-EX-001",
    "run_index": 1,
    "planned_at": "2025-10-20T09:00:00Z",
    "executed_at": "2025-10-20T10:15:00Z",
    "operator": "testerA",
    "environment": { "table": "shaker-A", "axes": "Z", "temp": 23.5 },
    "test_item_sn": "SN-0001",
    "assembly_bom_id": "ASSY-0001-R1",
    "attachments": ["F-IMG-001", "F-LOG-001"]
  }
]
```

### 5.4 result_timeseries.csv（示例行）
```csv
ts,FORCE_IN,CTRL_ACC,ACC_BASE_X,ACC_TOP_Z
2025-10-20T10:00:00.000Z,12.3,0.51,0.12,0.08
2025-10-20T10:00:00.005Z,11.9,0.49,0.13,0.10
```

### 5.5 process_event.csv（示例行）
```csv
event_id,run_id,category,severity,start_ts,end_ts,desc,code
E1,R-EX-001,fault,major,2025-10-20T10:05:10Z,2025-10-20T10:05:13Z,传感器短时过载,SAT
```

### 5.6 test_card.csv（示例行）
```csv
param_name,value,unit,source
扫频范围,5-2000,Hz,试验卡片
控制RMS,7.7,g,控制器
```

### 5.7 attachments.csv（示例行）
```csv
file_id,type,path,ts,desc,run_id
F-IMG-001,image,/files/run1/photo1.jpg,2025-10-20T10:02:00Z,样机布置照片,R-EX-001
F-LOG-001,file,/files/run1/controller.log,2025-10-20T10:15:10Z,控制日志导出,R-EX-001
```

---

## 6. 校验规则（要点）
- ID 参照完整性：所有 `*_id` 必须可在其父层级找到引用；
- 时间格式：ISO8601；
- 单位与口径：加速度统一 `g` 或 `m/s^2`，随机 PSD 统一 `g^2/Hz`；FRF 建议 `m/s^2/N` 或 `g/N`；
- 采样率与频带：在元数据中声明（或列 `SR`），与时序/PSD 文件一致；
- 空值策略：缺失列以空列呈现，不删除列头。

---

## 7. 与其他域的关联
- 需求：`requirement_id`（用于需求验证矩阵）
- 设计/EBOM：`ebom_node_id`（结构树节点）、`ebom_path`（可选显示）、`ebom_item_id`（物料项，含配置/版本）
- 仿真：`simulation_case_id` / `simulation_result_id`
- 实物 BOM：`physical_bom_sn`

---

## 8. 参考与口径对齐
- NASA GEVS（GSFC‑STD‑7000）：环境验证与随机振动 PSD 单位/频带的行业通行写法。 
- MIL‑STD‑810（Method 514.x）：运输/作战环境振动方法与示例谱。
- Brüel & Kjær（Modal Analysis/FRF）：模态试验中 FRF 与相干函数等概念与用法。

> 本契约为原型阶段文件，后续对接 BFF/真源时以服务契约为准。
