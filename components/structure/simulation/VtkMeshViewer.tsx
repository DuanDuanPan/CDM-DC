"use client";

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

type MockPreset = 'casing' | 'sphere' | 'lattice';

interface Props {
  className?: string;
  preset?: MockPreset;
  allowMaximize?: boolean;
  title?: string;
}

const background = [0.97, 0.98, 1];

export default function VtkMeshViewer({ className, preset = 'casing', allowMaximize = false, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerToken, setContainerToken] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [overlayNode, setOverlayNode] = useState<HTMLDivElement | null>(null);

  const assignContainer = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current !== node) {
      containerRef.current = node;
      if (node) {
        setContainerToken(token => token + 1);
      }
    }
  }, []);

  useEffect(() => {
    if (!isMaximized) return;
    const node = document.createElement('div');
    document.body.appendChild(node);
    setOverlayNode(node);
    return () => {
      document.body.removeChild(node);
      setOverlayNode(null);
    };
  }, [isMaximized]);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    (async () => {
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

      if (cancelled || !containerRef.current) return;

      const buildCasing = () => {
        const append = vtkAppendPolyData.newInstance();

        const body = vtkCylinderSource.newInstance({
          radius: 0.45,
          height: 1.1,
          resolution: 96,
          capping: true
        });
        append.setInputConnection(body.getOutputPort());

        const addFlange = (offset: number) => {
          const disk = vtkDiskSource.newInstance({
            innerRadius: 0.45,
            outerRadius: 0.68,
            radialResolution: 1,
            circumferentialResolution: 96
          });
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

        const rib = vtkCubeSource.newInstance({
          xLength: 1.15,
          yLength: 0.1,
          zLength: 0.12,
          center: [0, 0, 0]
        });
        const ribTransform = vtkTransform.newInstance();
        ribTransform.rotateY(45);
        const ribFilter = vtkTransformPolyDataFilter.newInstance();
        ribFilter.setTransform(ribTransform);
        ribFilter.setInputConnection(rib.getOutputPort());
        append.addInputConnection(ribFilter.getOutputPort());

        return append;
      };

      const presetFactory: Record<MockPreset, () => any> = {
        casing: buildCasing,
        sphere: () =>
          vtkSphereSource.newInstance({
            radius: 0.5,
            thetaResolution: 48,
            phiResolution: 48
          }),
        lattice: () =>
          vtkCubeSource.newInstance({
            xLength: 1.0,
            yLength: 0.6,
            zLength: 0.8,
            center: [0, 0, 0]
          })
      };

      const genericRenderWindow = vtkGenericRenderWindow.newInstance({
        background
      });
      genericRenderWindow.setContainer(containerRef.current);

      const renderer = genericRenderWindow.getRenderer();
      const renderWindow = genericRenderWindow.getRenderWindow();
      const interactor = genericRenderWindow.getInteractor();

      const sourceFactory = presetFactory[preset] ?? presetFactory.casing;
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
      renderWindow.render();

      let resizeObserver: ResizeObserver | undefined;
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          genericRenderWindow.resize();
          renderWindow.render();
        });
        resizeObserver.observe(containerRef.current);
      }

      dispose = () => {
        if (interactor) {
          try {
            interactor.cancelAnimation?.(interactor, true);
          } catch {
            // ignore cancel errors
          }
          interactor.setAnimationState?.(false);
          if (containerRef.current) {
            interactor.unbindEvents?.(containerRef.current);
          }
        }
        renderer.removeAllViewProps();
        genericRenderWindow.setContainer(null);
        genericRenderWindow.delete();
        resizeObserver?.disconnect();
      };
    })();

    return () => {
      cancelled = true;
      if (dispose) dispose();
    };
  }, [preset, isMaximized, containerToken]);

  const viewerInner = (
    <div className="relative h-full w-full">
      {allowMaximize && (
        <button
          type="button"
          onClick={() => setIsMaximized(prev => !prev)}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-blue-600 shadow-sm transition hover:bg-white"
        >
          <i className={`ri-${isMaximized ? 'contract-right-line' : 'fullscreen-line'} text-sm`} />
          {isMaximized ? '退出全屏' : '全屏预览'}
        </button>
      )}
      <div
        ref={assignContainer}
        className="h-full w-full rounded-xl border border-blue-100 bg-gradient-to-br from-slate-50 via-white to-slate-100"
      />
    </div>
  );

  if (isMaximized && overlayNode) {
    return createPortal(
      <div className="fixed inset-0 z-[1050] flex flex-col bg-black/80">
        <div className="flex items-center justify-between px-6 py-4 text-white">
          <div className="text-sm font-medium">{title || '机匣网格预览（Mock 数据）'}</div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
            onClick={() => setIsMaximized(false)}
          >
            <i className="ri-close-line text-base" />
            关闭
          </button>
        </div>
        <div className="flex-1 px-6 pb-6">
          <div className="h-full w-full max-w-6xl mx-auto rounded-2xl bg-white/5 p-4 shadow-lg">
            {viewerInner}
          </div>
        </div>
      </div>,
      overlayNode
    );
  }

  return (
    <div className={className}>
      <div className="relative h-full w-full">
        {!allowMaximize && title && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm">
            {title}
          </div>
        )}
        {viewerInner}
      </div>
    </div>
  );
}
