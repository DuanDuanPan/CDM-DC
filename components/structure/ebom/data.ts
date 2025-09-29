import type { EbomBaseline, EbomTreeNode } from './types';

// Helper to build nodes quickly
const node = (p: Partial<EbomTreeNode> & Pick<EbomTreeNode, 'id' | 'partNumber' | 'name'>): EbomTreeNode => ({
  revision: 'A',
  lifecycle: 'Released',
  confidentiality: '秘密',
  qty: 1,
  uom: 'EA',
  phantom: false,
  safetyCritical: false,
  llp: false,
  ...p,
});

// Baseline A (earlier)
const BL_A_ROOT: EbomTreeNode = node({
  id: 'EBOM-ROOT', partNumber: 'ENG-1000', name: '涡扇发动机总成', revision: 'A',
  children: [
    node({ id: 'EBOM-ROOT/FAN', partNumber: 'MOD-1100', name: '风扇模块', children: [
      node({ id: 'EBOM-ROOT/FAN/BLD-GRP', partNumber: 'ASM-1110', name: '风扇叶片成组', phantom: true, children: [
        node({
          id: 'EBOM-ROOT/FAN/BLD-GRP/BLD-01',
          partNumber: 'BLD-001',
          name: '风扇叶片',
          class: 'fan-blade',
          qty: 18,
          uom: 'EA',
          findNo: '11A',
          safetyCritical: true,
          effectivity: { serialRange: ['0001', '0400'], dateRange: ['2024-01-01', '2025-03-31'] },
          substitutes: [ { partNumber: 'BLD-001A', reason: '维修替换', priority: 2 } ],
          links: {
            gltfUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
            posterUrl: 'https://modelviewer.dev/assets/poster-astronaut.png',
            docs: [ { id: 'DOC-BLD-SPEC', name: '风扇叶片规格书', type: 'spec', version: 'A', updatedAt: '2025-06-20', owner: '结构组' } ]
          },
          designParams: [
            { name: '弦长', value: '350', unit: 'mm' },
            { name: '厚度比', value: '18', unit: '%' },
            { name: '前缘半径', value: '3.2', unit: 'mm' },
            { name: '材料', value: 'Ti-6Al-4V' }
          ]
        }),
      ]}),
      node({ id: 'EBOM-ROOT/FAN/DISC', partNumber: 'DSC-110', name: '风扇盘', class: 'fan-disk', safetyCritical: true, llp: true, designParams: [ { name: '盘径', value: '960', unit: 'mm' }, { name: '材料', value: 'Inconel 718' }, { name: '转速上限', value: '3500', unit: 'rpm' } ], links: { docs: [ { id: 'DOC-DISK-DRW', name: '风扇盘图纸', type: 'drawing', version: 'A' } ] } }),
    ]}),
    node({ id: 'EBOM-ROOT/LPC', partNumber: 'MOD-1200', name: '低压压气机模块', children: [
      node({ id: 'EBOM-ROOT/LPC/STG1', partNumber: 'STG-121', name: '一级叶栅', qty: 1 }),
      node({ id: 'EBOM-ROOT/LPC/STG2', partNumber: 'STG-122', name: '二级叶栅', qty: 1 }),
    ]}),
    node({ id: 'EBOM-ROOT/COMB', partNumber: 'MOD-1300', name: '燃烧室模块', children: [
      node({ id: 'EBOM-ROOT/COMB/LINER', partNumber: 'CBL-130', name: '燃烧室内胆', class: 'combustor-liner', safetyCritical: true, designParams: [ { name: '冷却孔数量', value: '120' }, { name: '壁厚', value: '2.2', unit: 'mm' }, { name: '涂层', value: 'TBC' } ], links: { docs: [ { id: 'DOC-LINER-SPEC', name: '燃烧室内胆规范', type: 'spec', version: 'A' } ] } }),
      node({ id: 'EBOM-ROOT/COMB/NOZ', partNumber: 'NOZ-131', name: '喷嘴组件', qty: 20 }),
    ]}),
    node({ id: 'EBOM-ROOT/HPT', partNumber: 'MOD-1400', name: '高压涡轮模块', children: [
      node({ id: 'EBOM-ROOT/HPT/DISK', partNumber: 'DSK-141', name: '高压涡轮盘', class: 'turbine-disk', safetyCritical: true, llp: true, designParams: [ { name: '盘腹厚度', value: '22', unit: 'mm' }, { name: '材料', value: 'DS Rene 104' } ] }),
      node({ id: 'EBOM-ROOT/HPT/BLADE', partNumber: 'HTB-142', name: '高压涡轮叶片', class: 'turbine-blade', qty: 72, safetyCritical: true, links: { gltfUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' } }),
      node({ id: 'EBOM-ROOT/HPT/VANE', partNumber: 'HTV-143', name: '导向叶片', qty: 36 }),
    ]}),
    node({ id: 'EBOM-ROOT/ACC', partNumber: 'MOD-1500', name: '附件机匣及附件', children: [
      node({ id: 'EBOM-ROOT/ACC/GBX', partNumber: 'GBX-151', name: '附件齿箱' }),
      node({
        id: 'EBOM-ROOT/ACC/PUMP',
        partNumber: 'FPP-152',
        name: '燃油泵',
        findNo: '52',
        effectivity: { serialRange: ['0001', '0800'] },
        substitutes: [ { partNumber: 'FPP-152-R', reason: '翻修件', priority: 3 } ]
      }),
      node({ id: 'EBOM-ROOT/ACC/FADEC', partNumber: 'ECE-153', name: 'FADEC 控制器' }),
    ]}),
  ],
});

// Baseline B (later) — differences:
// - Fan blade quantity from 18 -> 20
// - Add LPC stage 3
// - Replace fuel pump with new P/N
// - Change HPT vane qty 36 -> 40
// - Add lubrication unit
const BL_B_ROOT: EbomTreeNode = node({
  id: 'EBOM-ROOT', partNumber: 'ENG-1000', name: '涡扇发动机总成', revision: 'B',
  children: [
    node({ id: 'EBOM-ROOT/FAN', partNumber: 'MOD-1100', name: '风扇模块', children: [
      node({ id: 'EBOM-ROOT/FAN/BLD-GRP', partNumber: 'ASM-1110', name: '风扇叶片成组', phantom: true, children: [
        node({
          id: 'EBOM-ROOT/FAN/BLD-GRP/BLD-01',
          partNumber: 'BLD-001',
          name: '风扇叶片',
          class: 'fan-blade',
          qty: 20,
          uom: 'PCS',
          findNo: '11B',
          safetyCritical: true,
          effectivity: { serialRange: ['0401', '9999'], dateRange: ['2025-04-01', '2025-12-31'], blockPoint: 'BP-25' },
          substitutes: [ { partNumber: 'BLD-002', reason: '升级方案', priority: 1 } ],
          links: { gltfUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' },
          designParams: [
            { name: '弦长', value: '352', unit: 'mm' },
            { name: '厚度比', value: '18.2', unit: '%' }
          ]
        }),
      ]}),
      node({ id: 'EBOM-ROOT/FAN/DISC', partNumber: 'DSC-110', name: '风扇盘', class: 'fan-disk', safetyCritical: true, llp: true }),
    ]}),
    node({ id: 'EBOM-ROOT/LPC', partNumber: 'MOD-1200', name: '低压压气机模块', children: [
      node({ id: 'EBOM-ROOT/LPC/STG1', partNumber: 'STG-121', name: '一级叶栅', qty: 1 }),
      node({ id: 'EBOM-ROOT/LPC/STG2', partNumber: 'STG-122', name: '二级叶栅', qty: 1 }),
      node({ id: 'EBOM-ROOT/LPC/STG3', partNumber: 'STG-123', name: '三级叶栅', qty: 1 }),
    ]}),
    node({ id: 'EBOM-ROOT/COMB', partNumber: 'MOD-1300', name: '燃烧室模块', children: [
      node({ id: 'EBOM-ROOT/COMB/LINER', partNumber: 'CBL-130', name: '燃烧室内胆', safetyCritical: true }),
      node({ id: 'EBOM-ROOT/COMB/NOZ', partNumber: 'NOZ-131', name: '喷嘴组件', qty: 20 }),
    ]}),
    node({ id: 'EBOM-ROOT/HPT', partNumber: 'MOD-1400', name: '高压涡轮模块', children: [
      node({ id: 'EBOM-ROOT/HPT/DISK', partNumber: 'DSK-141', name: '高压涡轮盘', class: 'turbine-disk', safetyCritical: true, llp: true }),
      node({ id: 'EBOM-ROOT/HPT/BLADE', partNumber: 'HTB-142', name: '高压涡轮叶片', class: 'turbine-blade', qty: 72, safetyCritical: true }),
      node({ id: 'EBOM-ROOT/HPT/VANE', partNumber: 'HTV-143', name: '导向叶片', qty: 40 }),
    ]}),
    node({ id: 'EBOM-ROOT/ACC', partNumber: 'MOD-1500', name: '附件机匣及附件', children: [
      node({ id: 'EBOM-ROOT/ACC/GBX', partNumber: 'GBX-151', name: '附件齿箱', class: 'gearbox' }),
      node({
        id: 'EBOM-ROOT/ACC/PUMP',
        partNumber: 'FPP-160',
        name: '燃油泵（新）',
        class: 'fuel-pump',
        findNo: '52B',
        uom: 'ASSY',
        lifecycle: 'Draft',
        effectivity: { dateRange: ['2025-07-01', '2026-12-31'] },
        substitutes: [ { partNumber: 'FPP-160R', reason: '试制备件', priority: 2 } ],
        links: { docs: [ { id: 'DOC-PUMP-CALC', name: '泵选型计算', type: 'calc', version: 'B' } ] }
      }),
      node({ id: 'EBOM-ROOT/ACC/FADEC', partNumber: 'ECE-153', name: 'FADEC 控制器', class: 'controller', links: { docs: [ { id: 'DOC-FADEC-IF', name: 'FADEC 接口定义', type: 'spec', version: 'B' } ] } }),
      node({ id: 'EBOM-ROOT/ACC/LUBE', partNumber: 'LUB-154', name: '润滑单元' }),
    ]}),
  ],
});

export const EBOM_BASELINES: EbomBaseline[] = [
  { id: 'EBOM-BL-A', label: 'EBOM_A (2025-07-01)', date: '2025-07-01', description: '初版基线', root: BL_A_ROOT },
  { id: 'EBOM-BL-B', label: 'EBOM_B (2025-09-01)', date: '2025-09-01', description: '设计更新：风扇叶片数量、附件调整', root: BL_B_ROOT },
];
