import type { LogDTO } from "../model/log.dto.js";

export interface LogTransport {
  send(log: LogDTO): Promise<void>;
}
