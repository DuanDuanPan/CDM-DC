'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import type {
  TransformationOverviewGraphData,
  TransformationGraphNode,
  TransformationGraphStage,
  TransformationLinkKind,
  TransformationLinkVisibility,
} from '@/components/structure/types';

const STAGE_GAP = 160;
const COLUMN_WIDTH = 220;
const TREE_PADDING_X = 28;
const VERTICAL_GAP = 60;
const VIEW_PADDING = { top: 80, right: 160, bottom: 100, left: 160 };
const ZOOM_MIN = 0.2;
const AUTO_ZOOM_MIN = 0.05;
const ZOOM_MAX = 2.5;
const PAN_PADDING = 120;
const LABEL_CHAR_WIDTH = 12;
const LABEL_PADDING = 18;

const LINK_COLORS: Record<TransformationLinkKind, string> = {
  principle: '#2563eb',
  baseline: '#f97316',
  evidence: '#16a34a',
};

type LayoutNode = {
  id: string;
  label: string;
  stageId: string;
  highlight?: boolean;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
};

type StagePanel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

type TreeLink = {
  stageId: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
};

type CrossLink = {
  kind: TransformationLinkKind;
  sourceId: string;
  targetId: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
};

type LayoutGraph = {
  nodes: LayoutNode[];
  treeLinks: TreeLink[];
  crossLinks: CrossLink[];
  panels: StagePanel[];
  width: number;
  height: number;
};

type StageBounds = {
  minX: number;
  maxX: number;
  width: number;
};

type StageLayout = {
  nodes: LayoutNode[];
  links: TreeLink[];
  panel: StagePanel;
  height: number;
  bounds: StageBounds;
};

type TransformationFlowGraphProps = {
  data: TransformationOverviewGraphData;
  className?: string;
  highlightLinks?: boolean;
  visibleKinds?: TransformationLinkVisibility;
};

const isKindVisible = (kind: TransformationLinkKind | undefined, visibility?: TransformationLinkVisibility) => {
  if (!visibility || !kind) return true;
  return visibility[kind] !== false;
};

const layoutStage = (stage: TransformationGraphStage): StageLayout => {
  const root = hierarchy<TransformationGraphNode>(stage.tree);
  const treeLayout = tree<TransformationGraphNode>()
    .nodeSize([VERTICAL_GAP, COLUMN_WIDTH - TREE_PADDING_X])
    .separation((a, b) => (a.parent === b.parent ? 1.3 : 1.6));

  treeLayout(root);

  const minY = Math.min(...root.descendants().map((node) => node.x));
  const maxY = Math.max(...root.descendants().map((node) => node.x));
  const height = maxY - minY + VERTICAL_GAP;

  const nodes: LayoutNode[] = root.descendants().map((node) => ({
    id: `${stage.id}:${node.data.id}`,
    label: node.data.name,
    stageId: stage.id,
    highlight: node.data.highlight,
    x: node.y + TREE_PADDING_X,
    y: node.x - minY,
    depth: node.depth,
    parentId: node.parent ? `${stage.id}:${node.parent.data.id}` : undefined,
  }));

  const links: TreeLink[] = root.links().map((link) => ({
    stageId: stage.id,
    source: { x: link.source.y + TREE_PADDING_X, y: link.source.x - minY },
    target: { x: link.target.y + TREE_PADDING_X, y: link.target.x - minY },
  }));

  const panel: StagePanel = {
    id: stage.id,
    x: -COLUMN_WIDTH / 2,
    y: -VERTICAL_GAP,
    width: COLUMN_WIDTH,
    height: height + VERTICAL_GAP * 2,
    label: stage.title,
  };

  const stageNodes = nodes.length ? nodes : [];

  if (stageNodes.length) {
    const minNodeY = Math.min(...stageNodes.map((node) => node.y));
    const maxNodeY = Math.max(...stageNodes.map((node) => node.y));
    const verticalPadding = Math.max(VERTICAL_GAP * 0.6, 30);
    panel.y = Math.min(panel.y, minNodeY - verticalPadding);
    panel.height = Math.max(panel.height, maxNodeY - minNodeY + verticalPadding * 2);
  }

  let minX = panel.x;
  let maxX = panel.x + panel.width;

  if (stageNodes.length) {
    const nodeBounds = stageNodes.map((node) => {
      const labelWidth = Math.max(node.label.length, 2) * LABEL_CHAR_WIDTH;
      if (node.depth % 2 === 0) {
        return {
          minX: node.x,
          maxX: node.x + LABEL_PADDING + labelWidth,
        };
      }
      return {
        minX: node.x - LABEL_PADDING - labelWidth,
        maxX: node.x,
      };
    });
    const nodeMinX = Math.min(...nodeBounds.map((bounds) => bounds.minX));
    const nodeMaxX = Math.max(...nodeBounds.map((bounds) => bounds.maxX));
    const horizontalPadding = Math.max(COLUMN_WIDTH * 0.25, 32);
    minX = Math.min(minX, nodeMinX - horizontalPadding);
    maxX = Math.max(maxX, nodeMaxX + horizontalPadding);
  }

  panel.x = minX;
  panel.width = maxX - minX;

  const bounds: StageBounds = {
    minX,
    maxX,
    width: maxX - minX,
  };

  return { nodes, links, panel, height, bounds };
};

const buildLayoutGraph = (data: TransformationOverviewGraphData, visibility?: TransformationLinkVisibility): LayoutGraph => {
  const stagesToUse = data.stages;
  const stageLayouts = stagesToUse.map((stage) => layoutStage(stage));

  let cursor = 0;
  stageLayouts.forEach((layout, index) => {
    const stageOffset = cursor - layout.bounds.minX;

    layout.nodes.forEach((node) => {
      node.x += stageOffset;
    });
    layout.links.forEach((link) => {
      link.source.x += stageOffset;
      link.target.x += stageOffset;
    });
    layout.panel.x += stageOffset;

    layout.bounds.minX += stageOffset;
    layout.bounds.maxX += stageOffset;

    cursor += layout.bounds.width + (index < stageLayouts.length - 1 ? STAGE_GAP : 0);
  });

  const nodes = stageLayouts.flatMap((layout) => layout.nodes);
  const treeLinks = stageLayouts.flatMap((layout) => layout.links);
  const panels = stageLayouts.map((layout) => layout.panel);
  const stageHeight = Math.max(...stageLayouts.map((layout) => layout.height), 0);

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  const crossLinks: CrossLink[] = (data.links ?? [])
    .filter((link) => isKindVisible(link.kind ?? 'principle', visibility))
    .map((link) => {
      const sourceId = `${link.source.stageId}:${link.source.nodeId}`;
      const targetId = `${link.target.stageId}:${link.target.nodeId}`;
      const source = nodeMap.get(sourceId);
      const target = nodeMap.get(targetId);
      if (!source || !target) return null;
      return {
        kind: link.kind ?? 'principle',
        sourceId,
        targetId,
        source: { x: source.x, y: source.y },
        target: { x: target.x, y: target.y },
      } as CrossLink;
    })
    .filter((link): link is CrossLink => Boolean(link));

  const rawWidth = stageLayouts.length
    ? Math.max(stageLayouts[stageLayouts.length - 1].bounds.maxX - stageLayouts[0].bounds.minX, COLUMN_WIDTH)
    : COLUMN_WIDTH;
  let rawHeight = Math.max(stageHeight + VERTICAL_GAP * 4, 360);

  const TARGET_INNER_HEIGHT = 540;
  if (rawHeight > TARGET_INNER_HEIGHT) {
    const scale = TARGET_INNER_HEIGHT / rawHeight;
    nodes.forEach((node) => {
      node.y *= scale;
    });
    treeLinks.forEach((link) => {
      link.source.y *= scale;
      link.target.y *= scale;
    });
    panels.forEach((panel) => {
      panel.y *= scale;
      panel.height *= scale;
    });
    crossLinks.forEach((link) => {
      link.source.y *= scale;
      link.target.y *= scale;
    });
    rawHeight = TARGET_INNER_HEIGHT;
  }

  const width = rawWidth + VIEW_PADDING.left + VIEW_PADDING.right;
  let height = rawHeight + VIEW_PADDING.top + VIEW_PADDING.bottom;

  const translate = ({ x, y }: { x: number; y: number }) => ({
    x: x + VIEW_PADDING.left,
    y: y + VIEW_PADDING.top,
  });

  nodes.forEach((node) => {
    const translated = translate(node);
    node.x = translated.x;
    node.y = translated.y;
  });

  treeLinks.forEach((link) => {
    link.source = translate(link.source);
    link.target = translate(link.target);
  });

  panels.forEach((panel) => {
    const translated = translate({ x: panel.x, y: panel.y });
    panel.x = translated.x;
    panel.y = translated.y;
  });

  panels.forEach((panel) => {
    const stageNodes = nodes.filter((node) => node.stageId === panel.id);
    if (!stageNodes.length) return;
    const minY = Math.min(...stageNodes.map((node) => node.y));
    const maxY = Math.max(...stageNodes.map((node) => node.y));
    const padding = Math.max(VERTICAL_GAP * 0.6, 30);
    panel.y = Math.min(panel.y, minY - padding);
    panel.height = Math.max(panel.height, maxY - minY + padding * 2);
  });

  crossLinks.forEach((link) => {
    link.source = translate(link.source);
    link.target = translate(link.target);
  });

  const maxNodeY = Math.max(...nodes.map((node) => node.y));
  height = Math.max(height, maxNodeY + VIEW_PADDING.bottom + VERTICAL_GAP);

  const TARGET_HEIGHT = 780;
  if (height > TARGET_HEIGHT) {
    const usableHeight = height - VIEW_PADDING.top - VIEW_PADDING.bottom;
    const targetUsableHeight = TARGET_HEIGHT - VIEW_PADDING.top - VIEW_PADDING.bottom;
    const scale = targetUsableHeight / usableHeight;
    const scaleY = (value: number) => VIEW_PADDING.top + (value - VIEW_PADDING.top) * scale;

    nodes.forEach((node) => {
      node.y = scaleY(node.y);
    });
    treeLinks.forEach((link) => {
      link.source.y = scaleY(link.source.y);
      link.target.y = scaleY(link.target.y);
    });
    panels.forEach((panel) => {
      const bottom = panel.y + panel.height;
      panel.y = scaleY(panel.y);
      panel.height = scaleY(bottom) - panel.y;
    });
    crossLinks.forEach((link) => {
      link.source.y = scaleY(link.source.y);
      link.target.y = scaleY(link.target.y);
    });
    height = TARGET_HEIGHT;
  }

  return {
    nodes,
    treeLinks,
    crossLinks,
    panels,
    width,
    height,
  };
};

export default function TransformationFlowGraph({
  data,
  className,
  highlightLinks = true,
  visibleKinds,
}: TransformationFlowGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const hasUserAdjustedRef = useRef(false);
  const isAutoZoomingRef = useRef(false);
  const [showHint, setShowHint] = useState(true);

  const layout = useMemo(() => buildLayoutGraph(data, visibleKinds), [data, visibleKinds]);
  const layoutRef = useRef(layout);

  useEffect(() => {
    hasUserAdjustedRef.current = false;
  }, [layout.width, layout.height]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const targetHeight = useMemo(() => Math.min(Math.max(layout.height, 420), 900), [layout.height]);

  const applyAutoZoom = useCallback(() => {
    if (hasUserAdjustedRef.current) return;
    if (!containerRef.current || !svgRef.current || !zoomRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (!containerWidth || !containerHeight) return;

    const widthScale = containerWidth / layout.width;
    if (!Number.isFinite(widthScale) || widthScale <= 0) return;

    let targetScale = widthScale;
    targetScale = Math.min(ZOOM_MAX, Math.max(targetScale, AUTO_ZOOM_MIN));
    if (zoomRef.current) {
      const minExtent = Math.min(ZOOM_MIN, targetScale);
      zoomRef.current.scaleExtent([minExtent, ZOOM_MAX]);
      zoomRef.current.extent([
        [0, 0],
        [containerWidth, containerHeight],
      ]);
      zoomRef.current.translateExtent([
        [-PAN_PADDING, -PAN_PADDING],
        [layout.width + PAN_PADDING, layout.height + PAN_PADDING],
      ]);
    }
    const scaledWidth = layout.width * targetScale;
    const scaledHeight = layout.height * targetScale;
    const translateX = Math.max((containerWidth - scaledWidth) / 2, 0);
    const translateY = Math.max((containerHeight - scaledHeight) / 2, 0);

    const transform = zoomIdentity.translate(translateX, translateY).scale(targetScale);
    isAutoZoomingRef.current = true;
    try {
      select(svgRef.current).call(zoomRef.current.transform, transform);
    } finally {
      isAutoZoomingRef.current = false;
    }
  }, [layout.height, layout.width]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!containerRef.current || svgRef.current) return;

    const svg = select(containerRef.current)
      .append('svg')
      .attr('class', 'w-full h-full select-none');

    const viewport = svg.append('g').attr('class', 'viewport');
    viewport.append('g').attr('class', 'panels');
    viewport.append('g').attr('class', 'tree-links');
    viewport.append('g').attr('class', 'cross-links');
    viewport.append('g').attr('class', 'nodes');

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .constrain((transform, extent) => {
        const layoutSnapshot = layoutRef.current;
        if (!extent || !layoutSnapshot) return transform;
        const [[x0, y0], [x1, y1]] = extent;
        const containerWidth = x1 - x0;
        const containerHeight = y1 - y0;

        if (!containerWidth || !containerHeight) {
          return transform;
        }

        const scaledWidth = layoutSnapshot.width * transform.k;
        const scaledHeight = layoutSnapshot.height * transform.k;
        const paddingX = PAN_PADDING;
        const paddingY = PAN_PADDING;

        let minX: number;
        let maxX: number;
        if (scaledWidth <= containerWidth) {
          const centeredX = (containerWidth - scaledWidth) / 2;
          minX = centeredX;
          maxX = centeredX;
        } else {
          minX = containerWidth - scaledWidth - paddingX;
          maxX = paddingX;
        }

        if (minX > maxX) {
          const center = (containerWidth - scaledWidth) / 2;
          minX = center;
          maxX = center;
        }

        let minY: number;
        let maxY: number;
        if (scaledHeight <= containerHeight) {
          const centeredY = (containerHeight - scaledHeight) / 2;
          minY = centeredY;
          maxY = centeredY;
        } else {
          minY = containerHeight - scaledHeight - paddingY;
          maxY = paddingY;
        }

        if (minY > maxY) {
          const center = (containerHeight - scaledHeight) / 2;
          minY = center;
          maxY = center;
        }

        const clampedX = Math.max(minX, Math.min(maxX, transform.x));
        const clampedY = Math.max(minY, Math.min(maxY, transform.y));

        if (clampedX === transform.x && clampedY === transform.y) {
          return transform;
        }

        return zoomIdentity.translate(clampedX, clampedY).scale(transform.k);
      })
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString());
        if (!isAutoZoomingRef.current) {
          hasUserAdjustedRef.current = true;
        }
        setShowHint(false);
      });

    svg.call(zoomBehavior as any);

    svgRef.current = svg.node();
    viewportRef.current = viewport.node();
    zoomRef.current = zoomBehavior;
  }, []);

  useEffect(() => {
    if (!svgRef.current || !viewportRef.current) return;

    const svg = select(svgRef.current);
    const viewport = select(viewportRef.current);

    svg.attr('viewBox', `0 0 ${layout.width} ${layout.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const panelSelection = viewport
      .select<SVGGElement>('g.panels')
      .selectAll<SVGRectElement, StagePanel>('g.panel')
      .data(layout.panels, (panel) => panel.id);

    const panelEnter = panelSelection
      .enter()
      .append('g')
      .attr('class', 'panel');

    panelEnter
      .append('rect')
      .attr('rx', 28)
      .attr('fill', 'rgba(227, 240, 255, 0.35)')
      .attr('stroke', '#c0d8ff')
      .attr('stroke-width', 1);

    panelEnter
      .append('text')
      .attr('class', 'panel-title')
      .attr('fill', '#0f172a')
      .attr('font-size', 14)
      .attr('font-weight', 600)
      .attr('text-anchor', 'middle');

    const panelMerge = panelEnter.merge(panelSelection as any);

    panelMerge
      .select('rect')
      .attr('x', (panel) => panel.x)
      .attr('y', (panel) => panel.y)
      .attr('width', (panel) => panel.width)
      .attr('height', (panel) => panel.height);

    panelMerge
      .select('text.panel-title')
      .attr('x', (panel) => panel.x + panel.width / 2)
      .attr('y', (panel) => panel.y - 24)
      .text((panel) => panel.label);

    panelSelection.exit().remove();

    const linkGenerator = (link: { source: { x: number; y: number }; target: { x: number; y: number } }) =>
      `M${link.source.x},${link.source.y}C${(link.source.x + link.target.x) / 2},${link.source.y} ${(link.source.x +
        link.target.x) /
        2},${link.target.y} ${link.target.x},${link.target.y}`;

    const treeLinkSelection = viewport
      .select<SVGGElement>('g.tree-links')
      .selectAll<SVGPathElement, TreeLink>('path.tree-link')
      .data(layout.treeLinks, (link) => `${link.stageId}-${link.source.x}-${link.target.x}-${link.target.y}`);

    treeLinkSelection
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('fill', 'none')
      .attr('stroke', '#dbe4ff')
      .attr('stroke-width', 1)
      .merge(treeLinkSelection as any)
      .attr('d', (link) => linkGenerator(link));

    treeLinkSelection.exit().remove();

    const crossLinkSelection = viewport
      .select<SVGGElement>('g.cross-links')
      .selectAll<SVGPathElement, CrossLink>('path.cross-link')
      .data(layout.crossLinks, (link) => `${link.sourceId}->${link.targetId}`);

    crossLinkSelection
      .enter()
      .append('path')
      .attr('class', 'cross-link')
      .attr('fill', 'none')
      .attr('pointer-events', 'none')
      .attr('stroke-width', highlightLinks ? 2 : 1.5)
      .attr('stroke-opacity', 0.6)
      .merge(crossLinkSelection as any)
      .attr('stroke', (link) => LINK_COLORS[link.kind] ?? '#94a3b8')
      .attr('d', (link) => linkGenerator(link));

    crossLinkSelection.exit().remove();

    const nodeGroup = viewport.select<SVGGElement>('g.nodes');

    const nodeSelection = nodeGroup.selectAll<SVGGElement, LayoutNode>('g.node').data(layout.nodes, (node) => node.id);

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node');

    nodeEnter
      .append('circle')
      .attr('r', 6)
      .attr('stroke-width', 1.2);

    nodeEnter
      .append('text')
      .attr('class', 'node-label')
      .attr('fill', '#0f172a')
      .attr('font-size', 12)
      .attr('font-weight', 400)
      .attr('y', 4);

    const nodeMerge = nodeEnter.merge(nodeSelection as any);

    nodeMerge
      .attr('transform', (node) => `translate(${node.x}, ${node.y})`)
      .style('cursor', 'default');

    nodeMerge
      .select('circle')
      .attr('r', (node) => (node.highlight ? 8 : 6))
      .attr('fill', (node) => (node.highlight ? '#2563eb' : '#f8fbff'))
      .attr('stroke', (node) => (node.highlight ? '#1d4ed8' : '#94a3b8'))
      .attr('stroke-width', (node) => (node.highlight ? 2 : 1.2));

    nodeMerge
      .select('text.node-label')
      .attr('x', (node) => (node.depth % 2 === 0 ? 12 : -12))
      .attr('text-anchor', (node) => (node.depth % 2 === 0 ? 'start' : 'end'))
      .attr('font-weight', (node) => (node.highlight ? 600 : 400))
      .text((node) => node.label);

    nodeSelection.exit().remove();

    applyAutoZoom();
  }, [layout, highlightLinks, applyAutoZoom]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      applyAutoZoom();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [applyAutoZoom]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className ?? ''}`}
      style={{ minHeight: targetHeight, height: targetHeight }}
    >
      {showHint ? (
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-2 text-[11px] text-white shadow-lg">
          <i className="ri-hand-drag-line text-base" />
          <span>按住空白拖动 · 滚轮缩放</span>
        </div>
      ) : null}
    </div>
  );
}
