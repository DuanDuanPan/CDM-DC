'use client';

import { useMemo, useState } from 'react';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';
import { TBOM_DOMAIN_DEFINITIONS } from './constants';
import type { TbomFilterSnapshot } from './types';
import {
  useTbomCrossDomainNavigation,
  type TbomRelationChipDescriptor,
  type TbomRelationChipState,
} from './useTbomCrossDomainNavigation';

type TbomRelationChipsProps = {
  selection: TbomSelection | null;
  filters?: TbomFilterSnapshot | null;
  runOverride?: TbomRun | null;
  className?: string;
  dense?: boolean;
};

type RelationContext = {
  project: TbomProject | null;
  test: TbomTest | null;
  run: TbomRun | null;
};

const createDescriptor = (
  domain: TbomRelationChipDescriptor['domain'],
  state: TbomRelationChipState,
  overrides: Partial<TbomRelationChipDescriptor>,
): TbomRelationChipDescriptor => {
  const base = TBOM_DOMAIN_DEFINITIONS[domain];
  return {
    domain,
    state,
    label: base.label,
    ariaLabel: `${base.label} ${state === 'ready' ? '可跳转' : state === 'empty' ? '暂无数据' : '发生错误'}`,
    ...overrides,
  };
};

const computeContext = (selection: TbomSelection | null, runOverride?: TbomRun | null): RelationContext => {
  if (!selection) {
    return {
      project: null,
      test: null,
      run: runOverride ?? null,
    };
  }
  if (selection.level === 'project') {
    return {
      project: selection.project,
      test: null,
      run: runOverride ?? null,
    };
  }
  if (selection.level === 'test') {
    return {
      project: selection.project,
      test: selection.test,
      run: runOverride ?? null,
    };
  }
  return {
    project: selection.project,
    test: selection.test,
    run: runOverride ?? selection.run,
  };
};

const deriveRequirement = (context: RelationContext): TbomRelationChipDescriptor => {
  const relation =
    context.project?.relations?.find((item) => item.kind === 'requirement') ?? null;
  if (!relation) {
    return createDescriptor('requirement', 'empty', {
      reason: '当前 TBOM 节点未映射需求标识。',
      refLabel: '未关联',
    });
  }
  if (!relation.ref_id?.trim()) {
    return createDescriptor('requirement', 'error', {
      reason: '需求关联缺少唯一标识，请检查契约配置。',
      refLabel: '标识缺失',
    });
  }
  const refId = relation.ref_id.trim();
  const hrefParams = {
    panel: 'requirements',
    requirementId: refId,
    tbomProject: context.project?.project_id,
    tbomTest: context.test?.test_id,
    tbomRun: context.run?.run_id,
  };
  return createDescriptor('requirement', 'ready', {
    refId,
    refLabel: refId,
    hrefParams,
    announceMessage: `需求关联 ${refId}`,
  });
};

const deriveEbom = (context: RelationContext): TbomRelationChipDescriptor => {
  const ebomNodeId =
    context.run?.ebom_node_id ??
    context.test?.ebom_node_id ??
    context.project?.relations?.find((item) => item.kind === 'ebom')?.ref_id ??
    null;
  const ebomPath =
    context.test?.ebom_path ??
    undefined;
  if (!ebomNodeId?.trim()) {
    return createDescriptor('ebom', 'empty', {
      reason: '未找到 EBOM 节点映射，无法跳转。',
      refLabel: '未关联',
    });
  }
  const hrefParams = {
    panel: 'ebom',
    node: ebomNodeId,
    path: ebomPath,
    tbomProject: context.project?.project_id,
    tbomTest: context.test?.test_id,
    tbomRun: context.run?.run_id,
  };
  return createDescriptor('ebom', 'ready', {
    refId: ebomNodeId,
    refLabel: ebomNodeId,
    hrefParams,
    extras: {
      ebomNodeId,
      ebomPath,
    },
  });
};

const deriveSimulation = (context: RelationContext): TbomRelationChipDescriptor => {
  const relation =
    context.project?.relations?.find((item) => item.kind === 'simulation') ?? null;
  if (!relation) {
    return createDescriptor('simulation', 'empty', {
      reason: '当前项目尚未映射仿真模型，可在仿真团队补全后使用。',
      refLabel: '未关联',
    });
  }
  if (!relation.ref_id?.trim()) {
    return createDescriptor('simulation', 'error', {
      reason: '仿真关联缺少唯一标识。',
      refLabel: '标识缺失',
    });
  }
  const refId = relation.ref_id.trim();
  const hrefParams = {
    panel: 'simulation',
    simulationRef: refId,
    tbomProject: context.project?.project_id,
    tbomTest: context.test?.test_id,
    tbomRun: context.run?.run_id,
  };
  return createDescriptor('simulation', 'ready', {
    refId,
    refLabel: refId,
    hrefParams,
  });
};

const derivePhysical = (context: RelationContext): TbomRelationChipDescriptor => {
  const serial = context.run?.test_item_sn?.trim();
  const assemblyId = context.run?.assembly_bom_id?.trim();
  if (!serial && !assemblyId) {
    return createDescriptor('physical', 'empty', {
      reason: '运行未提供实物序列号或组装件标识，无法追溯实物。',
      refLabel: '未关联',
    });
  }
  const hrefParams = {
    panel: 'asset',
    assetSn: serial,
    assemblyId,
    tbomProject: context.project?.project_id,
    tbomTest: context.test?.test_id,
    tbomRun: context.run?.run_id,
  };
  return createDescriptor('physical', 'ready', {
    refId: serial ?? assemblyId,
    refLabel: serial ?? assemblyId ?? '',
    hrefParams,
    extras: {
      testItemSn: serial,
      assemblyBomId: assemblyId,
    },
  });
};

const deriveDescriptors = (
  selection: TbomSelection | null,
  runOverride?: TbomRun | null,
): TbomRelationChipDescriptor[] => {
  const context = computeContext(selection, runOverride);
  return [
    deriveRequirement(context),
    deriveEbom(context),
    deriveSimulation(context),
    derivePhysical(context),
  ];
};

export default function TbomRelationChips({
  selection,
  filters = null,
  runOverride = null,
  className,
  dense = false,
}: TbomRelationChipsProps) {
  const [liveMessage, setLiveMessage] = useState('跨域导航待命。');

  const descriptors = useMemo(
    () => deriveDescriptors(selection, runOverride ?? undefined),
    [selection, runOverride],
  );

  const { handleChipClick, handleChipFocus } = useTbomCrossDomainNavigation({
    selection,
    filters,
    onAnnounce: setLiveMessage,
    runOverride: runOverride ?? null,
  });

  return (
    <div className={className}>
      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>
      <div className={`flex flex-wrap gap-2 ${dense ? 'text-xs' : 'text-sm'}`}>
        {descriptors.map((chip) => {
          const definition = TBOM_DOMAIN_DEFINITIONS[chip.domain];
          const isReady = chip.state === 'ready';
          const baseClasses =
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';
          const toneClasses = isReady
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : chip.state === 'empty'
            ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
            : 'border-rose-200 bg-rose-50 text-rose-600 cursor-not-allowed';
          return (
            <button
              key={chip.domain}
              type="button"
              className={`${baseClasses} ${toneClasses}`}
              onClick={(event) => handleChipClick(chip, event)}
              onFocus={() => handleChipFocus(chip)}
              onMouseEnter={() => handleChipFocus(chip)}
              aria-disabled={!isReady}
              data-domain={chip.domain}
            >
              <i className={`${definition.icon} ${dense ? 'text-sm' : 'text-base'}`} aria-hidden />
              <span>{definition.label}</span>
              <span className="rounded bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {chip.refLabel ?? '未关联'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
