import assert from "node:assert/strict";
import test from "node:test";
import { AsyncBatchLogger } from "../dist/batch/async-batch-logger.js";
import { ScopedLogger } from "../dist/logger/scoped-logger.js";

test("transport failures are contained and observable", async () => {
  const batch = new AsyncBatchLogger(
    {
      serviceName: "test",
      batch: { enabled: true, maxRetries: 1 },
    },
    {
      async send() {
        throw new Error("transport unavailable");
      },
      async flush() {
        throw new Error("flush unavailable");
      },
    },
  );

  batch.enqueue(logRecord("failure"));
  await batch.flush();

  assert.deepEqual(batch.diagnostics(), {
    initialized: false,
    closing: false,
    closed: false,
    flushing: false,
    buffered: 0,
    pending: 0,
    sent: 0,
    dropped: 1,
    transportFailures: 3,
  });
});

test("buffer remains bounded while a transport is stalled", async () => {
  let releaseFirst;
  const firstSend = new Promise((resolve) => (releaseFirst = resolve));
  let sends = 0;
  const batch = new AsyncBatchLogger(
    {
      serviceName: "test",
      batch: {
        enabled: true,
        maxSize: 1,
        maxBufferSize: 5,
        overflowStrategy: "drop-oldest",
      },
    },
    {
      async send() {
        sends += 1;
        if (sends === 1) await firstSend;
      },
    },
  );

  for (let index = 0; index < 100; index += 1) {
    batch.enqueue(logRecord(`log-${index}`));
  }

  assert.equal(batch.diagnostics().buffered, 5);
  assert.equal(batch.diagnostics().dropped, 94);
  releaseFirst();
  await batch.flush();

  assert.equal(batch.diagnostics().buffered, 0);
  assert.equal(batch.diagnostics().sent, 6);
});

test("close waits for non-batched pending writes", async () => {
  let release;
  const blocked = new Promise((resolve) => (release = resolve));
  let completed = false;
  const batch = new AsyncBatchLogger(
    { serviceName: "test", batch: { enabled: false } },
    {
      async send() {
        await blocked;
        completed = true;
      },
    },
  );

  batch.enqueue(logRecord("pending"));
  const closing = batch.close();
  assert.equal(completed, false);
  release();
  await closing;
  assert.equal(completed, true);
});

test("recursive transport logging is suppressed", async () => {
  let sends = 0;
  let logger;
  const batch = new AsyncBatchLogger(
    { serviceName: "test", batch: { enabled: true } },
    {
      async send() {
        sends += 1;
        logger.info("recursive transport log");
      },
    },
  );
  logger = new ScopedLogger("Recursive", { serviceName: "test" }, batch);

  logger.info("outer log");
  await batch.flush();

  assert.equal(sends, 1);
  assert.equal(batch.diagnostics().sent, 1);
});

test("parallel writes are all drained", async () => {
  const sent = new Set();
  const batch = new AsyncBatchLogger(
    {
      serviceName: "test",
      batch: { enabled: true, maxSize: 1_000, maxBufferSize: 2_000 },
    },
    {
      async send(log) {
        await Promise.resolve();
        sent.add(log.message);
      },
    },
  );

  await Promise.all(
    Array.from({ length: 250 }, async (_value, index) => {
      await Promise.resolve();
      batch.enqueue(logRecord(`parallel-${index}`));
    }),
  );
  await batch.flush();

  assert.equal(sent.size, 250);
  assert.equal(batch.diagnostics().dropped, 0);
});

function logRecord(message) {
  return {
    level: "info",
    message,
    service: "test",
    timestamp: new Date().toISOString(),
    metadata: {},
  };
}
