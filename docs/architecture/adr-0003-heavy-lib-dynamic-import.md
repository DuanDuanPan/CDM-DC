# ADR-0003 重库（3D/查看器）动态引入与拆分边界

- Status: Accepted (2025-10-15)

## Context
项目已引入 `pdfjs-dist`、`online-3d-viewer`、`vtk.js`、`rhino3dm`、`occt-import-js`、`web-ifc` 等重型依赖，若进入公共包体会显著拉高 TTI/INP。

## Decision
- 所有重库仅可在叶子组件内通过 `dynamic(() => import(...), { ssr: false })` 或 `import()` 懒加载。
- 严禁顶层静态 `import` 重库；Compare 的重图表/导出子模块也需动态引入。

## Consequences
- 保障首屏包体与交互 P95 指标；代价是首开时的加载占位与骨架处理需完善。
