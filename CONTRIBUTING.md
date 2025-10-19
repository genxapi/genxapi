# Contributing & Usage Guide

## Quick Usage

```bash
npm install
npm run build
npm run test
npm run typecheck
```

1. Configure `.npmrc` with your `NPM_TOKEN` (point the registry lines at your internal registry if publishing privately).
2. When generating clients, provide `GITHUB_TOKEN` / `NPM_TOKEN` so the CLI can sync repositories and publish packages.
3. Use the diff analyzer to classify swagger changes before committing:
   ```bash
   node --input-type=module -e "import base from './packages/cli/src/utils/swaggerDiff/fixtures/base.json' assert { type: 'json' };
   import { analyzeSwaggerDiff } from './packages/cli/src/utils/swaggerDiff/index.js';
   const next = structuredClone(base);
   next.paths['/pets/{id}'] = { get: { operationId: 'getPet', responses: { '200': { description: 'single pet' } } } };
   console.log(analyzeSwaggerDiff(base, next));"
   ```

## Contribution Workflow

1. Create a feature branch, keeping modules focused (~100 lines) and logic reusable.
2. Write or update unit/integration tests (Vitest + MSW when mocking HTTP).
3. Run `npm run lint`, `npm run test`, and `npm run typecheck`.
4. Update documentation (README, context files) when behaviour changes.
5. Use semantic-release commit conventions (`feat`, `fix`, `chore`) guided by the swagger diff analyzer.
6. Publish internal packages with `npm run npm-publish --workspace <package>` when ready; packages publish publicly by default — adjust scripts if you need private registries.

Thank you for helping improve GenxAPI!
