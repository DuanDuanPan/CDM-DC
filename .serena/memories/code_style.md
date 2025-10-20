# Code Style & Conventions
- TypeScript throughout; React components exported as PascalCase functions.
- Next.js App Router defaults to server components; only add `"use client"` for browser-only logic and keep client code to leaf nodes.
- 2-space indentation, trailing semicolons, separate JSX props when clarity improves.
- Tailwind utility ordering: layout → spacing → typography → color; rely on Tailwind over inline styles; use `clsx`/`classnames` for composition.
- Group components by domain (`components/<domain>/`); shared primitives live in `components/common/` (introduce if missing rather than duplicating UI).
- Accessibility first: semantic elements, keyboard focus, aria annotations, reuse accessible button/link patterns.
- Performance: memoize expensive logic, lazily load heavy libs (pdfjs, online-3d-viewer, vtk.js, rhino3dm, occt-import-js, web-ifc) via dynamic import at leaf components.
- Data contracts typed via module-level `types.ts` and Zod schemas; keep mock data and docs in sync (`docs/`).
- Documentation updates required when flows change (`docs/front-end-spec.md`, `docs/prd/`, etc.).