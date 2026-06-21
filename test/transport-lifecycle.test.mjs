import assert from "node:assert/strict";
import test from "node:test";
import { LOG_TRANSPORT } from "../dist/core/logger.constants.js";
import { LoggerModule } from "../dist/core/logger.module.js";
import {
  closeParentLogger,
  installLoggerShutdownHooks,
  loggerRuntimeDiagnostics,
  removeLoggerShutdownHooks,
} from "../dist/logger/logger.config.js";
import { KafkaLogTransport } from "../dist/transport/kafka-log.transport.js";
import { NoopLogTransport } from "../dist/transport/noop-log.transport.js";

test("module registers exactly one transport for every configuration", () => {
  const localModule = LoggerModule.forRoot({ serviceName: "local" });
  const kafkaModule = LoggerModule.forRoot({
    serviceName: "kafka",
    kafka: { enabled: true },
  });

  const localTransports = localModule.providers.filter(
    (provider) => provider.provide === LOG_TRANSPORT,
  );
  const kafkaTransports = kafkaModule.providers.filter(
    (provider) => provider.provide === LOG_TRANSPORT,
  );

  assert.equal(localTransports.length, 1);
  assert.equal(localTransports[0].useClass, NoopLogTransport);
  assert.equal(kafkaTransports.length, 1);
  assert.equal(kafkaTransports[0].useClass, KafkaLogTransport);
});

test("shutdown hook initialization and cleanup are idempotent", () => {
  removeLoggerShutdownHooks();
  installLoggerShutdownHooks();
  installLoggerShutdownHooks();
  assert.equal(loggerRuntimeDiagnostics().hooksInstalled, true);

  removeLoggerShutdownHooks();
  removeLoggerShutdownHooks();
  assert.equal(loggerRuntimeDiagnostics().hooksInstalled, false);

  installLoggerShutdownHooks();
  assert.equal(loggerRuntimeDiagnostics().hooksInstalled, true);
  removeLoggerShutdownHooks();
});

test("parent transport shutdown is idempotent and removes hooks", async () => {
  installLoggerShutdownHooks();
  await Promise.all([closeParentLogger(), closeParentLogger()]);
  await closeParentLogger();

  assert.deepEqual(loggerRuntimeDiagnostics(), {
    closed: true,
    hooksInstalled: false,
  });
});
