# Project Overview
- Purpose: CDM Digital Continuity frontend prototype extending XBOM with Trial BOM (TBOM) flows; delivers product process data center UX using Next.js App Router.
- Tech Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3.4, Zod for contracts, lightweight fetch wrappers, domain-specific viz libs (recharts, pdfjs-dist, online-3d-viewer, vtk.js, rhino3dm, web-ifc, occt-import-js).
- Structure: `app/` defines routes/layout; domain components under `components/` (dashboard, explorer, structure, tbom, compare, etc.); shared docs/specs in `docs/`; tests in `e2e/` and co-located `__tests__`; services/helpers in `services/` and `utils/`.
- Key References: `docs/prd/` for sharded PRD, `docs/ui-architecture.md`, `docs/front-end-spec.md`, TBOM contract in `docs/tbom-contract.md`.
- Notable tooling: sync 3D assets script (`scripts/sync-online3dviewer-assets.js`), verify TBOM data script (`scripts/verify-tbom-data.ts`).