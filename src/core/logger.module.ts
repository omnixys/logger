import { type DynamicModule, Global, Module } from "@nestjs/common";
import { AsyncBatchLogger } from "../batch/async-batch-logger.js";
import { OmnixysLogger } from "../logger/omnixys-logger.js";
import { KafkaLogTransport } from "../transport/kafka-log.transport.js";
import { LOG_TRANSPORT, LOGGER_OPTIONS } from "./logger.constants.js";
import type { LoggerModuleOptions } from "./logger.options.js";

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        { provide: LOGGER_OPTIONS, useValue: options },

        AsyncBatchLogger,
        OmnixysLogger,

        ...(options.kafka?.enabled
          ? [
              {
                provide: LOG_TRANSPORT,
                useClass: KafkaLogTransport,
              },
            ]
          : []),
      ],
      exports: [OmnixysLogger],
    };
  }
}
