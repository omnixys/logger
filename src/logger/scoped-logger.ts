import { TraceContextExtractor } from "@omnixys/observability";
import { format } from "util";
import type { AsyncBatchLogger } from "../batch/async-batch-logger.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogDTO } from "../model/log.dto.js";
import { LogLevel } from "../model/log-level.enum.js";
import { getLogger } from "./get-logger.js";

const levelMap = {
  trace: "trace",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
} as const;

type PinoLevel = keyof typeof levelMap;

export class ScopedLogger {
  private readonly pino;

  constructor(
    private readonly clazz: string,
    private readonly options: LoggerModuleOptions,
    private readonly batch: AsyncBatchLogger,
  ) {
    this.pino = getLogger(clazz, "class");
  }

  info(message: string, metadata?: any) {
    this.log(LogLevel.INFO, message, metadata);
  }

  error(message: string, metadata?: any) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log(LogLevel.WARN, message, metadata);
  }

  debug(message: string, metadata?: any) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  trace(message: string, metadata?: any) {
    this.log(LogLevel.TRACE, message, metadata);
  }

  private log(level: LogLevel, message: string, args: unknown[]) {
    let metadata: Record<string, unknown> | undefined = {};
    let formatArgs = args;

    const hasPlaceholders = /%[sdifoO]/.test(message);

    if (
      args.length > 0 &&
      typeof args[args.length - 1] === "object" &&
      args[args.length - 1] !== null &&
      !Array.isArray(args[args.length - 1]) &&
      !hasPlaceholders // 🔥 WICHTIG
    ) {
      metadata = safeSerialize(args[args.length - 1]) as Record<string, unknown>;
      formatArgs = args.slice(0, -1);
    }

    const msg = format(message, ...formatArgs);
    const extractedArgs = mapArgsToMetadata(message, formatArgs);

    metadata = {
      ...extractedArgs,
      ...metadata,
      class: this.clazz,
    };

    const trace = TraceContextExtractor.current();

    const log: LogDTO = {
      level,
      message: msg,
      service: this.options.serviceName,
      timestamp: new Date().toISOString(),
      class: this.clazz,
      traceId: trace?.traceId,
      spanId: trace?.spanId,
      metadata,
    };

    const pinoLevel: PinoLevel = level;

    this.pino[pinoLevel](
      {
        class: this.clazz,
        service: this.options.serviceName,
        // ...metadata,
        traceId: trace?.traceId,
        spanId: trace?.spanId,
      },
      msg,
    );

    this.batch.enqueue(log);
  }
}

function safeSerialize(value: unknown): unknown {
  if (value === undefined) return undefined;

  const seen = new WeakSet();

  try {
    const json = JSON.stringify(value, (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }

      if (val instanceof Error) {
        return {
          message: val.message,
          stack: val.stack,
        };
      }

      if (typeof val === "bigint") {
        return val.toString();
      }

      return val;
    });

    return json === undefined ? undefined : JSON.parse(json);
  } catch {
    return "[Unserializable]";
  }
}

function extractKeysFromMessage(message: string): string[] {
  const keys: string[] = [];

  // matches: actor=%s, name=%d, user=%o
  const regex = /(\w+)=\s*%[sdifoO]/g;

  let match;
  while ((match = regex.exec(message)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

function mapArgsToMetadata(message: string, args: unknown[]): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  const keys = extractKeysFromMessage(message);

  args.forEach((arg, index) => {
    const key = keys[index] ?? `arg${index}`;

    if (typeof arg === "object" && arg !== null) {
      metadata[key] = safeSerialize(arg);
    } else {
      metadata[key] = arg;
    }
  });

  return metadata;
}
