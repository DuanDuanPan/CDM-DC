import type { SimulationDimension } from './types';

export interface SimulationTypeDictionaryItem {
  code: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface SimulationDimensionDescriptor {
  id: SimulationDimension;
  label: string;
  description: string;
  icon?: string;
}

export const SIMULATION_DIMENSION_LIMIT = 3;

export const SIMULATION_DIMENSION_DESCRIPTORS: SimulationDimensionDescriptor[] = [
  {
    id: 'structure',
    label: '结构视角',
    description: '沿用方案BOM产品结构，定位仿真实例归属。',
    icon: 'ri-mind-map'
  },
  {
    id: 'time',
    label: '时间视角',
    description: '按月份梳理仿真执行节奏。',
    icon: 'ri-calendar-2-line'
  },
  {
    id: 'type',
    label: '类型视角',
    description: '按仿真专业分类查看工作量与缺口。',
    icon: 'ri-apps-line'
  }
];

export const SIMULATION_TYPE_DICTIONARY: SimulationTypeDictionaryItem[] = [
  {
    code: 'structural',
    name: '结构仿真',
    description: '关注力学、疲劳、振动等结构领域仿真任务。',
    icon: 'ri-building-3-line',
    color: '#1d4ed8'
  },
  {
    code: 'fluid',
    name: '流体仿真',
    description: '燃烧、流场、热力学等流体专业仿真任务。',
    icon: 'ri-water-flash-line',
    color: '#0ea5e9'
  },
  {
    code: 'thermal',
    name: '热仿真',
    description: '传热、散热、热应力分析等仿真任务。',
    icon: 'ri-fire-line',
    color: '#ea580c'
  },
  {
    code: 'system',
    name: '系统仿真',
    description: '系统级动态仿真与控制策略验证任务。',
    icon: 'ri-slideshow-3-line',
    color: '#16a34a'
  }
];

export const getSimulationTypeInfo = (code?: string) =>
  SIMULATION_TYPE_DICTIONARY.find(item => item.code === code);
