import { Inject, Injectable } from "@nestjs/common";
import type { KafkaProducerService } from "@omnixys/kafka";

import { LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogDTO } from "../model/log.dto.js";
import type { LogTransport } from "./log-transport.interface.js";

@Injectable()
export class KafkaLogTransport implements LogTransport {
  constructor(
    private readonly producer: KafkaProducerService,
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
  ) {}

  async send(log: LogDTO): Promise<void> {
    await this.producer.send(this.options.kafka!.topic!, {
      eventId: crypto.randomUUID(),
      eventName: "log.event",
      eventVersion: "1",
      service: log.service,
      operation: log.context ?? "unknown",
      timestamp: log.timestamp,
      payload: log,
      metadata: {},
    });
  }
}
