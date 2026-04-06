import type { LogLevel } from "./log-level.enum.js";

export interface LogDTO {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ContextLogDTO {
  log: LogDTO;
  ctx: any;
}