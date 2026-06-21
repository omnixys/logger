import { getCanonicalLogMetadata } from '../dist/logger/context-log-metadata.js';
import assert from 'node:assert/strict';
import test from 'node:test';

test('logger emits request and correlation fields outside transport scopes', () => {
  assert.deepEqual(getCanonicalLogMetadata(), {
    requestId: 'unscoped',
    correlationId: 'unscoped',
    tenantId: undefined,
    actorId: undefined,
    userId: undefined,
    traceId: undefined,
    spanId: undefined,
  });
});
