import { Inject, Injectable } from "@nestjs/common";
import type { AsyncBatchLogger } from "../batch/async-batch-logger.js";
import { LOGGER_OPTIONS } from "../core/logger.constants.js";
import type { LoggerModuleOptions } from "../core/logger.options.js";
import { ScopedLogger } from "./scoped-logger.js";

@Injectable()
export class OmnixysLogger {
  constructor(
    @Inject(LOGGER_OPTIONS)
    private readonly options: LoggerModuleOptions,
    private readonly batch: AsyncBatchLogger,
  ) {}

  log(context: string): ScopedLogger {
    return new ScopedLogger(context, this.options, this.batch);
  }
}
