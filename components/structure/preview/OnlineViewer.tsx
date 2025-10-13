"use client";

import Image from 'next/image';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import type { CameraStateSnapshot } from '../simulation/CompareSyncContext';
import { useCompareSync } from '../simulation/CompareSyncContext';

type O3DVModule = typeof import('online-3d-viewer/build/engine/o3dv.module.js');

interface OnlineViewerProps {
  src?: string;
  poster?: string;
  className?: string;
  height?: number;
  syncKey?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  allowMaximize?: boolean;
}

export interface OnlineViewerHandle {
  getCamera: () => CameraStateSnapshot | null;
  setCamera: (snapshot: CameraStateSnapshot) => void;
  reload: () => void;
}

type ViewerStatus = 'empty' | 'loading' | 'ready' | 'error' | 'cancelled';
type LoadingPhase = 'fetch' | 'import' | 'visualize';

const combine = (...tokens: Array<string | false | null | undefined>) => tokens.filter(Boolean).join(' ');

const ENVIRONMENT_TEXTURES = [
  '/3dviewer/envmaps/citadella/posx.jpg',
  '/3dviewer/envmaps/citadella/negx.jpg',
  '/3dviewer/envmaps/citadella/posy.jpg',
  '/3dviewer/envmaps/citadella/negy.jpg',
  '/3dviewer/envmaps/citadella/posz.jpg',
  '/3dviewer/envmaps/citadella/negz.jpg'
];

const EXTERNAL_SCRIPT_SOURCES: Array<{ cdn: string; local: string }> = [
  { cdn: 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js', local: '/3dviewer/rhino3dm.min.js' },
  { cdn: 'https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/web-ifc-api-iife.js', local: '/3dviewer/web-ifc-api-iife.js' },
  { cdn: 'https://cdn.jsdelivr.net/npm/draco3d@1.5.7/draco_decoder_nodejs.min.js', local: '/3dviewer/draco_decoder_nodejs.min.js' }
];

const OCCT_REMOTE_WORKER = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/occt-import-js-worker.js';

let rewriteRefCount = 0;
let restorePatches: Array<() => void> = [];

const installExternalLibRewrites = () => {
  if (typeof window === 'undefined') return () => {};

  rewriteRefCount += 1;
  if (rewriteRefCount > 1) {
    return () => {
      rewriteRefCount = Math.max(0, rewriteRefCount - 1);
      if (rewriteRefCount === 0) {
        restorePatches.forEach(fn => fn());
        restorePatches = [];
      }
    };
  }

  const origin = window.location.origin;
  const rewriteMap = new Map<string, string>();
  EXTERNAL_SCRIPT_SOURCES.forEach(entry => {
    rewriteMap.set(entry.cdn, `${origin}${entry.local}`);
  });

  const rewriteSrc = (value: string) => rewriteMap.get(value) ?? value;

  const scriptProto = HTMLScriptElement.prototype;
  const originalSetAttribute = scriptProto.setAttribute;
  const srcDescriptor = Object.getOwnPropertyDescriptor(scriptProto, 'src');
  const originalSrcGetter = srcDescriptor?.get;
  const originalSrcSetter = srcDescriptor?.set;

  if (originalSrcSetter) {
    Object.defineProperty(scriptProto, 'src', {
      configurable: true,
      enumerable: srcDescriptor?.enumerable ?? true,
      get() {
        return originalSrcGetter ? originalSrcGetter.call(this) : undefined;
      },
      set(value: string) {
        const rewritten = rewriteSrc(String(value));
        originalSrcSetter.call(this, rewritten);
      }
    });
  }

  scriptProto.setAttribute = function patchedSetAttribute(name: string, value: string) {
    if (name === 'src') {
      return originalSetAttribute.call(this, name, rewriteSrc(String(value)));
    }
    return originalSetAttribute.call(this, name, value);
  };

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.toString()
          : '';

    if (requestUrl === OCCT_REMOTE_WORKER) {
      const localWorkerUrl = `${origin}/3dviewer/occt-import-js-worker.js`;
      const response = await originalFetch(localWorkerUrl, init);
      const text = await response.text();
      const patchedText = text
        .replace(/occt-import-js\.js/g, `${origin}/3dviewer/occt-import-js.js`)
        .replace('return path', `return '${origin}/3dviewer/occt-import-js.wasm'`);
      return new Response(patchedText, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    }

    return originalFetch(input as any, init);
  };

  restorePatches = [
    () => {
      window.fetch = originalFetch;
    },
    () => {
      scriptProto.setAttribute = originalSetAttribute;
    },
    () => {
      if (srcDescriptor) {
        Object.defineProperty(scriptProto, 'src', srcDescriptor);
      }
    }
  ];

  return () => {
    rewriteRefCount = Math.max(0, rewriteRefCount - 1);
    if (rewriteRefCount === 0) {
      restorePatches.forEach(fn => fn());
      restorePatches = [];
    }
  };
};

const CAMERA_PREFIX = 'ov::';

const formatNumber = (value: number) => Number.isFinite(value) ? value : 0;

const serializeCamera = (camera: any) => {
  if (!camera) return '';
  const payload = {
    eye: [formatNumber(camera.eye?.x), formatNumber(camera.eye?.y), formatNumber(camera.eye?.z)],
    center: [formatNumber(camera.center?.x), formatNumber(camera.center?.y), formatNumber(camera.center?.z)],
    up: [formatNumber(camera.up?.x), formatNumber(camera.up?.y), formatNumber(camera.up?.z)],
    fov: formatNumber(camera.fov ?? 45)
  };
  return `${CAMERA_PREFIX}${JSON.stringify(payload)}`;
};

const parseCameraSnapshot = (ov: O3DVModule, snapshot?: CameraStateSnapshot) => {
  if (!snapshot?.orbit || !snapshot.orbit.startsWith(CAMERA_PREFIX)) return null;
  try {
    const raw = JSON.parse(snapshot.orbit.slice(CAMERA_PREFIX.length));
    const eye = new ov.Coord3D(raw.eye[0], raw.eye[1], raw.eye[2]);
    const center = new ov.Coord3D(raw.center[0], raw.center[1], raw.center[2]);
    const up = new ov.Coord3D(raw.up[0], raw.up[1], raw.up[2]);
    return new ov.Camera(eye, center, up, raw.fov ?? 45);
  } catch (error) {
    console.warn('[OnlineViewer] Failed to parse camera snapshot', error);
    return null;
  }
};

const formatImportError = (ov: O3DVModule, importError: any) => {
  if (!importError) return 'Failed to load model.';
  if (importError.message) return importError.message as string;
  switch (importError.code) {
    case ov.ImportErrorCode?.NoImportableFile:
      return '未找到可导入的模型文件';
    case ov.ImportErrorCode?.FailedToLoadFile:
      return '模型文件读取失败，请检查路径或权限';
    case ov.ImportErrorCode?.ImportFailed:
      return '模型解析失败，尝试转换为 glTF 后重试';
    default:
      return '模型加载遇到未知错误';
  }
};

const phaseLabel = (phase: LoadingPhase | null) => {
  switch (phase) {
    case 'fetch':
      return '加载模型文件…';
    case 'import':
      return '解析几何拓扑…';
    case 'visualize':
      return '渲染场景…';
    default:
      return '初始化 3D 预览…';
  }
};

const OnlineViewer = forwardRef<OnlineViewerHandle, OnlineViewerProps>(function OnlineViewer(
  { src, poster, className, height = 280, syncKey, onLoad, onError, allowMaximize = false }: OnlineViewerProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadSessionRef = useRef<symbol | null>(null);
  const viewerRecordRef = useRef<{ ov: O3DVModule; embedded: any } | null>(null);
  const viewerMetaRef = useRef<{ boundingSphere: any | null }>({ boundingSphere: null });
  const cleanupNavigationRef = useRef<(() => void) | null>(null);
  const lastBroadcastRef = useRef<string | null>(null);
  const applyingCameraRef = useRef(false);
  const cancelLoadingRef = useRef(false);

  const [status, setStatus] = useState<ViewerStatus>(src ? 'loading' : 'empty');
  const [phase, setPhase] = useState<LoadingPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLongLoad, setShowLongLoad] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [uiState, setUiState] = useState<{ projection: 'perspective' | 'orthographic'; showEdges: boolean }>(
    { projection: 'perspective', showEdges: false }
  );
  const [containerRevision, bumpContainerRevision] = useState(0);

  const { syncEnabled, lastCamera, updateCamera } = useCompareSync();

  const broadcastCamera = useCallback(() => {
    if (!syncKey || !syncEnabled) return;
    const record = viewerRecordRef.current;
    if (!record) return;
    const camera = record.embedded.GetViewer().GetCamera();
    if (!camera) return;
    const payload = serializeCamera(camera);
    if (!payload || lastBroadcastRef.current === payload) return;
    lastBroadcastRef.current = payload;
    updateCamera(syncKey, {
      orbit: payload,
      target: '',
      fieldOfView: camera.fov ? camera.fov.toString() : undefined,
      timestamp: Date.now()
    });
  }, [syncKey, syncEnabled, updateCamera]);

  const attachNavigationHook = useCallback(() => {
    const record = viewerRecordRef.current;
    if (!record) return;
    const viewer = record.embedded.GetViewer();
    const navigation = viewer.navigation;
    if (!navigation) return;
    const originalUpdate = navigation.callbacks?.onUpdate;
    navigation.callbacks.onUpdate = () => {
      if (typeof originalUpdate === 'function') {
        originalUpdate();
      }
      if (!applyingCameraRef.current) {
        broadcastCamera();
      }
    };
    cleanupNavigationRef.current = () => {
      navigation.callbacks.onUpdate = originalUpdate;
    };
  }, [broadcastCamera]);

  useEffect(() => {
    if (status !== 'loading') {
      setShowLongLoad(false);
      return;
    }
    const timer = window.setTimeout(() => setShowLongLoad(true), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!allowMaximize || !isMaximized) return undefined;
    if (typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [allowMaximize, isMaximized]);

  useEffect(() => {
    const restoreRewrites = installExternalLibRewrites();
    const session = Symbol('online-viewer-load');
    loadSessionRef.current = session;
    cancelLoadingRef.current = false;
    let disposed = false;

    const safeUpdate = (callback: () => void) => {
      if (!disposed && loadSessionRef.current === session) {
        callback();
      }
    };

    const destroyCurrentViewer = () => {
      cleanupNavigationRef.current?.();
      cleanupNavigationRef.current = null;
      const record = viewerRecordRef.current;
      if (record) {
        try {
          record.embedded?.Destroy?.();
        } catch (error) {
          console.warn('[OnlineViewer] destroy viewer failed', error);
        }
        viewerRecordRef.current = null;
      }
    };

    if (!src) {
      destroyCurrentViewer();
      safeUpdate(() => {
        setStatus('empty');
        setPhase(null);
        setProgress(0);
        setErrorMessage(null);
      });
      return () => {
        disposed = true;
        if (loadSessionRef.current === session) loadSessionRef.current = null;
      };
    }

    safeUpdate(() => {
      setStatus('loading');
      setPhase('fetch');
      setProgress(0);
      setErrorMessage(null);
      setShowLongLoad(false);
      setIsMaximized(false);
    });

    destroyCurrentViewer();

    const run = async () => {
      try {
        const ov = (await import('online-3d-viewer/build/engine/o3dv.module.js')) as O3DVModule;
        if (disposed || loadSessionRef.current !== session) return;
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const embedded = new ov.EmbeddedViewer(container, {
          environmentSettings: new ov.EnvironmentSettings(ENVIRONMENT_TEXTURES, false),
          backgroundColor: new ov.RGBAColor(250, 252, 255, 255)
        });

        viewerRecordRef.current = { ov, embedded };
        attachNavigationHook();

        const inputFiles = ov.InputFilesFromUrls([src]);
        if (!inputFiles || inputFiles.length === 0) {
          throw new Error('未找到可加载的模型文件');
        }

        const settings = new ov.ImportSettings();

        embedded.viewer.Clear?.();
        embedded.canvas.style.visibility = 'hidden';

        embedded.modelLoader.LoadModel(inputFiles, settings, {
          onLoadStart: () => {
            safeUpdate(() => {
              setPhase('fetch');
              setProgress(0.05);
            });
          },
          onFileListProgress: () => {
            // Online3DViewer 内部要求该回调存在；此处不需要额外处理。
          },
          onFileLoadProgress: (current: number, total: number) => {
            if (disposed || loadSessionRef.current !== session) return;
            const ratio = total > 0 ? current / total : 0;
            safeUpdate(() => {
              setPhase('fetch');
              setProgress(0.05 + Math.min(ratio, 1) * 0.55);
            });
          },
          onImportStart: () => {
            safeUpdate(() => {
              setPhase('import');
              setProgress(prev => Math.max(prev, 0.7));
            });
          },
          onVisualizationStart: () => {
            safeUpdate(() => {
              setPhase('visualize');
              setProgress(prev => Math.max(prev, 0.85));
            });
          },
          onModelFinished: (importResult: any, threeObject: any) => {
            if (disposed || loadSessionRef.current !== session) return;
            if (cancelLoadingRef.current) {
              safeUpdate(() => {
                setStatus('cancelled');
                setPhase(null);
              });
              embedded.viewer.Clear?.();
              return;
            }
            embedded.canvas.style.visibility = 'visible';
            embedded.viewer.SetMainObject(threeObject);
            const boundingSphere = embedded.viewer.GetBoundingSphere(() => true);
            embedded.viewer.AdjustClippingPlanesToSphere(boundingSphere);
            viewerMetaRef.current = { boundingSphere };
            embedded.viewer.SetEdgeSettings(new ov.EdgeSettings(false, new ov.RGBColor(140, 140, 140), 25));
            if (embedded.parameters.camera) {
              embedded.viewer.SetCamera(embedded.parameters.camera);
            } else {
              embedded.viewer.SetUpVector(ov.Direction.Y, false);
              embedded.viewer.FitSphereToWindow(boundingSphere, false);
            }
            embedded.model = importResult.model;
            embedded.parameters.onModelLoaded?.();
            safeUpdate(() => {
              setProgress(1);
              setPhase(null);
              setStatus('ready');
              setUiState({
                projection: embedded.viewer.GetProjectionMode() === ov.ProjectionMode.Perspective ? 'perspective' : 'orthographic',
                showEdges: false
              });
            });
            lastBroadcastRef.current = null;
            broadcastCamera();
            onLoad?.();
          },
          onTextureLoaded: () => {
            embedded.viewer.Render();
          },
          onLoadError: (importError: any) => {
            if (disposed || loadSessionRef.current !== session) return;
            const message = formatImportError(ov, importError);
            safeUpdate(() => {
              setStatus('error');
              setPhase(null);
              setErrorMessage(message);
            });
            onError?.(new Error(message));
          }
        });
      } catch (error) {
        if (disposed || loadSessionRef.current !== session) return;
        const message = error instanceof Error ? error.message : '模型加载失败';
        safeUpdate(() => {
          setStatus('error');
          setPhase(null);
          setErrorMessage(message);
        });
        if (error instanceof Error) {
          onError?.(error);
        } else {
          onError?.(new Error(String(error)));
        }
      }
    };

    run();

    return () => {
      disposed = true;
      if (loadSessionRef.current === session) loadSessionRef.current = null;
      destroyCurrentViewer();
      restoreRewrites();
    };
  }, [src, reloadToken, onLoad, onError, attachNavigationHook, broadcastCamera]);

  useEffect(() => {
    if (!syncKey || !syncEnabled) return;
    const record = viewerRecordRef.current;
    if (!record || !lastCamera || lastCamera.sourceId === syncKey) return;
    const camera = parseCameraSnapshot(record.ov, lastCamera.state);
    if (!camera) return;
    applyingCameraRef.current = true;
    try {
      record.embedded.GetViewer().SetCamera(camera);
      lastBroadcastRef.current = serializeCamera(camera);
    } finally {
      window.requestAnimationFrame(() => {
        applyingCameraRef.current = false;
      });
    }
  }, [lastCamera, syncEnabled, syncKey]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const container = containerRef.current;
    const record = viewerRecordRef.current;
    if (!container || !record) return undefined;
    const observer = new ResizeObserver(() => {
      record.embedded.Resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [status, containerRevision]);

  const resolvedHeight = useMemo(() => Math.max(height ?? 0, 240), [height]);
  const progressPercent = Math.max(0, Math.min(100, Math.round(progress * 100)));

  const handleCancel = () => {
    cancelLoadingRef.current = true;
    setStatus('cancelled');
    setPhase(null);
  };

  const handleRetry = () => {
    cancelLoadingRef.current = false;
    setReloadToken(token => token + 1);
  };

  useImperativeHandle(ref, () => ({
    getCamera: () => {
      const record = viewerRecordRef.current;
      if (!record) return null;
      const camera = record.embedded.GetViewer().GetCamera();
      if (!camera) return null;
      const orbit = serializeCamera(camera);
      return {
        orbit,
        target: '',
        fieldOfView: camera.fov ? camera.fov.toString() : undefined,
        timestamp: Date.now()
      };
    },
    setCamera: snapshot => {
      const record = viewerRecordRef.current;
      if (!record) return;
      const camera = parseCameraSnapshot(record.ov, snapshot);
      if (!camera) return;
      record.embedded.GetViewer().SetCamera(camera);
    },
    reload: handleRetry
  }), []);

  const handleFitToView = () => {
    const record = viewerRecordRef.current;
    const meta = viewerMetaRef.current;
    if (!record || !meta.boundingSphere) return;
    record.embedded.viewer.FitSphereToWindow(meta.boundingSphere, true);
  };

  const handleResetView = () => {
    const record = viewerRecordRef.current;
    const meta = viewerMetaRef.current;
    if (!record || !meta.boundingSphere) return;
    record.embedded.viewer.SetUpVector(record.ov.Direction.Y, true);
    record.embedded.viewer.FitSphereToWindow(meta.boundingSphere, true);
  };

  const handleToggleProjection = () => {
    const record = viewerRecordRef.current;
    if (!record) return;
    const viewer = record.embedded.viewer;
    const current = viewer.GetProjectionMode();
    const next = current === record.ov.ProjectionMode.Perspective
      ? record.ov.ProjectionMode.Orthographic
      : record.ov.ProjectionMode.Perspective;
    viewer.SetProjectionMode(next);
    setUiState(state => ({
      ...state,
      projection: next === record.ov.ProjectionMode.Perspective ? 'perspective' : 'orthographic'
    }));
  };

  const handleToggleEdges = () => {
    const record = viewerRecordRef.current;
    if (!record) return;
    const nextShow = !uiState.showEdges;
    const edgeSettings = new record.ov.EdgeSettings(nextShow, new record.ov.RGBColor(140, 140, 140), 25);
    record.embedded.viewer.SetEdgeSettings(edgeSettings);
    setUiState(state => ({ ...state, showEdges: nextShow }));
  };

  const overlay = (() => {
    if (status === 'ready') return null;
    if (status === 'empty') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-gray-500">
          <i className="ri-cube-line mb-2 text-3xl" />
          <span className="text-sm">暂无 3D 模型资源</span>
        </div>
      );
    }
    if (status === 'loading') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="mt-3 text-sm font-medium text-gray-700">{phaseLabel(phase)}</span>
          {showLongLoad && (
            <>
              <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="mt-2 text-xs text-gray-500">{progressPercent}%</span>
              <button
                type="button"
                className="mt-4 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-100"
                onClick={handleCancel}
              >
                取消加载
              </button>
            </>
          )}
        </div>
      );
    }
    if (status === 'cancelled' || status === 'error') {
      const message = status === 'cancelled' ? '已取消模型加载' : errorMessage ?? '模型加载失败';
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 p-6 text-center text-gray-600">
          <i className="ri-alert-line mb-3 text-2xl text-orange-500" />
          <p className="text-sm font-medium">{message}</p>
          {status === 'error' && (
            <p className="mt-2 max-w-xs text-xs text-gray-500">检查模型格式是否受支持（STEP/IGES/IFC/glTF）或尝试转换后重试。</p>
          )}
          <button
            type="button"
            className="mt-4 rounded-md border border-blue-400 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
            onClick={handleRetry}
          >
            重新加载
          </button>
        </div>
      );
    }
    return null;
  })();

  const actionButtons = status === 'ready' ? (
    <div className="pointer-events-auto absolute right-4 top-4 z-10 flex gap-2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-sm">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
        onClick={handleFitToView}
      >
        <i className="ri-focus-line" /> 适配
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
        onClick={handleResetView}
      >
        <i className="ri-compass-3-line" /> 重置
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
        onClick={handleToggleProjection}
      >
        <i className="ri-collage-line" /> {uiState.projection === 'perspective' ? '正交' : '透视'}
      </button>
      <button
        type="button"
        className={combine(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1 transition',
          uiState.showEdges
            ? 'border-blue-300 bg-blue-50 text-blue-600 hover:border-blue-400'
            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
        onClick={handleToggleEdges}
      >
        <i className="ri-shape-line" /> 轮廓
      </button>
      {allowMaximize && (
        <button
          type="button"
          className={combine(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 transition',
            isMaximized
              ? 'border-red-200 bg-red-50 text-red-600 hover:border-red-300'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          )}
          onClick={() => setIsMaximized(prev => !prev)}
        >
          <i className={isMaximized ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'} />
          {isMaximized ? '退出' : '最大化'}
        </button>
      )}
    </div>
  ) : null;

  const setContainerNode = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node) return;
    const record = viewerRecordRef.current;
    const canvas: HTMLCanvasElement | undefined = record?.embedded?.canvas;
    if (!canvas) {
      bumpContainerRevision(prev => prev + 1);
      return;
    }
    if (canvas.parentElement !== node) {
      node.innerHTML = '';
      node.appendChild(canvas);
      if (record?.embedded) {
        record.embedded.parentElement = node;
      }
    }
    record?.embedded?.Resize?.();
    bumpContainerRevision(prev => prev + 1);
  }, [bumpContainerRevision]);

  const renderViewer = (mode: 'inline' | 'overlay') => (
    <div
      className={combine(
        'relative flex w-full overflow-hidden bg-white transition-shadow',
        mode === 'overlay' ? 'flex-1 rounded-2xl shadow-2xl' : 'rounded-xl border border-gray-100'
      )}
      style={mode === 'overlay' ? { height: '100%', minHeight: '100%' } : { height: resolvedHeight, minHeight: resolvedHeight }}
    >
      <div ref={setContainerNode} className="relative h-full w-full" />
      {poster && status !== 'ready' && (
        <Image
          src={poster}
          alt="模型预览封面"
          fill
          priority={status === 'loading'}
          unoptimized
          className="pointer-events-none object-cover opacity-60"
        />
      )}
      {overlay}
      {actionButtons}
    </div>
  );

  if (allowMaximize && isMaximized && typeof document !== 'undefined') {
    const overlayNode = (
      <div className="fixed inset-0 z-50 flex flex-col gap-4 bg-gray-900/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between text-sm text-white">
          <span className="font-medium">3D 模型预览</span>
          <button
            type="button"
            onClick={() => setIsMaximized(false)}
            className="inline-flex items-center gap-1 rounded-md border border-white/30 px-3 py-1.5 text-white transition hover:bg-white/10"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderViewer('overlay')}
        </div>
      </div>
    );

    return (
      <>
        {createPortal(overlayNode, document.body)}
        <div
          className={combine('w-full', className)}
          style={{ height: resolvedHeight, minHeight: resolvedHeight, visibility: 'hidden' }}
          aria-hidden="true"
        />
      </>
    );
  }

  return (
    <div className={combine('relative w-full', className)} style={{ height: resolvedHeight, minHeight: resolvedHeight }}>
      {renderViewer('inline')}
    </div>
  );
});

export default OnlineViewer;
