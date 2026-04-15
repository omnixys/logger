import { Inject, Injectable } from "@nestjs/common";
import { KafkaEventRegistry, KafkaProducerService, KafkaTopics } from "@omnixys/kafka";


import { LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogTransport } from "./log-transport.interface.js";
import { LogDTO } from "@omnixys/shared";

@Injectable()
export class KafkaLogTransport implements LogTransport {
  constructor(
    private readonly producer: KafkaProducerService,
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
  ) {}

  async send(log: LogDTO): Promise<void> {
    const topic =
      (this.options.kafka?.topic as keyof KafkaEventRegistry) || KafkaTopics.logstream.log;
    
      await this.producer.send({
        topic,
        payload: log,
        meta: {
          version: "1",
          service: log.service,
          operation: "Log",
          clazz: log.metadata?.class,
          type: "EVENT",
          actorId: 'system', // TODO actor hinzufügen vom log context
          tenantId: 'omnixys',
        },
      });
  }
}
