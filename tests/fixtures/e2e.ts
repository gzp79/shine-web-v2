/**
 * Fixtures for true end-to-end tests that run against *real*, running services
 * (identity + builder + web). Unlike `fixtures/mock.ts`, nothing here stubs the
 * backend — tests authenticate for real and talk to live endpoints.
 *
 * Prerequisites: the identity, builder and web dev servers must be up, typically via
 * `pnpm run env:local` plus the services from `shine-services`. These tests are excluded
 * from CI.
 */
export { expect, test } from '@playwright/test';
