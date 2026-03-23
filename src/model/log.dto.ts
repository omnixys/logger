import type { LogLevel } from "./log-level.enum.js";

export interface LogDTO {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;

  traceId?: string;
  spanId?: string;

  context?: string;
  metadata?: Record<string, any>;
}
