export interface SimulationStructureDefinition {
  id: string;
  name: string;
  level: number;
  children?: SimulationStructureDefinition[];
}

export const SIMULATION_STRUCTURE_TREE: SimulationStructureDefinition[] = [
  {
    id: '001',
    name: '航空发动机总成',
    level: 0,
    children: [
      {
        id: '001-01',
        name: '推进系统',
        level: 1,
        children: [
          {
            id: '001-01-01',
            name: '压气机分系统',
            level: 2,
            children: [
              {
                id: '001-01-01-A',
                name: '方案A-三级高压设计',
                level: 3
              },
              {
                id: '001-01-01-B',
                name: '方案B-二级低压设计',
                level: 3
              }
            ]
          },
          {
            id: '001-01-02',
            name: '燃烧室分系统',
            level: 2,
            children: [
              {
                id: '001-01-02-A',
                name: '方案A-环形燃烧室',
                level: 3
              },
              {
                id: '001-01-02-B',
                name: '方案B-管形燃烧室',
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: '001-02',
        name: '控制系统',
        level: 1,
        children: [
          {
            id: '001-02-01',
            name: '燃油控制分系统',
            level: 2
          }
        ]
      }
    ]
  }
];
