export interface SimulationJumpTarget {
  simBomRefId: string;
  nodeIds?: string[];
  categoryId: string;
  instanceId: string;
  defaultVersion?: string;
}

export const simulationJumpTargets: SimulationJumpTarget[] = [
  {
    simBomRefId: 'SIM-BLD-001',
    nodeIds: ['EBOM-ROOT/FAN/BLD-GRP/BLD-01'],
    categoryId: 'sim-structure',
    instanceId: 'inst-struct-001',
    defaultVersion: 'v3.2',
  },
  {
    simBomRefId: 'SIM-BLD-002',
    categoryId: 'sim-structure',
    instanceId: 'inst-struct-002',
  },
];

export const SIMULATION_JUMP_UNMAPPED = new Set<string>(['SIM-HPT-001']);
