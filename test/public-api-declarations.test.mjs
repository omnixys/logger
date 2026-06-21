import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("declarations preserve legacy signatures and expose additive APIs", async () => {
  const [root, scoped, omnixys, module, interceptor] = await Promise.all([
    declaration("index.d.ts"),
    declaration("logger/scoped-logger.d.ts"),
    declaration("logger/omnixys-logger.d.ts"),
    declaration("core/logger.module.d.ts"),
    declaration("nest/logger.interceptor.d.ts"),
  ]);
  const declarations = [root, scoped, omnixys, module, interceptor].join("\n");

  for (const legacySignature of [
    'export * from "./core/index.js";',
    'export * from "./logger/index.js";',
    'export * from "./nest/index.js";',
    "static forRoot(options: LoggerModuleOptions): DynamicModule;",
    "constructor(logger: OmnixysLogger);",
    "intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;",
    "constructor(options: LoggerModuleOptions, batch: AsyncBatchLogger);",
    "log(context: string): ScopedLogger;",
    "info(message: string, ...args: unknown[]): void;",
    "error(message: string, ...args: unknown[]): void;",
    "warn(message: string, ...args: unknown[]): void;",
    "debug(message: string, ...args: unknown[]): void;",
    "trace(message: string, ...args: unknown[]): void;",
  ]) {
    assert.ok(
      declarations.includes(legacySignature),
      `missing legacy declaration: ${legacySignature}`,
    );
  }

  for (const additiveSignature of [
    "child(component: string, metadata?: LoggerMetadata): ScopedLogger;",
    "withMetadata(metadata: LoggerMetadata): ScopedLogger;",
    "flush(): Promise<void>;",
    "close(): Promise<void>;",
    "diagnostics(): {",
  ]) {
    assert.ok(
      declarations.includes(additiveSignature),
      `missing additive declaration: ${additiveSignature}`,
    );
  }
});

function declaration(relativePath) {
  return readFile(new URL(`../dist/${relativePath}`, import.meta.url), "utf8");
}
