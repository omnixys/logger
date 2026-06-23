import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { ContextAccessor } from "@omnixys/context/accessor";

import { type Observable, tap } from "rxjs";
import { OmnixysLogger } from "../logger/omnixys-logger.js";
import { getCanonicalLogMetadata } from "../logger/context-log-metadata.js";

type HttpRequest = {
  method?: string;
  url?: string;
  originalUrl?: string;
  headers?: Record<string, any>;
  ip?: string;
  user?: { id?: string };
  body?: { operationName?: string };
};

type HttpResponse = {
  statusCode?: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: OmnixysLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const transport = requestTransport(context);
    if (!transport) {
      return next.handle();
    }

    const { request, response, type } = transport;

    const method = type === "graphql" ? "GRAPHQL" : request.method ?? "UNKNOWN";

    const url =
      request.body?.operationName ??
      request.originalUrl ??
      request.url ??
      "UNKNOWN";

    const requestContext = ContextAccessor.get();
    const userAgent =
      requestContext?.client?.userAgent ?? request?.headers?.["user-agent"];
    const ip = requestContext?.client?.ip ?? request?.ip;
    const userId =
      requestContext?.principal?.userId ??
      requestContext?.principal?.actorId ??
      request?.user?.id;

    const log = this.logger.log("http.request");

    const start = Date.now();

    log.info("Incoming request", {
      method,
      url,
      ip,
      userAgent,
      userId,
      ...getCanonicalLogMetadata(),
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
            ...getCanonicalLogMetadata(),
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
            ...getCanonicalLogMetadata(),
            error: normalizeError(err),
          });
        },
      }),
    );
  }
}

function requestTransport(
  context: ExecutionContext,
):
  | { request: HttpRequest; response: HttpResponse; type: "http" | "graphql" }
  | undefined {
  const type = context.getType<string>();

  if (type === "http") {
    const http = context.switchToHttp();
    return {
      request: http.getRequest<HttpRequest>(),
      response: http.getResponse<HttpResponse>(),
      type,
    };
  }

  if (type === "graphql") {
    const gqlContext = context.getArgByIndex<{
      req?: HttpRequest;
      request?: HttpRequest;
      reply?: HttpResponse;
      res?: HttpResponse;
    }>(2);
    const request = gqlContext?.req ?? gqlContext?.request;
    if (!request) return undefined;

    return {
      request,
      response: gqlContext.reply ?? gqlContext.res ?? {},
      type,
    };
  }

  return undefined;
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
