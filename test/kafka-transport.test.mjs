import assert from "node:assert/strict";
import test from "node:test";
import { KafkaLogTransport } from "../dist/transport/kafka-log.transport.js";

test("Kafka transport forwards canonical actor and tenant metadata", async () => {
  let event;
  const transport = new KafkaLogTransport(
    { send: async (value) => (event = value) },
    { serviceName: "orders", kafka: { enabled: true } },
  );

  await transport.send(
    logRecord({
      clazz: "OrdersService",
      actorId: "actor-1",
      tenantId: "tenant-1",
    }),
  );

  assert.equal(event.meta.actorId, "actor-1");
  assert.equal(event.meta.tenantId, "tenant-1");
  assert.equal(event.meta.clazz, "OrdersService");
});

test("Kafka transport does not fabricate missing actor or tenant values", async () => {
  let event;
  const transport = new KafkaLogTransport(
    { send: async (value) => (event = value) },
    { serviceName: "orders", kafka: { enabled: true } },
  );

  await transport.send(logRecord({}));

  assert.equal(event.meta.actorId, "");
  assert.equal(event.meta.tenantId, "");
});

function logRecord(metadata) {
  return {
    level: "info",
    message: "created order",
    service: "orders",
    timestamp: new Date().toISOString(),
    metadata,
  };
}
