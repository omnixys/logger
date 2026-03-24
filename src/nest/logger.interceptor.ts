import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";

import { type Observable, tap } from "rxjs";
import type { OmnixysLogger } from "../logger/omnixys-logger.js";

type HttpRequest = {
  method?: string;
  url?: string;
  originalUrl?: string;
  headers?: Record<string, any>;
  ip?: string;
  user?: { id?: string };
};

type HttpResponse = {
  statusCode?: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: OmnixysLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();

    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();

    const method = request.method ?? "UNKNOWN";

    const url = request.originalUrl ?? request.url ?? "UNKNOWN";

    const userAgent = request.headers?.["user-agent"];
    const ip = request.ip ?? request.headers?.["x-forwarded-for"];
    const userId = request.user?.id;

    const log = this.logger.log("http.request");

    const start = Date.now();

    log.info("Incoming request", {
      method,
      url,
      ip,
      userAgent,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;

          log.info("Request completed", {
            method,
            url,
            statusCode: response.statusCode,
            duration,
            ip,
            userId,
          });
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;

          log.error("Request failed", {
            method,
            url,
            statusCode: response.statusCode,
            duration,
            ip,
            userId,
            error: normalizeError(err),
          });
        },
      }),
    );
  }
}

/**
 * Normalizes unknown errors into structured metadata.
 */
function normalizeError(err: unknown) {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
      name: err.name,
    };
  }

  return {
    message: String(err),
  };
}
