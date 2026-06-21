import assert from "node:assert/strict";
import test from "node:test";
import { ContextAccessor } from "@omnixys/context";
import { lastValueFrom, of } from "rxjs";
import { LoggingInterceptor } from "../dist/nest/logger.interceptor.js";

test("HTTP logging consumes canonical context instead of forwarded headers", async () => {
  const entries = [];
  const logger = {
    log: () => ({
      info: (message, metadata) => entries.push({ message, metadata }),
      error: (message, metadata) => entries.push({ message, metadata }),
    }),
  };
  const interceptor = new LoggingInterceptor(logger);
  const executionContext = {
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => ({
        method: "GET",
        url: "/health",
        ip: "10.0.0.8",
        headers: {
          "user-agent": "untrusted-agent",
          "x-forwarded-for": "198.51.100.200",
        },
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  };

  await ContextAccessor.run(
    {
      requestId: "request-1",
      correlationId: "correlation-1",
      startedAtEpochMs: Date.now(),
      principal: {
        subject: "subject-1",
        actorId: "actor-1",
        userId: "user-1",
        roles: [],
      },
      tenant: {
        tenantId: "tenant-1",
        source: "principal",
        verified: true,
      },
      client: { ip: "203.0.113.10", userAgent: "canonical-agent" },
      transport: { type: "http" },
      trace: { traceId: "trace-1", spanId: "span-1" },
    },
    () =>
      lastValueFrom(
        interceptor.intercept(executionContext, { handle: () => of("ok") }),
      ),
  );

  assert.equal(entries[0].metadata.ip, "203.0.113.10");
  assert.equal(entries[0].metadata.userAgent, "canonical-agent");
  assert.equal(entries[0].metadata.userId, "user-1");
  assert.equal(entries[0].metadata.tenantId, "tenant-1");
  assert.equal(entries[0].metadata.correlationId, "correlation-1");
  assert.equal(entries[0].metadata.traceId, "trace-1");
});

test("HTTP logging fallback never reads x-forwarded-for directly", async () => {
  const entries = [];
  const interceptor = new LoggingInterceptor({
    log: () => ({
      info: (_message, metadata) => entries.push(metadata),
      error: (_message, metadata) => entries.push(metadata),
    }),
  });
  const executionContext = {
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => ({
        method: "GET",
        url: "/",
        ip: "10.0.0.8",
        headers: { "x-forwarded-for": "198.51.100.200" },
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  };

  await lastValueFrom(
    interceptor.intercept(executionContext, { handle: () => of("ok") }),
  );

  assert.equal(entries[0].ip, "10.0.0.8");
});
