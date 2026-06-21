import { Inject, Injectable } from "@nestjs/common";
import {
  KAFKA_LOG_PUBLISHER,
  LOGGER_OPTIONS,
} from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import type { LogTransport } from "./log-transport.interface.js";
import { LogDTO } from "@omnixys/contracts";

interface KafkaLogPublisher {
  send(input: {
    topic: string;
    payload: LogDTO;
    meta: {
      version: string;
      service: string;
      operation: string;
      clazz?: string;
      type: "EVENT";
      actorId: string;
      tenantId: string;
    };
  }): Promise<unknown>;
}

@Injectable()
export class KafkaLogTransport implements LogTransport {
  constructor(
    @Inject(KAFKA_LOG_PUBLISHER)
    private readonly producer: KafkaLogPublisher,
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
  ) {}

  async send(log: LogDTO): Promise<void> {
    const topic = this.options.kafka?.topic || "logstream.log";
    const actorId =
      typeof log.metadata?.actorId === "string" ? log.metadata.actorId : "";
    const tenantId =
      typeof log.metadata?.tenantId === "string" ? log.metadata.tenantId : "";
    const clazz =
      typeof log.metadata?.clazz === "string"
        ? log.metadata.clazz
        : typeof log.metadata?.class === "string"
          ? log.metadata.class
          : undefined;
    await this.producer.send({
      topic,
      payload: log,
      meta: {
        version: "1",
        service: log.service,
        operation: "Log",
        clazz,
        type: "EVENT",
        actorId,
        tenantId,
      },
    });
  }
}
