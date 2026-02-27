# CI Pipeline Split Design

## Goal

Split the monolithic `ci.yml` into parallel test and build jobs with separate deploy jobs for dev (PR) and prod (master).

## Pipeline Architecture

```
on: push(master) + pull_request(master)

  test ─────────────┐
  (env:mock)        ├──→ deploy-dev  (PR only, wrangler-dev.json → dev.scytta.com)
  build ────────────┤
  (env:prod)        └──→ deploy-prod (master only, wrangler.json → www.scytta.com)
```

- `test` and `build` run in parallel
- Both deploy jobs require `needs: [test, build]`
- Single concurrency group cancels outdated runs

## Job Specifications

### test

- `env:mock` setup
- `pnpm run test:unit --run` (fail fast)
- `pnpm exec playwright install` (only if unit tests pass)
- `pnpm run test:e2e`
- Permissions: `contents: read`

### build

- `env:prod` setup + `mkcert`
- Extract wrangler version for deploy jobs
- `pnpm run lint`
- `pnpm run check`
- `pnpm audit --audit-level=high --prod`
- `pnpm run build`
- `wrangler deploy --dry-run` (fix `_worker.js`)
- Collect artifacts into `./dist`
- Upload artifact (always, not just master)
- Permissions: `contents: read`
- Outputs: `wrangler_version`

### deploy-dev

- `needs: [test, build]`, `if: github.event_name == 'pull_request'`
- Download artifact
- `wrangler deploy -c wrangler-dev.json`
- Echo deployment URL to step summary

### deploy-prod

- `needs: [test, build]`, `if: github.ref == 'refs/heads/master'`
- Download artifact
- `wrangler deploy` (uses `wrangler.json` from artifact)

## Changes from Current CI

1. Tests run with `env:mock` instead of `env:prod`
2. Test and build run in parallel (was sequential)
3. Artifact upload on all triggers (was master-only)
4. Removed e2e test against preview site (tests use mocks now)
5. `mkcert` only in build job (not needed for tests)

## GitHub Branch Protection

Configure on `master` branch:

- "Require status checks to pass before merging" → enabled
- Required checks: `test`, `build`
- "Require branches to be up to date before merging" → recommended
