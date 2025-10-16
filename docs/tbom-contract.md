# 试验 BOM（TBOM）最小上载契约 v0.3

> 版本：v0.3（2025-10-16）｜适用阶段：TBOM MVP 原型与 Mock 服务｜状态：冻结  
> 变更说明：补齐字段定义、跨域追溯键、Mock 样例与校验原则；新增第二套示例数据。v0.3 新增 `run.status` 字段及取值说明，用于运行状态筛选。

本契约规定在尚未接入真实 BFF 之前，如何通过一组 JSON/CSV 文件为“试验 BOM（TBOM）”提供最小可用数据以驱动前端原型。目标：

- 支撑 TBOM 结构导航（类型 → 项目 → 试验 → 运行）。
- 输出运行详情（过程记录、结果数据、事件、附件）与 Compare 所需原子数据。
- 保持与需求、EBOM、仿真等域的追溯键可用。
- 统一频率/单位口径，为后续校核与真源接入提供基线。

---

## 1. 层级模型与标识

| 层级        | 描述                     | 主键字段        | 关键引用                                 |
|-------------|--------------------------|-----------------|------------------------------------------|
| TestType    | 试验类型（逻辑分类）     | `type_id`       | 可选：与 PRD/里程碑映射                  |
| TestProject | 试验项目（Project）      | `project_id`    | `relations` 中挂接需求/EBOM/仿真         |
| Test        | 具体试验（Test）         | `test_id`       | `project_id`、`ebom_node_id`             |
| TestRun     | 单次运行（Run）          | `run_id`        | `test_id`、`attachments[]`、`environment`|

**时间字段**（`planned_at`, `executed_at`, `start_ts`, `end_ts` 等）采用 ISO8601，UTC 时区或含时区偏移。  
**工况字段**（`environment`）为键值对象，允许字符串/数值/布尔/null。  
**EBOM 追溯**：`ebom_node_id` 必填；`ebom_path` 为显示用字符串（如 `ASSY-0001/FRAME-02/TOP-PLATE`）。

---

## 2. 文件清单

| 文件名                       | 格式 | 作用                                         |
|------------------------------|------|----------------------------------------------|
| `tbom_project.json`          | JSON | 项目主档（数组）                             |
| `tbom_test.json`             | JSON | 试验主档（数组）                             |
| `tbom_run.json`              | JSON | 运行主档（数组）                             |
| `result_timeseries*.csv`     | CSV  | 时序数据（多通道；按 runId 分文件）          |
| `process_event*.csv`         | CSV  | 过程事件记录                                 |
| `test_card.csv`              | CSV  | 试验卡片（参数/工况设定）                    |
| `attachments.csv`            | CSV  | 附件索引                                     |

可选扩展：`result_psd.csv`, `result_frf.csv` 等频域数据；保留同等字段规范。

---

## 3. 字段定义

### 3.1 `tbom_project.json`

JSON 数组，每个元素遵循：

| 字段           | 类型              | 必填 | 说明                                             |
|----------------|-------------------|------|--------------------------------------------------|
| `project_id`   | string            | ✔    | 项目标识                                         |
| `type`         | string            | ✔    | 试验类型描述（如“结构振动”）                    |
| `title`        | string            | ✔    | 项目标题                                         |
| `objectives`   | string            | ✔    | 试验目标                                         |
| `input_docs`   | string[]          | ✔    | 输入资料清单                                     |
| `baseline_id`  | string            | ✔    | 版本基线编号                                    |
| `relations`    | {kind, ref_id}[]  | ✖    | 跨域追溯清单；kind 可取 `requirement`/`ebom`/`simulation` 等 |

### 3.2 `tbom_test.json`

| 字段          | 类型     | 必填 | 说明                                             |
|---------------|----------|------|--------------------------------------------------|
| `test_id`     | string   | ✔    | 试验标识                                         |
| `project_id`  | string   | ✔    | 对应项目 ID                                      |
| `name`        | string   | ✔    | 试验名称                                         |
| `purpose`     | string   | ✔    | 试验目的                                         |
| `spec_refs`   | string[] | ✖    | 参考标准                                         |
| `ebom_node_id`| string   | ✔    | 关联的 EBOM 节点                                 |
| `ebom_path`   | string   | ✖    | 展示用路径                                       |

### 3.3 `tbom_run.json`

| 字段            | 类型                    | 必填 | 说明                                                  |
|-----------------|-------------------------|------|-------------------------------------------------------|
| `run_id`        | string                  | ✔    | 运行标识                                              |
| `test_id`       | string                  | ✔    | 所属试验                                              |
| `run_index`     | number                  | ✔    | 运行序号                                              |
| `status`        | enum                    | ✔    | 运行状态：`planned`｜`executing`｜`completed`｜`aborted` |
| `planned_at`    | string (ISO8601)        | ✔    | 计划时间                                              |
| `executed_at`   | string (ISO8601)        | ✖    | 实际执行时间                                          |
| `operator`      | string                  | ✖    | 操作员                                                |
| `environment`   | Record<string, value>   | ✖    | 环境参数（如温度、台架、方向）                        |
| `test_item_sn`  | string                  | ✖    | 被测件序列号                                          |
| `assembly_bom_id`| string                 | ✖    | 装配 BOM 标识                                         |
| `attachments`   | string[]                | ✖    | 与附件索引关系                                        |
| `ebom_node_id`  | string                  | ✖    | 若与试验不同，可覆盖 EBOM 节点                        |

### 3.4 时序 CSV

CSV 每列代表通道，必备列：

| 列名         | 单位          | 描述                                 |
|--------------|---------------|--------------------------------------|
| `ts`         | ISO8601       | 时间戳                               |
| `FORCE_IN`   | N             | 激振力                               |
| `CTRL_ACC`   | g 或 m/s²     | 控制加速度                           |
| `ACC_*`      | g 或 m/s²     | 各测点加速度                         |
| `PSD_*`      | g²/Hz         | 可选：随机振动 PSD                   |
| `SR`         | Hz            | （可选）采样率列                     |

每个 `run_id` 单独一个文件 `result_timeseries_<runId>.csv`。

### 3.5 `process_event_*.csv`

| 列名       | 说明                                         |
|------------|----------------------------------------------|
| `event_id` | 事件 ID                                      |
| `run_id`   | 对应运行                                    |
| `category` | `fault` / `anomaly` / `note` 等              |
| `severity` | `minor` / `major` / `critical`               |
| `start_ts` | ISO8601 开始时间                             |
| `end_ts`   | ISO8601 结束时间                             |
| `desc`     | 描述                                         |
| `code`     | 事件/告警码                                  |

### 3.6 `test_card.csv`

| 列名         | 说明                           |
|--------------|--------------------------------|
| `run_id`     | 所属运行                       |
| `param_name` | 参数名                         |
| `value`      | 参数值                         |
| `unit`       | 单位                           |
| `source`     | 来源                           |

### 3.7 `attachments.csv`

| 列名    | 说明                                     |
|---------|------------------------------------------|
| `file_id` | 附件标识                               |
| `type`    | `image` / `video` / `file`             |
| `path`    | 静态文件路径                           |
| `ts`      | 捕获时间                               |
| `desc`    | 描述                                   |
| `run_id`  | 关联运行                               |

---

## 4. 跨域追溯与规则

| 目标域 | 字段              | 说明                                        |
|--------|-------------------|---------------------------------------------|
| 需求   | `relations[].ref_id`（kind=`requirement`） | 与需求矩阵对接         |
| EBOM   | `ebom_node_id`, `ebom_path`               | 结构树定位             |
| 仿真   | `relations[].ref_id`（kind=`simulation`） | 仿真案例或结果 ID      |
| 实物   | `test_item_sn`, `attachments[].run_id`    | 实物件、附件关联       |

校验要点：
- `project_id` ↔ `test.project_id` ↔ `run.test_id` 必须整合。
- `run.attachments[]` 中的 ID 必须出现在 `attachments.csv`.
- CSV 中所有 `run_id` 必须存在于 `tbom_run.json`.
- 时间/采样单位需与通道字典一致；字段缺失时保留列头并置空值。

---

## 5. 错误与校验策略

- **结构缺失**：对于缺失 `run_id` 的请求返回 404 + `{ "error": "RUN_NOT_FOUND" }`。
- **文件缺失**：Route Handler 捕获 IO 异常并返回 500 + `{ "error": "MOCK_INTERNAL_ERROR", "reason": ... }`。
- **Zod 校验**：服务层对 JSON 响应执行 schema parsing；失败时抛出含 `issues` 的错误，前端应记录。
- **字段可选策略**：可选字段省略时 Zod schema 提供默认值（空对象/数组）。

---

## 6. 示例数据（v0.2）

### 项目（`tbom_project.json`，节选）
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
  },
  {
    "project_id": "P-EX-002",
    "type": "热结构耦合",
    "title": "尾喷管热-力联合验证",
    "objectives": "评估热载荷对尾喷管结构的影响并验证加强方案",
    "input_docs": [
      "docs/incoming/尾喷管热结构需求.pdf",
      "docs/incoming/试验方案_v0.8.docx"
    ],
    "baseline_id": "BL-2025-11",
    "relations": [
      { "kind": "requirement", "ref_id": "REQ-458" },
      { "kind": "ebom", "ref_id": "EBOM-ASSY-009" }
    ]
  }
]
```

### 试验（`tbom_test.json`，节选）
```json
[
  {
    "test_id": "T-EX-001",
    "project_id": "P-EX-001",
    "name": "整机随机+正弦扫描+模态",
    "purpose": "随机验证环境耐受，正弦扫频识别共振，模态提取 FRF",
    "spec_refs": ["MIL-STD-810H 514.8", "NASA GEVS", "B&K Modal Testing"],
    "ebom_node_id": "EBN-ASSY-0001-003",
    "ebom_path": "ASSY-0001/FRAME-02/TOP-PLATE"
  },
  {
    "test_id": "T-EX-002",
    "project_id": "P-EX-002",
    "name": "尾喷管热环境模拟",
    "purpose": "复现极端高温工况并校核热应力响应",
    "spec_refs": ["HB 6168-2016", "GE-Aero-Heat-Guide"],
    "ebom_node_id": "EBN-ASSY-009-112",
    "ebom_path": "ASSY-009/NOZZLE-CORE/HOT-SECTION"
  }
]
```

### 运行（`tbom_run.json`，节选）
```json
[
  {
    "run_id": "R-EX-001",
    "test_id": "T-EX-001",
    "run_index": 1,
    "status": "completed",
    "planned_at": "2025-10-20T09:00:00Z",
    "executed_at": "2025-10-20T10:15:00Z",
    "operator": "testerA",
    "environment": { "table": "shaker-A", "axes": "Z", "temp": 23.5 },
    "test_item_sn": "SN-0001",
    "assembly_bom_id": "ASSY-0001-R1",
    "attachments": ["F-IMG-001", "F-LOG-001"],
    "ebom_node_id": "EBN-ASSY-0001-003"
  },
  {
    "run_id": "R-EX-002",
    "test_id": "T-EX-002",
    "run_index": 1,
    "status": "executing",
    "planned_at": "2025-11-02T07:30:00Z",
    "executed_at": "2025-11-02T08:05:00Z",
    "operator": "testerB",
    "environment": { "furnace": "HT-900", "temp": 820.5, "duration_min": 45 },
    "test_item_sn": "SN-0202",
    "assembly_bom_id": "ASSY-009-R2",
    "attachments": ["F-IMG-010"],
    "ebom_node_id": "EBN-ASSY-009-112"
  }
]
```

对应 CSV 文件命名：`result_timeseries_R-EX-001.csv`、`result_timeseries_R-EX-002.csv`、`process_event_R-EX-001.csv`、`process_event_R-EX-002.csv` 等。

---

## 7. 校验脚本建议

> `scripts/verify-tbom-data.ts`（Story 1.4 实现）调用 `services/tbom.ts`：
1. 输出全部项目与试验统计。
2. `groupRunsByProject(projectId)`：按项目聚合运行列表。
3. `listRunsByEbomNode(ebomNodeId)`：验证跨域追溯键。
4. 访问不存在 runId 时捕获 `RUN_NOT_FOUND`。

脚本需在 README 中描述执行方式，例如：
```bash
pnpm tsx scripts/verify-tbom-data.ts
```

---

## 8. 单位与频率口径

- 随机振动 PSD：`g^2/Hz`，频带可含 5/10–2000 Hz。
- FRF（Accelerance）：`m/s^2/N` 或 `g/N`。
- 温度：`°C`；压力：`kPa`；应变：`με`。
- 默认采样率：以 `SR` 列或元数据说明。

---

## 9. 变更历史

| 版本 | 日期       | 描述                                       |
|------|------------|--------------------------------------------|
| v0.3 | 2025-10-16 | 新增 `run.status` 字段，供状态筛选使用       |
| v0.2 | 2025-10-16 | 补齐字段表、第二套样例、校验策略与脚本指引 |
| v0.1 | 2025-10-15 | 初版草案                                   |

> 后续若接入真实服务契约，请更新此文档并同步变更到 Change Log。
