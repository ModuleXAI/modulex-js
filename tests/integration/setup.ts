/**
 * Integration test setup — shared client, env config, tracker, and helpers.
 *
 * Requires:
 *   MODULEX_API_KEY   — API key (mx_live_... format)
 *   MODULEX_ORG_ID    — Organization UUID
 *
 * Optional:
 *   MODULEX_BASE_URL          — defaults to https://api.staging.modulex.dev
 *   MODULEX_TEST_WORKFLOW_ID  — pre-existing workflow for execution tests
 */

import { Modulex } from '../../src/client';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const ENV = {
  apiKey: process.env.MODULEX_API_KEY ?? '',
  orgId: process.env.MODULEX_ORG_ID ?? '',
  baseUrl: process.env.MODULEX_BASE_URL || 'https://api.staging.modulex.dev',
  testWorkflowId: process.env.MODULEX_TEST_WORKFLOW_ID || '',
};

export const MISSING_ENV = !ENV.apiKey || !ENV.orgId;

// ---------------------------------------------------------------------------
// Shared client
// ---------------------------------------------------------------------------

let _client: Modulex | undefined;

export function getClient(): Modulex {
  if (!_client) {
    if (MISSING_ENV) {
      // Return a dummy proxy so describe-level `const client = getClient()`
      // doesn't throw when env vars are missing (tests are skipped anyway).
      return new Proxy({} as Modulex, {
        get: () => { throw new Error('MODULEX_API_KEY / MODULEX_ORG_ID not set'); },
      });
    }
    _client = new Modulex({
      apiKey: ENV.apiKey,
      organizationId: ENV.orgId,
      baseUrl: ENV.baseUrl,
      timeout: 15_000,
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Result tracker
// ---------------------------------------------------------------------------

export type TestStatus = 'pass' | 'fail' | 'skip';

export interface TestResult {
  status: TestStatus;
  method: string;
  path: string;
  httpStatus?: number;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

export function record(result: TestResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '\x1b[32m✅ PASS\x1b[0m'
    : result.status === 'fail' ? '\x1b[31m❌ FAIL\x1b[0m'
    : '\x1b[33m⏭️  SKIP\x1b[0m';
  const status = result.httpStatus ? ` — ${result.httpStatus}` : '';
  const err = result.error ? `: ${result.error}` : '';
  const dur = `(${result.durationMs}ms)`;
  console.log(`  ${icon}  ${result.method} ${result.path}${status} ${dur}${err}`);
}

export function getResults(): TestResult[] {
  return results;
}

// ---------------------------------------------------------------------------
// Timed API call wrapper
// ---------------------------------------------------------------------------

export async function tracked<T>(
  method: string,
  path: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    record({ status: 'pass', method, path, httpStatus: 200, durationMs: ms });
    return result;
  } catch (err: any) {
    const ms = Math.round(performance.now() - start);
    const httpStatus = err?.status ?? err?.statusCode;
    const message = err?.message ?? String(err);
    record({ status: 'fail', method, path, httpStatus, durationMs: ms, error: message });
    throw err;
  }
}

export function skip(method: string, path: string, reason: string) {
  record({ status: 'skip', method, path, durationMs: 0, error: reason });
}

// ---------------------------------------------------------------------------
// SSE helper — reads events with a timeout
// ---------------------------------------------------------------------------

export async function readSSE(
  stream: AsyncGenerator<any>,
  timeoutMs = 10_000,
): Promise<any[]> {
  const events: any[] = [];
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    for await (const event of stream) {
      events.push(event);
      if (ac.signal.aborted) break;
      // Collect up to 5 events or until done/error
      if (event.event === 'done' || event.event === 'error' || events.length >= 5) break;
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') throw err;
  } finally {
    clearTimeout(timer);
  }
  return events;
}

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

export function printSummary() {
  const all = getResults();
  const passed = all.filter(r => r.status === 'pass');
  const failed = all.filter(r => r.status === 'fail');
  const skipped = all.filter(r => r.status === 'skip');

  console.log('\n');
  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m  INTEGRATION TEST RESULTS\x1b[0m');
  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log(`  Total:    ${all.length}`);
  console.log(`  \x1b[32mPassed:   ${passed.length}\x1b[0m`);
  console.log(`  \x1b[31mFailed:   ${failed.length}\x1b[0m`);
  console.log(`  \x1b[33mSkipped:  ${skipped.length}\x1b[0m`);
  console.log('\x1b[1m──────────────────────────────────────────\x1b[0m');

  if (failed.length > 0) {
    console.log('  \x1b[31mFAILURES:\x1b[0m');
    for (const r of failed) {
      const status = r.httpStatus ? ` ${r.httpStatus}` : '';
      console.log(`  ❌ ${r.method} ${r.path} —${status} ${r.error ?? 'unknown'}`);
    }
  }

  if (skipped.length > 0) {
    console.log('  \x1b[33mSKIPPED:\x1b[0m');
    for (const r of skipped) {
      console.log(`  ⏭️  ${r.method} ${r.path} — ${r.error ?? 'unknown'}`);
    }
  }

  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log('');
}
