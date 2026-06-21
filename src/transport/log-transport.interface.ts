import { LogDTO } from "@omnixys/shared";

export interface LogTransport {
  send(log: LogDTO): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}
