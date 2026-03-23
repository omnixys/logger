import { TraceContextExtractor } from "@omnixys/observability";
import type { AsyncBatchLogger } from "../batch/async-batch-logger.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import { formatLog } from "../formatter/log-formatter.js";
import type { LogDTO } from "../model/log.dto.js";
import { LogLevel } from "../model/log-level.enum.js";

export class ScopedLogger {
  constructor(
    private readonly context: string,
    private readonly options: LoggerModuleOptions,
    private readonly batch: AsyncBatchLogger,
  ) {}

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

  private log(level: LogLevel, message: string, metadata?: any) {
    const trace = TraceContextExtractor.current();

    const log: LogDTO = {
      level,
      message: formatLog(message, metadata),
      service: this.options.serviceName,
      timestamp: new Date().toISOString(),
      context: this.context,
      traceId: trace?.traceId,
      spanId: trace?.spanId,
      metadata,
    };

    this.batch.enqueue(log);
  }
}
