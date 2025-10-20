# Task Completion Checklist
- Run `npm run lint` and resolve issues; do not suppress rules.
- Execute relevant tests: `npm run test` for unit coverage, `npm run test:e2e` when changes affect flows; run `npm run verify:tbom` if touching TBOM contracts.
- Update docs in `docs/` (PRD, UX spec, architecture) to reflect new flows or contracts.
- Capture release notes/impacts and coordinate with QA/ops before deploy; ensure smoke test plan and rollback strategy are defined.
- Ensure environment variables (`.env.local`) updated/documented when introducing new configs.
- Follow Conventional Commits for PRs and include references/screenshots when UI changes occur.