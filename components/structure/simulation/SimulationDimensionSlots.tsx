import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { SIMULATION_DIMENSION_DESCRIPTORS } from './dimensions';
import type { SimulationDimension, SimulationSavedView } from './types';

interface Props {
  activeDimensions: SimulationDimension[];
  onChange: (next: SimulationDimension[]) => void;
  savedViews?: SimulationSavedView[];
  onSaveView?: (name: string) => void;
  onApplySavedView?: (id: string) => void;
  onDeleteSavedView?: (id: string) => void;
  onRenameSavedView?: (id: string, name: string) => void;
}

const DIMENSION_SEQUENCE: SimulationDimension[] = ['structure', 'type', 'time'];

const iconFallback: Record<SimulationDimension, string> = {
  structure: 'ri-mind-map',
  type: 'ri-apps-line',
  time: 'ri-calendar-2-line'
};

const dimensionDescriptorMap = new Map(SIMULATION_DIMENSION_DESCRIPTORS.map(descriptor => [descriptor.id, descriptor]));

const SimulationDimensionSlots = ({
  activeDimensions,
  onChange,
  savedViews = [],
  onSaveView,
  onApplySavedView,
  onDeleteSavedView,
  onRenameSavedView
}: Props) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const manageButtonRef = useRef<HTMLButtonElement | null>(null);

  const orderedActive = useMemo(
    () => activeDimensions.filter(dimension => DIMENSION_SEQUENCE.includes(dimension)),
    [activeDimensions]
  );

  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current || !manageButtonRef.current) return;
      if (!panelRef.current.contains(target) && !manageButtonRef.current.contains(target)) {
        setPanelOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelOpen]);

  const toggleDimension = useCallback(
    (dimension: SimulationDimension) => {
      const exists = orderedActive.includes(dimension);
      if (exists) {
        const next = orderedActive.filter(item => item !== dimension);
        onChange(next.length > 0 ? next : ['structure']);
      } else {
        onChange([...orderedActive, dimension]);
      }
    },
    [onChange, orderedActive]
  );

  const moveDimension = useCallback(
    (dimension: SimulationDimension, direction: 'forward' | 'backward') => {
      const index = orderedActive.indexOf(dimension);
      if (index === -1) return;
      const targetIndex = direction === 'forward' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= orderedActive.length) return;
      const next = [...orderedActive];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      onChange(next);
    },
    [onChange, orderedActive]
  );

  const handleReset = useCallback(() => {
    onChange(['structure']);
  }, [onChange]);

  const handleSaveView = useCallback(() => {
    if (!onSaveView || typeof window === 'undefined') return;
    const suggested = `组合 ${savedViews.length + 1}`;
    const input = window.prompt('保存当前维度组合名称（≤30 字符）', suggested);
    if (!input) return;
    const trimmed = input.trim().slice(0, 30);
    if (!trimmed) return;
    onSaveView(trimmed);
  }, [onSaveView, savedViews.length]);

  const summaryLabel = orderedActive.length > 0
    ? orderedActive
        .map((dim, index) => {
          const descriptor = dimensionDescriptorMap.get(dim);
          const label = descriptor?.label ?? dim;
          return `${index + 1}. ${label}`;
        })
        .join(' → ')
    : '结构';

  return (
    <div className="relative space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <i className="ri-sliders-line text-lg text-blue-500" />
          <span className="text-sm font-semibold text-gray-900">维度组合</span>
        </div>
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">当前顺序：{summaryLabel}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-blue-200 hover:text-blue-600"
            onClick={handleReset}
          >
            <i className="ri-refresh-line text-xs" />
            重置
          </button>
          {onSaveView && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
              onClick={handleSaveView}
            >
              <i className="ri-save-3-line text-xs" />
              保存组合
            </button>
          )}
          <button
            type="button"
            ref={manageButtonRef}
            onClick={() => setPanelOpen(prev => !prev)}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-blue-200 hover:text-blue-600"
            aria-expanded={panelOpen}
            aria-controls="simulation-dimension-panel"
          >
            <i className="ri-equalizer-line text-xs" />
            管理
          </button>
        </div>
      </div>

      {panelOpen && (
        <div className="flex justify-end">
          <div
            id="simulation-dimension-panel"
            ref={panelRef}
            className="mt-3 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
          >
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-gray-600">维度管理</span>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
              aria-label="关闭维度管理"
            >
              <i className="ri-close-line text-sm" />
            </button>
          </div>
          <div className="space-y-2">
            {DIMENSION_SEQUENCE.map(dimension => {
              const descriptor = dimensionDescriptorMap.get(dimension);
              const label = descriptor?.label ?? dimension;
              const description = descriptor?.description ?? label;
              const activeIndex = orderedActive.indexOf(dimension);
              const active = activeIndex !== -1;
              const canMoveBackward = active && activeIndex > 0;
              const canMoveForward = active && activeIndex < orderedActive.length - 1;

              return (
                <div
                  key={dimension}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-gray-50 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700"
                  data-active={active}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {active ? activeIndex + 1 : '-'}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <i className={`${descriptor?.icon ?? iconFallback[dimension]} text-base ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate text-sm font-medium text-gray-900">{label}</span>
                    <button
                      type="button"
                      className="ml-1 text-gray-400 transition hover:text-blue-600"
                      title={description}
                      aria-label={`${label} 说明`}
                    >
                      <i className="ri-information-line text-sm" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveDimension(dimension, 'backward')}
                      disabled={!canMoveBackward}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition ${
                        canMoveBackward
                          ? 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                          : 'border-gray-200 text-gray-300'
                      }`}
                      title="前移"
                      aria-label={`前移 ${label}`}
                    >
                      <i className="ri-arrow-left-s-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDimension(dimension, 'forward')}
                      disabled={!canMoveForward}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition ${
                        canMoveForward
                          ? 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                          : 'border-gray-200 text-gray-300'
                      }`}
                      title="后移"
                      aria-label={`后移 ${label}`}
                    >
                      <i className="ri-arrow-right-s-line" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDimension(dimension)}
                    className={`inline-flex h-7 items-center justify-center rounded-full px-2 text-[11px] font-medium transition ${
                      active
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200 hover:bg-blue-600 hover:text-white'
                        : 'bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:text-blue-600 hover:ring-blue-200'
                    }`}
                    aria-label={`${active ? '移除' : '加入'} ${label}`}
                    title={active ? '移除维度' : '加入维度'}
                  >
                    {active ? '移除' : '加入'}
                  </button>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {savedViews.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <i className="ri-bookmark-2-line text-sm text-blue-500" />
            <span className="font-medium text-gray-700">已保存组合</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {savedViews.map(view => (
              <span
                key={view.id}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onApplySavedView?.(view.id)}
                  className="inline-flex items-center gap-1 hover:text-blue-600"
                  title={`应用组合：${view.name}`}
                >
                  <i className="ri-play-circle-line text-sm text-blue-500" />
                  {view.name}
                </button>
                {onRenameSavedView && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window === 'undefined') return;
                      const input = window.prompt('重命名组合', view.name);
                      if (!input) return;
                      const trimmed = input.trim().slice(0, 30);
                      if (!trimmed) return;
                      onRenameSavedView(view.id, trimmed);
                    }}
                    className="text-gray-400 hover:text-blue-600"
                    title="重命名"
                  >
                    <i className="ri-edit-2-line text-xs" />
                  </button>
                )}
                {onDeleteSavedView && (
                  <button
                    type="button"
                    onClick={() => onDeleteSavedView(view.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="删除"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationDimensionSlots;
