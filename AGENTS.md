# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, with `layout.tsx` defining shared chrome and `page.tsx` orchestrating module selection. Feature-focused React components sit in `components/`, grouped by domain (`dashboard/`, `explorer/`, `graph/`, etc.) so new UI belongs alongside its peers. Shared navigation and chrome reside in `components/Header.tsx` and `components/Sidebar.tsx`. Reference materials, product briefs, and UX specs are kept in `docs/`; update them whenever a module gains new flows. Build tooling and lint rules live at the project root (`next.config.ts`, `tailwind.config.js`, `eslint.config.mjs`).

## Build, Test, and Development Commands
- `npm install` installs dependencies; prefer `npm ci` in CI for reproducible builds.
- `npm run dev` starts the dev server on http://localhost:3000 with hot reloading.
- `npm run build` performs a production build and validates routes.
- `npm run lint` runs the ESLint suite configured for Next.js and Tailwind class ordering.

## Coding Style & Naming Conventions
Use TypeScript for all modules and export React components as `PascalCase` functions. Follow the existing 2-space indentation, include trailing semicolons, and keep JSX props on separate lines when they improve clarity. Tailwind utility classes should be grouped from layout → spacing → color to mirror existing files. Run `npm run lint` before submitting and fix issues rather than suppressing rules.

## Front-End Development Standards
- **Component scope**: Keep UI blocks small and domain-focused. Shared primitives belong in `components/common/` (introduce the folder if needed) before cloning similar JSX across features.
- **Server vs. client**: Default to server components in the App Router. Only add `"use client"` when browser APIs, local state, or event listeners are necessary—split client-only logic into leaf components to limit hydration cost.
- **State management**: Prefer React hooks for local and derived state (`useState`, `useReducer`, `useMemo`, `useCallback`). Lift shared state to the nearest common parent; introduce external stores only if cross-route coordination is required.
- **Styling**: Use Tailwind utilities and follow the layout → spacing → typography → color ordering already established. For complex class composition, leverage `clsx`/`classnames` instead of template-string concatenation. Avoid inline styles except for dynamic values that Tailwind cannot express.
- **Accessibility**: Favor semantic HTML tags and ensure interactive controls have keyboard bindings, focus rings, and descriptive ARIA attributes. Reuse the design system’s accessible button/link patterns when wiring new flows.
- **Responsiveness**: Validate layouts on `sm`, `md`, and `lg` breakpoints (down to 1280px width). Use flex/grid rather than fixed widths; add responsive Tailwind prefixes for spacing tweaks instead of device-specific CSS.
- **Performance**: Memoize expensive calculations, virtualize long lists, and lazy-load heavy modules via dynamic imports when appropriate. Monitor bundle changes with `next build` if adding third-party libraries.
- **Data contracts**: Type incoming data with explicit interfaces in module-level `types.ts`. Keep mock data in `docs/` synchronized; update both the contract and documentation when fields change.
- **Linting**: After every code change, run `npm run lint` (or the relevant lint task) and address all issues immediately—do not suppress or ignore rules unless the team agrees to adjust the configuration.
- **Design traceability**: When implementing or altering UI, capture the intent and key decisions in the relevant doc under `docs/` (e.g., product briefs、UX 规格). A PR should link to the updated document so reviewers understand context.

## Testing Guidelines
No automated test harness ships with the repository yet; add coverage alongside features using React Testing Library or Playwright as appropriate. Place component tests in a co-located `__tests__/ComponentName.test.tsx` folder and favor descriptive test names such as `renders dashboard KPIs`. When adding integration tests, ensure they run headless so they can be wired into CI later.

## Commit & Pull Request Guidelines
Stick to Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in recent history (`feat: Implement Verification Overview component...`). Each PR should reference the relevant issue, summarize functional changes, call out UI screenshots when the user-facing surface shifts, and list any configuration updates. Request review only after linting passes and local smoke testing is complete.

## Environment & Configuration Tips
Store secrets in `.env.local` (ignored by git) and document required keys in `docs/`. When adding new services, update `next.config.ts` and Tailwind config in lockstep so class generation stays deterministic.
