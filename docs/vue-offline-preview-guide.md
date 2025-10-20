# Vue 集成离线三维模型与网格云图预览指南

## 1. 背景与目标
- **目标**：在 Vue 3 + Vite 浏览器项目中复用现有 React 版三维模型预览和网格云图组件，实现工业软件的离线轻量化展示。
- **现状**：React 版实现位于 `components/structure/preview/OnlineViewer.tsx` 和 `components/structure/simulation/VtkMeshViewer.tsx`，依赖 `online-3d-viewer` 和 `vtk.js`，并通过本地 `public/3dviewer` 资源解除对外网 CDN 的依赖。
- **成果物**：本文档提供离线资源准备、Vue 组件迁移、示例代码、调试与常见问题处理指南。

## 2. 原始组件功能速览
### 2.1 三维模型预览（OnlineViewer）
- 动态引入 `online-3d-viewer`，负责模型导入、进度提示、错误处理、全屏切换。
- 通过脚本与 `fetch` 重写将 Rhino、IFC、Draco、OCCT 等外部依赖指向本地资源。
- 常用 props：`src`（模型 URL）、`poster`、`height`、`allowMaximize`、事件回调 `onLoad`/`onError`。

### 2.2 网格云图预览（VtkMeshViewer）
- 基于 `vtk.js` 构建 `GenericRenderWindow`，提供最大化弹层、容器自适应、不同预设几何。
- 使用 `ResizeObserver` 保持尺寸同步，并在卸载时完整清理渲染器、事件和动画句柄。
- 与 `SimulationPreviewContent.tsx` 搭配显示网格指标（节点、单元、格式）。

## 3. Vue 技术选型与依赖
- 推荐环境：Vue 3（Composition API）+ Vite + TypeScript。
- 安装依赖：
  ```bash
  npm install online-3d-viewer vtk.js
  # 若缺少类型声明，可自建或引入社区 d.ts
  ```

## 4. 离线资源准备
1. 复制 React 项目 `public/3dviewer` 目录到 Vue 项目 `public/3dviewer`，确保包含：
   - `draco_decoder*.js/wasm`、`envmaps/`、`occt-import-js*.js/wasm`、`rhino3dm*.js/wasm`、`web-ifc*.js/wasm`。
2. Vite 构建会将 `public` 目录原样输出，访问路径保持 `/3dviewer/**`。
3. 在运行时改写 CDN 地址，示例：
   ```ts
   // src/plugins/useLocal3dViewerAssets.ts
   const EXTERNAL_MAP = new Map([
     ['https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js', '/3dviewer/rhino3dm.min.js'],
     ['https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/web-ifc-api-iife.js', '/3dviewer/web-ifc-api-iife.js'],
     ['https://cdn.jsdelivr.net/npm/draco3d@1.5.7/draco_decoder_nodejs.min.js', '/3dviewer/draco_decoder_nodejs.min.js']
   ]);
   const OCCT_WORKER = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/occt-import-js-worker.js';

   export function installOffline3dViewerPatches() {
     if (typeof window === 'undefined') return () => {};
     let refCount = 0;
     let restore: Array<() => void> = [];

     const rewriteSrc = (value: string) => {
       const url = EXTERNAL_MAP.get(value);
       return url ? `${window.location.origin}${url}` : value;
     };

     const retain = () => {
       if (refCount === 0) {
         const scriptProto = HTMLScriptElement.prototype;
         const originalSetAttribute = scriptProto.setAttribute;
         const descriptor = Object.getOwnPropertyDescriptor(scriptProto, 'src');
         const originalSetter = descriptor?.set;
         const originalGetter = descriptor?.get;

         if (originalSetter) {
           Object.defineProperty(scriptProto, 'src', {
             configurable: true,
             enumerable: descriptor?.enumerable ?? true,
             get() {
               return originalGetter ? originalGetter.call(this) : undefined;
             },
             set(value) {
               originalSetter.call(this, rewriteSrc(String(value)));
             }
           });
         }

         scriptProto.setAttribute = function patched(name, value) {
           if (name === 'src') return originalSetAttribute.call(this, name, rewriteSrc(String(value)));
           return originalSetAttribute.call(this, name, value);
         };

         const originalFetch = window.fetch.bind(window);
         window.fetch = async (input, init) => {
           const url = typeof input === 'string'
             ? input
             : input instanceof Request
               ? input.url
               : input instanceof URL
                 ? input.toString()
                 : '';
           if (url === OCCT_WORKER) {
             const localUrl = `${window.location.origin}/3dviewer/occt-import-js-worker.js`;
             const response = await originalFetch(localUrl, init);
             const text = await response.text();
             return new Response(
               text
                 .replace(/occt-import-js\.js/g, `${window.location.origin}/3dviewer/occt-import-js.js`)
                 .replace('return path', `return '${window.location.origin}/3dviewer/occt-import-js.wasm'`),
               { status: response.status, statusText: response.statusText, headers: response.headers }
             );
           }
           return originalFetch(input as any, init);
         };

         restore = [
           () => {
             if (descriptor) Object.defineProperty(scriptProto, 'src', descriptor);
           },
           () => {
             scriptProto.setAttribute = originalSetAttribute;
           },
           () => {
             window.fetch = originalFetch;
           }
         ];
       }
       refCount += 1;
     };

     const release = () => {
       refCount = Math.max(0, refCount - 1);
       if (refCount === 0) {
         restore.forEach(fn => fn());
         restore = [];
       }
     };

     retain();
     return release;
   }
   ```
4. 在三维组件 `onMounted` 调用 `installOffline3dViewerPatches()`，在 `onBeforeUnmount` 调用返回的 `release()`。

## 5. 三维模型 Vue 组件实现
### 5.1 Props 建议
```ts
interface OnlineViewerProps {
  src?: string;
  poster?: string;
  height?: number;
  allowMaximize?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

### 5.2 组件示例 `src/components/OnlineViewer.vue`
```vue
<template>
  <div class="ov-wrapper" :style="{ height: `${height}px` }">
    <div ref="containerRef" class="ov-canvas"></div>
    <div v-if="status === 'loading'" class="ov-overlay">
      <img v-if="poster" :src="poster" alt="poster" class="ov-poster" />
      <p>{{ phaseLabel }}</p>
      <progress :value="progress" max="1"></progress>
    </div>
    <div v-else-if="status === 'error'" class="ov-error">
      {{ errorMessage }} <button type="button" @click="reload">重试</button>
    </div>
    <button
      v-if="allowMaximize"
      type="button"
      class="ov-maximize"
      @click="toggleMaximize"
    >
      {{ isMaximized ? '退出全屏' : '全屏预览' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import { installOffline3dViewerPatches } from '@/plugins/useLocal3dViewerAssets';

const props = withDefaults(defineProps<OnlineViewerProps>(), {
  height: 280,
  allowMaximize: false
});

const containerRef = ref<HTMLDivElement | null>(null);
const status = ref<'empty' | 'loading' | 'ready' | 'error'>('empty');
const phase = ref<'fetch' | 'import' | 'visualize' | null>(null);
const progress = ref(0);
const errorMessage = ref('');
const isMaximized = ref(false);

let releasePatch: (() => void) | null = null;
let destroyViewer: (() => void) | null = null;

const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'fetch':
      return '加载模型文件…';
    case 'import':
      return '解析几何拓扑…';
    case 'visualize':
      return '渲染场景…';
    default:
      return '初始化 3D 预览…';
  }
});

const createViewer = async (source?: string) => {
  if (!containerRef.value) return;
  destroyViewer?.();
  if (!source) {
    status.value = 'empty';
    return;
  }
  status.value = 'loading';
  progress.value = 0;
  phase.value = 'fetch';
  errorMessage.value = '';

  try {
    const [{ EmbeddedViewer, EnvironmentSettings, RGBAColor, InputFilesFromUrls, ImportSettings }] =
      await Promise.all([
        import('online-3d-viewer/build/engine/o3dv.module.js')
      ]);

    const embedded = new EmbeddedViewer(containerRef.value, {
      environmentSettings: new EnvironmentSettings([
        '/3dviewer/envmaps/citadella/posx.jpg',
        '/3dviewer/envmaps/citadella/negx.jpg',
        '/3dviewer/envmaps/citadella/posy.jpg',
        '/3dviewer/envmaps/citadella/negy.jpg',
        '/3dviewer/envmaps/citadella/posz.jpg',
        '/3dviewer/envmaps/citadella/negz.jpg'
      ], false),
      backgroundColor: new RGBAColor(250, 252, 255, 255)
    });

    const inputFiles = InputFilesFromUrls([source]);
    if (inputFiles.length === 0) throw new Error('未找到可导入的模型文件');

    const settings = new ImportSettings();
    embedded.viewer.Clear();
    embedded.canvas.style.visibility = 'hidden';

    destroyViewer = () => {
      embedded?.Destroy?.();
    };

    embedded.modelLoader.LoadModel(inputFiles, settings, {
      onLoadStart: () => {
        status.value = 'loading';
        phase.value = 'fetch';
        progress.value = 0.1;
      },
      onFileLoadProgress: (current: number, total: number) => {
        progress.value = total > 0 ? current / total : 0.2;
      },
      onImportStart: () => {
        phase.value = 'import';
      },
      onVisualizationStart: () => {
        phase.value = 'visualize';
        progress.value = 0.9;
      },
      onModelLoaded: () => {
        status.value = 'ready';
        progress.value = 1;
        embedded.canvas.style.visibility = 'visible';
        props.onLoad?.();
      },
      onLoadError: (importError: any) => {
        throw importError instanceof Error ? importError : new Error('模型加载失败');
      }
    });
  } catch (error: any) {
    status.value = 'error';
    phase.value = null;
    progress.value = 0;
    errorMessage.value = error?.message ?? '模型加载遇到未知错误';
    props.onError?.(error instanceof Error ? error : new Error(errorMessage.value));
  }
};

const reload = () => createViewer(props.src);
const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  if (isMaximized.value) document.body.style.overflow = 'hidden';
  else document.body.style.overflow = '';
};

watch(() => props.src, (value) => {
  if (status.value === 'loading') return;
  createViewer(value);
});

onMounted(() => {
  releasePatch = installOffline3dViewerPatches();
  createViewer(props.src);
});

onBeforeUnmount(() => {
  destroyViewer?.();
  releasePatch?.();
  if (isMaximized.value) document.body.style.overflow = '';
});
</script>

<style scoped>
.ov-wrapper { position: relative; width: 100%; background: linear-gradient(135deg, #f5f8ff, #ffffff); border-radius: 16px; }
.ov-canvas { width: 100%; height: 100%; border-radius: 16px; overflow: hidden; }
.ov-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(255,255,255,0.85); }
.ov-poster { width: 120px; border-radius: 12px; }
.ov-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(248,113,113,0.1); color: #b91c1c; }
.ov-maximize { position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.9); color: #2563eb; border: none; cursor: pointer; }
</style>
```

## 6. 网格云图 Vue 组件实现
### 6.1 Props 建议
```ts
interface MeshViewerProps {
  preset?: 'casing' | 'sphere' | 'lattice';
  height?: number;
  allowMaximize?: boolean;
}
```

### 6.2 组件示例 `src/components/VtkMeshViewer.vue`
```vue
<template>
  <div class="vtk-wrapper" :style="{ height: `${height}px` }">
    <div ref="containerRef" class="vtk-canvas"></div>
    <button
      v-if="allowMaximize"
      type="button"
      class="vtk-maximize"
      @click="toggleMaximize"
    >
      {{ isMaximized ? '退出全屏' : '全屏预览' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = withDefaults(defineProps<MeshViewerProps>(), {
  preset: 'casing',
  height: 280,
  allowMaximize: false
});

const containerRef = ref<HTMLDivElement | null>(null);
const isMaximized = ref(false);

let rendererCleanup: (() => void) | null = null;
let overlayNode: HTMLElement | null = null;

const mountVtk = async () => {
  if (!containerRef.value) return;
  rendererCleanup?.();

  const [
    ,
    { default: vtkGenericRenderWindow },
    { default: vtkActor },
    { default: vtkMapper },
    { default: vtkSphereSource },
    { default: vtkCubeSource },
    { default: vtkCylinderSource },
    { default: vtkDiskSource },
    { default: vtkAppendPolyData },
    { default: vtkTransform },
    { default: vtkTransformPolyDataFilter }
  ] = await Promise.all([
    import('vtk.js/Sources/Rendering/Profiles/All'),
    import('vtk.js/Sources/Rendering/Misc/GenericRenderWindow'),
    import('vtk.js/Sources/Rendering/Core/Actor'),
    import('vtk.js/Sources/Rendering/Core/Mapper'),
    import('vtk.js/Sources/Filters/Sources/SphereSource'),
    import('vtk.js/Sources/Filters/Sources/CubeSource'),
    import('vtk.js/Sources/Filters/Sources/CylinderSource'),
    import('vtk.js/Sources/Filters/Sources/DiskSource'),
    import('vtk.js/Sources/Filters/General/AppendPolyData'),
    import('vtk.js/Sources/Common/Transform/Transform'),
    import('vtk.js/Sources/Filters/General/TransformPolyDataFilter')
  ]);

  const presetFactory = {
    casing: () => {
      const append = vtkAppendPolyData.newInstance();
      const body = vtkCylinderSource.newInstance({ radius: 0.45, height: 1.1, resolution: 96, capping: true });
      append.setInputConnection(body.getOutputPort());

      const addFlange = (offset: number) => {
        const disk = vtkDiskSource.newInstance({ innerRadius: 0.45, outerRadius: 0.68, radialResolution: 1, circumferentialResolution: 96 });
        const transform = vtkTransform.newInstance();
        transform.rotateX(90);
        transform.translate(0, 0, offset);
        const filter = vtkTransformPolyDataFilter.newInstance();
        filter.setTransform(transform);
        filter.setInputConnection(disk.getOutputPort());
        append.addInputConnection(filter.getOutputPort());
      };
      addFlange(0.55);
      addFlange(-0.55);

      const rib = vtkCubeSource.newInstance({ xLength: 1.15, yLength: 0.1, zLength: 0.12 });
      const ribTransform = vtkTransform.newInstance();
      ribTransform.rotateY(45);
      const ribFilter = vtkTransformPolyDataFilter.newInstance();
      ribFilter.setTransform(ribTransform);
      ribFilter.setInputConnection(rib.getOutputPort());
      append.addInputConnection(ribFilter.getOutputPort());
      return append;
    },
    sphere: () => vtkSphereSource.newInstance({ radius: 0.5, thetaResolution: 48, phiResolution: 48 }),
    lattice: () => vtkCubeSource.newInstance({ xLength: 1.0, yLength: 0.6, zLength: 0.8 })
  } as const;

  const renderWindow = vtkGenericRenderWindow.newInstance({ background: [0.97, 0.98, 1] });
  renderWindow.setContainer(containerRef.value);
  const renderer = renderWindow.getRenderer();
  const interactor = renderWindow.getInteractor();

  const sourceFactory = presetFactory[props.preset] ?? presetFactory.casing;
  const source = sourceFactory();

  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(source.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.getProperty().setColor(0.12, 0.36, 0.74);
  actor.getProperty().setOpacity(0.92);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(0.05, 0.15, 0.35);
  actor.setMapper(mapper);

  renderer.addActor(actor);
  renderer.resetCamera();
  renderWindow.getRenderWindow().render();

  let resizeObserver: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      renderWindow.resize();
      renderWindow.getRenderWindow().render();
    });
    resizeObserver.observe(containerRef.value);
  }

  rendererCleanup = () => {
    resizeObserver?.disconnect();
    renderer.removeAllViewProps();
    renderWindow.setContainer(null as unknown as HTMLElement);
    renderWindow.delete();
    interactor.cancelAnimation?.(interactor, true);
    (interactor as any).unbindEvents?.();
  };
};

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  if (isMaximized.value) {
    overlayNode = document.createElement('div');
    overlayNode.className = 'vtk-overlay';
    document.body.appendChild(overlayNode);
    overlayNode.appendChild((containerRef.value as HTMLElement).parentElement as Node);
    document.body.style.overflow = 'hidden';
  } else if (overlayNode) {
    document.body.style.overflow = '';
    document.body.removeChild(overlayNode);
    overlayNode = null;
  }
};

watch(() => props.preset, () => {
  mountVtk();
});

où
onMounted(() => {
  mountVtk();
});

onBeforeUnmount(() => {
  rendererCleanup?.();
  if (overlayNode) {
    document.body.style.overflow = '';
    document.body.removeChild(overlayNode);
  }
});
</script>

<style scoped>
.vtk-wrapper { position: relative; width: 100%; }
.vtk-canvas { width: 100%; height: 100%; border-radius: 16px; background: linear-gradient(135deg, #eef2ff, #ffffff); }
.vtk-maximize { position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.9); color: #2563eb; border: none; cursor: pointer; }
.vtk-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1050; }
</style>
```

> 后续可将 `preset` 替换为实际 FEM 数据加载逻辑（如 `vtkXMLPolyDataReader`），并复用该组件的生命周期与销毁流程。

## 7. 业务调用示例
```vue
<template>
  <section class="dashboard">
    <header>
      <h2>{{ fileName }}</h2>
      <button type="button" @click="download">下载源文件</button>
    </header>
    <OnlineViewer
      :src="modelUrl"
      :poster="poster"
      :height="320"
      :allowMaximize="true"
      @onLoad="handleLoaded"
      @onError="handleError"
    />
    <aside class="metrics">
      <span>节点：{{ meshInfo.nodes }}</span>
      <span>单元：{{ meshInfo.elements }}</span>
      <span>格式：{{ meshInfo.format }}</span>
    </aside>
    <VtkMeshViewer
      v-if="meshInfo"
      :height="320"
      :allowMaximize="true"
      preset="casing"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OnlineViewer from '@/components/OnlineViewer.vue';
import VtkMeshViewer from '@/components/VtkMeshViewer.vue';

const fileName = ref('cfm56.step');
const modelUrl = ref('/mock-data/models/cfm56.step');
const poster = ref('/models/cfm56-thumb.jpeg');
const meshInfo = ref({ nodes: 278000, elements: 520000, format: 'vtk' });

const handleLoaded = () => {
  console.info('模型加载成功');
};
const handleError = (error: Error) => {
  console.error('模型加载失败', error);
};
const download = () => {
  window.location.href = '/downloads/cfm56.step';
};
</script>
```

## 8. 离线部署与性能优化
- 所有资源需指向站内路径或本地 URL，避免外部请求被拦截。
- Vite 生产构建：
  - 配置 `assetsInclude: ['**/*.wasm']`，确保 WASM 被正确处理。
  - 构建后检查 `dist/3dviewer` 是否完整。
- 模型体量大时建议使用 glTF + Draco 压缩，或在桌面端预转换；必要时分块加载。
- WebGL 内存：低配 GPU 可能导致崩溃，可提供“仅下载查看”兜底。
- 可在应用初始化阶段预加载关键 WASM，降低首次打开等待。

## 9. 工业软件集成建议
- **浏览器容器**：若嵌入企业浏览器或 WebView，确认 CSP 允许脚本重写；如受限，可改为在 HTML 入口插入 `<script>` 完成映射。
- **数据交互**：通过 REST/WebSocket 获取模型路径，前端控制加载时机；必要时加本地缓存。
- **错误兜底**：`onError` 中提示用户下载源文件或联系支持，并记录模型大小、浏览器信息。
- **权限与安全**：在企业环境中常见的 WebGL 禁用需提前检测并提示开启硬件加速。

## 10. 调试与常见问题
| 问题 | 处理方式 |
| --- | --- |
| WASM 404 | 检查 `public/3dviewer` 是否复制；构建后在 `dist` 中确认路径。 |
| fetch 被拦截 | 调整 `installOffline3dViewerPatches` 或预置 `<script src="/3dviewer/...">`。 |
| WebGL 不可用 | 检查控制台是否提示禁用 WebGL，提示用户开启 GPU 加速。 |
| VTK 画面空白 | 确保容器尺寸大于 0，可在 `nextTick` 后挂载。 |
| 内存溢出 | 提示转换为轻量格式或分块加载；禁用全屏可减少显存占用。 |

## 11. 附录
### 11.1 Props/事件速查
- `OnlineViewer`
  - Props：`src`、`poster`、`height`、`allowMaximize`
  - 事件：`onLoad`、`onError`
- `VtkMeshViewer`
  - Props：`preset`、`height`、`allowMaximize`

### 11.2 参考文件
- React 实现：`components/structure/preview/OnlineViewer.tsx`、`components/structure/simulation/VtkMeshViewer.tsx`
- 本地资源：`public/3dviewer/*`

### 11.3 后续扩展
- 视角同步：沿用 React 版 `CompareSyncContext` 的序列化逻辑，迁移到 Vue store。
- 截图导出：通过 `embedded.viewer.GetCanvas().toDataURL()` 获取图像。
- 模型比对：加载多模型并共享摄像机控制逻辑。
