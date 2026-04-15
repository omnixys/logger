import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { LOG_TRANSPORT, LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogTransport } from "../transport/log-transport.interface.js";
import { ContextStore } from "@omnixys/observability";
import { ContextLogDTO, LogDTO } from "@omnixys/shared";

@Injectable()
export class AsyncBatchLogger implements OnModuleInit {
  private buffer: ContextLogDTO[] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
    @Inject(LOG_TRANSPORT)
    private readonly transport: LogTransport,
  ) {}

  onModuleInit() {
    if (!this.options.batch?.enabled) return;

    this.timer = setInterval(
      () => this.flush(),
      this.options.batch.flushInterval ?? 2000,
    );
  }

  enqueue(log: LogDTO) {
    if (!this.options.batch?.enabled) {
      this.transport.send(log);
      return;
    }

    const ctx = ContextStore.capture(); // 🔥 NO OTel import

    this.buffer.push({ log, ctx });

    if (this.buffer.length >= (this.options.batch.maxSize ?? 50)) {
      this.flush();
    }
  }
  private async flush() {
    const batch = [...this.buffer];
    this.buffer = [];

    await Promise.all(
      batch.map(({ log, ctx }) =>
        ContextStore.run(ctx, () => this.transport.send(log)),
      ),
    );
  }
}