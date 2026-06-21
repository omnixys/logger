import assert from "node:assert/strict";
import test from "node:test";
import { AsyncBatchLogger } from "../dist/batch/async-batch-logger.js";

test("flush is safe with an empty queue", async () => {
  let transportFlushes = 0;
  const batch = new AsyncBatchLogger(batchOptions(), {
    async send() {},
    async flush() {
      transportFlushes += 1;
    },
  });

  await batch.flush();
  assert.equal(transportFlushes, 1);
});

test("concurrent flush calls drain pending logs once", async () => {
  const sent = [];
  const batch = new AsyncBatchLogger(batchOptions(), {
    async send(log) {
      await Promise.resolve();
      sent.push(log.message);
    },
  });

  batch.enqueue(logRecord("first"));
  batch.enqueue(logRecord("second"));
  await Promise.all([batch.flush(), batch.flush(), batch.flush()]);

  assert.deepEqual(sent.sort(), ["first", "second"]);
});

test("close flushes pending logs and is idempotent", async () => {
  const sent = [];
  let closes = 0;
  const batch = new AsyncBatchLogger(batchOptions(), {
    async send(log) {
      sent.push(log.message);
    },
    async close() {
      closes += 1;
    },
  });

  batch.enqueue(logRecord("pending"));
  await Promise.all([batch.close(), batch.close()]);
  await batch.close();

  assert.deepEqual(sent, ["pending"]);
  assert.equal(closes, 1);
});

test("logs after close are ignored without invoking the transport", async () => {
  const sent = [];
  const batch = new AsyncBatchLogger(batchOptions(), {
    async send(log) {
      sent.push(log.message);
    },
  });

  await batch.close();
  batch.enqueue(logRecord("too-late"));
  await batch.flush();

  assert.deepEqual(sent, []);
});

test("close drains logs accepted during an existing flush", async () => {
  const sent = [];
  let releaseTransportFlush;
  let transportFlushStarted;
  const started = new Promise((resolve) => (transportFlushStarted = resolve));
  const blocked = new Promise((resolve) => (releaseTransportFlush = resolve));
  let flushCalls = 0;
  const batch = new AsyncBatchLogger(batchOptions(), {
    async send(log) {
      sent.push(log.message);
    },
    async flush() {
      flushCalls += 1;
      if (flushCalls === 1) {
        transportFlushStarted();
        await blocked;
      }
    },
  });

  batch.enqueue(logRecord("before-flush"));
  const flushing = batch.flush();
  await started;
  batch.enqueue(logRecord("during-flush"));
  const closing = batch.close();
  releaseTransportFlush();

  await Promise.all([flushing, closing]);
  assert.deepEqual(sent, ["before-flush", "during-flush"]);
});

function batchOptions() {
  return {
    serviceName: "test",
    batch: { enabled: true, maxSize: 100, flushInterval: 60_000 },
  };
}

function logRecord(message) {
  return {
    level: "info",
    message,
    service: "test",
    timestamp: new Date().toISOString(),
    metadata: {},
  };
}
