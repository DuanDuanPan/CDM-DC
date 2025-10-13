# 冲刺14：Online3DViewer 集成计划

更新时间：2025-10-13

## 目标
- 替换现有 `<model-viewer>` 的轻量化 3D 预览能力，支持 STEP/IGES/IFC/GLTF 等官网同等格式，满足内网离线加载与 Compare Drawer 同步视角要求。
- 控制首次加载等待时间 ≤ 10 秒，提供进度反馈与降级策略。

## 集成方案
1. **资源本地化**
   - 安装 `online-3d-viewer` npm 包，将 `libs/` 下的 wasm、worker 与纹理复制至 `public/3dviewer/`。
   - 模型文件统一放在 `public/models/`（或内网静态目录），通过相对路径加载。
   - 初始化阶段调用 `OV.SetExternalLibLocation('/3dviewer/')`，确保离线环境不访问外部 CDN。
2. **封装 React 组件**
   - 新建 `components/structure/preview/OnlineViewer.tsx`（客户端组件）。
   - 运行时 `dynamic import('online-3d-viewer/dist/embeddedviewer.js')`，在 `useEffect` 中构建 `new OV.EmbeddedViewer(...)`。
   - 暴露 `onLoad`、`onError`、`getCamera`、`setCamera`，便于与 `CompareSyncContext` 对接。
   - 加入 Loading 覆盖层，>5s 显示进度条并允许取消。
3. **集成 Compare Drawer**
   - 在 `SimulationPreviewContent` 的几何分支按需渲染 `OnlineViewer`，保留原 Loading/错误逻辑。
   - 与 `CompareSyncContext` 协同：在 `camera-change` 回调中广播状态，接收远端相机更新。
4. **配置调整**
   - `next.config.js` 中确保 wasm MIME 设置；内网部署需将 `public/3dviewer` 同步到静态服务器。
   - QA 覆盖 Chrome/Firefox，验证离线模式、GPU 不同配置。

## 性能与资源预算
- 模型可能较大，若单次解析 > 10 s，评估构建期生成 glTF 轻量版或建立简化流程。
- 引入包体：`embeddedviewer.js` ~5 MB，`occt-import-js.wasm` ~17 MB；建议懒加载，并在文档中注明。

## 风险与缓解
- **加载超时**：预处理或提供“轻量模型”提示；允许用户中止加载。
- **同步 API 差异**：如无法直接读取/设置相机，提供 OnlineViewer 内部联动或限制仅在同组件之间同步。
- **资源路径配置错误**：组件初始化校验 wasm 是否成功加载；若失败，回退静态截图并提示运维排查。

## 实施步骤与估算
1. 依赖引入 & 资源拷贝脚本（0.5 人日）
2. OnlineViewer 封装（1 人日）
3. SimulationPreviewContent 集成（0.5 人日）
4. 懒加载 + 进度反馈（0.5 人日）
5. 性能验证与调优（1 人日）

合计：约 3.5 人日（不含模型轻量化流水线）。

## 验收清单
- STEP/IGES/IFC/glTF 加载成功并在 10 秒内完成（典型模型），Loading 提示正常。
- Compare Drawer 同步视角生效，最大化模式无异常。
- 离线环境访问不触发外部网络请求。
- 浏览器控制台无 wasm 资源错误，`performance.mark` 记录加载时间。

## 实施进展记录

> 更新时间：2025-10-13

- 引入 `online-3d-viewer@0.16.0` 及依赖的 `occt-import-js@0.0.22`、`rhino3dm@8.17.0`、`web-ifc@0.0.68`、`draco3d@1.5.7`，通过 `npm run sync:3dviewer` 自动将 wasm/worker 拷贝到 `public/3dviewer/`，同步 envmaps 资源，`postinstall` 自动执行。
- 新增 `components/structure/preview/OnlineViewer.tsx`（客户端组件）封装嵌入式 Viewer，支持：
  - 动态加载 `online-3d-viewer/build/engine/o3dv.module.js` 并配置离线资源路径。
  - 自定义加载进度、5 秒超时进度条与取消操作，异常时提供重试。
  - 通过 `CompareSyncContext` 广播/应用视角，兼容 Compare Drawer 同步。
  - 暴露 `getCamera`/`setCamera`/`reload` imperative API，保留旧 `EbomModelViewer` 文件作 re-export。
- `SimulationPreviewContent` 在几何分支默认使用 `OnlineViewer`，沿用 `syncKey` 与 `viewerUrl` 逻辑；Compare Drawer、单卡预览自动获得相同体验。
- 行为增强：内建视图适配/重置/透视切换/轮廓线按钮，并支持在原卡片内一键最大化进入遮罩层查看。
- 文档与任务节点同步留档，后续如需扩展多模型或截屏回退可在此基础上迭代。
