import { Inject, Injectable } from "@nestjs/common";
import type { KafkaProducerService } from "@omnixys/kafka";

import { LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogDTO } from "../model/log.dto.js";
import type { LogTransport } from "./log-transport.interface.js";
import { KafkaTopics } from '@omnixys/kafka';

@Injectable()
export class KafkaLogTransport implements LogTransport {
  constructor(
    private readonly producer: KafkaProducerService,
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
  ) {}

  async send(log: LogDTO): Promise<void> {
    const topic = this.options.kafka?.topic ?? 'log';
    
    await this.producer.send(
      topic,
      log,
      {
      version: "1",
      service: log.service,
        operation: "Log",
      class: log.class
    });
  }
}
