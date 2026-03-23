import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { LOG_TRANSPORT, LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogDTO } from "../model/log.dto.js";
import type { LogTransport } from "../transport/log-transport.interface.js";

@Injectable()
export class AsyncBatchLogger implements OnModuleInit {
  private buffer: LogDTO[] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
    @Inject(LOG_TRANSPORT)
    private readonly transport: LogTransport,
  ) {}

  onModuleInit() {
    if (!this.options.batch?.enabled) return;

    this.timer = setInterval(() => this.flush(), this.options.batch.flushInterval ?? 2000);
  }

  enqueue(log: LogDTO) {
    if (!this.options.batch?.enabled) {
      this.transport.send(log);
      return;
    }

    this.buffer.push(log);

    if (this.buffer.length >= (this.options.batch.maxSize ?? 50)) {
      this.flush();
    }
  }

  private async flush() {
    const logs = [...this.buffer];
    this.buffer = [];

    await Promise.all(logs.map((l) => this.transport.send(l)));
  }
}
