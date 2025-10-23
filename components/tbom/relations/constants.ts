export type TbomDomainKey = 'requirement' | 'ebom' | 'simulation' | 'physical';

export type TbomDomainDefinition = {
  key: TbomDomainKey;
  label: string;
  icon: string;
  module: string;
  description: string;
  ariaPrefix: string;
};

export const TBOM_DOMAIN_DEFINITIONS: Record<TbomDomainKey, TbomDomainDefinition> = {
  requirement: {
    key: 'requirement',
    label: '需求关联',
    icon: 'ri-list-check-2',
    module: 'structure',
    description: '跳转到需求视图并聚焦关联条目',
    ariaPrefix: '需求关联',
  },
  ebom: {
    key: 'ebom',
    label: '设计/EBOM',
    icon: 'ri-node-tree',
    module: 'structure',
    description: '跳转到产品结构视图，保持节点筛选',
    ariaPrefix: '设计关联',
  },
  simulation: {
    key: 'simulation',
    label: '仿真视图',
    icon: 'ri-cpu-line',
    module: 'structure',
    description: '跳转到仿真面板并加载对应维度',
    ariaPrefix: '仿真关联',
  },
  physical: {
    key: 'physical',
    label: '实物追溯',
    icon: 'ri-cube-line',
    module: 'dashboard',
    description: '跳转到实物/试验看板并带入序列号',
    ariaPrefix: '实物追溯',
  },
};
