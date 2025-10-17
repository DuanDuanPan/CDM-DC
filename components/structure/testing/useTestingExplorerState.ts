import { useCallback, useMemo, useState } from 'react';
import type { TestItem, TestProject, TestingNodeReference, TestingStats } from './types';

const buildInitialNode = (projects: TestProject[]): TestingNodeReference | null => {
  const firstProject = projects[0];
  if (!firstProject) return null;
  return {
    type: 'project',
    id: firstProject.id,
    projectId: firstProject.id,
    structurePath: [...firstProject.structurePath],
    typeId: firstProject.typeId
  };
};

const buildInitialExpanded = (projects: TestProject[]): string[] => {
  if (!projects.length) return [];
  const expanded = new Set<string>();
  projects.forEach(project => {
    project.structurePath.slice(0, 2).forEach(id => {
      expanded.add(`structure:${id}`);
    });
  });
  const firstProject = projects[0];
  if (firstProject) {
    firstProject.structurePath.forEach(id => expanded.add(`structure:${id}`));
    expanded.add(`type:${firstProject.structurePath.join('/')}:${firstProject.typeId}`);
  }
  return Array.from(expanded);
};

const defaultStats = (): TestingStats => ({
  totalProjects: 0,
  statusCounts: {
    planned: 0,
    'in-progress': 0,
    completed: 0,
    blocked: 0
  },
  highRiskProjects: 0,
  averageCoverage: 0,
  averageReadiness: 0
});

const clampPercent = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number.parseFloat(value.toFixed(1))));
};

export interface TestingExplorerState {
  projects: TestProject[];
  selectedNode: TestingNodeReference | null;
  expandedNodeIds: string[];
  stats: TestingStats;
  selectedProject: TestProject | null;
  selectedItem: TestItem | null;
}

export interface TestingExplorerActions {
  selectNode: (node: TestingNodeReference) => void;
  toggleExpand: (nodeId: string) => void;
  selectProjectById: (projectId: string) => void;
  selectItemById: (projectId: string, itemId: string) => void;
  reset: () => void;
}

export const useTestingExplorerState = (projects: TestProject[]): [TestingExplorerState, TestingExplorerActions] => {
  const [selectedNode, setSelectedNode] = useState<TestingNodeReference | null>(() => buildInitialNode(projects));
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>(() => buildInitialExpanded(projects));

  const stats = useMemo<TestingStats>(() => {
    if (!projects.length) return defaultStats();
    const statusCounts: TestingStats['statusCounts'] = {
      planned: 0,
      'in-progress': 0,
      completed: 0,
      blocked: 0
    };
    let highRisk = 0;
    let coverageSum = 0;
    let readinessSum = 0;
    projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] ?? 0) + 1;
      if (project.riskLevel === 'high') highRisk += 1;
      coverageSum += project.coverage;
      readinessSum += project.readiness;
    });
    return {
      totalProjects: projects.length,
      statusCounts,
      highRiskProjects: highRisk,
      averageCoverage: clampPercent(coverageSum / projects.length),
      averageReadiness: clampPercent(readinessSum / projects.length)
    };
  }, [projects]);

  const selectedProject = useMemo(() => {
    if (!selectedNode) return null;
    const projectId = selectedNode.projectId ?? (selectedNode.type === 'project' ? selectedNode.id : undefined);
    if (!projectId) return null;
    return projects.find(project => project.id === projectId) ?? null;
  }, [projects, selectedNode]);

  const selectedItem = useMemo(() => {
    if (!selectedProject || !selectedNode?.itemId) return null;
    return selectedProject.items.find(item => item.id === selectedNode.itemId) ?? null;
  }, [selectedNode, selectedProject]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds(prev => (prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]));
  }, []);

  const selectNode = useCallback((next: TestingNodeReference) => {
    setSelectedNode(next);
    if (next.type === 'project' || next.type === 'item') {
      const typeNodeId = `type:${next.structurePath.join('/')}:${next.typeId ?? ''}`;
      if (next.typeId) {
        setExpandedNodeIds(prev => (prev.includes(typeNodeId) ? prev : [...prev, typeNodeId]));
      }
    }
  }, []);

  const selectProjectById = useCallback(
    (projectId: string) => {
      const project = projects.find(candidate => candidate.id === projectId);
      if (!project) return;
      selectNode({
        type: 'project',
        id: project.id,
        projectId: project.id,
        structurePath: [...project.structurePath],
        typeId: project.typeId
      });
    },
    [projects, selectNode]
  );

  const selectItemById = useCallback(
    (projectId: string, itemId: string) => {
      const project = projects.find(candidate => candidate.id === projectId);
      if (!project) return;
      const exists = project.items.some(item => item.id === itemId);
      if (!exists) return;
      selectNode({
        type: 'item',
        id: itemId,
        projectId: project.id,
        itemId,
        structurePath: [...project.structurePath],
        typeId: project.typeId
      });
    },
    [projects, selectNode]
  );

  const reset = useCallback(() => {
    setSelectedNode(buildInitialNode(projects));
    setExpandedNodeIds(buildInitialExpanded(projects));
  }, [projects]);

  return [
    {
      projects,
      selectedNode,
      expandedNodeIds,
      stats,
      selectedProject,
      selectedItem
    },
    {
      selectNode,
      toggleExpand,
      selectProjectById,
      selectItemById,
      reset
    }
  ];
};
