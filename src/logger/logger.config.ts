import { resolve } from "node:path";
import pino, { type TransportTargetOptions } from "pino";

const { NODE_ENV, LOG_DIRECTORY, LOG_FILE_DEFAULT_NAME, LOG_PRETTY, LOG_LEVEL, SERVICE_NAME } =
  process.env;

const logFile = resolve(LOG_DIRECTORY ?? "log", LOG_FILE_DEFAULT_NAME ?? "server.log");
const isProd = NODE_ENV === "production";

const logLevel = (isProd ? "info" : (LOG_LEVEL ?? "debug")) as
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace";

const pretty = NODE_ENV !== "production" && (LOG_PRETTY === undefined || LOG_PRETTY === "true");

const fileTarget = {
  level: logLevel,
  target: "pino/file",
  options: {
    destination: logFile,
    mkdir: true,
  },
};

const prettyTarget = {
  level: logLevel,
  target: "pino-pretty",
  options: {
    translateTime: "SYS:standard",
    singleLine: true,
    colorize: true,
    ignore: "pid,hostname,req,res",
  },
};

const targets: TransportTargetOptions[] = pretty
  ? [fileTarget, prettyTarget]
  : isProd
    ? [fileTarget]
    : [prettyTarget];

const transport = pino.transport({
  // targets: pretty ? [fileTarget, prettyTarget] : [fileTarget],
  targets,
});

export const parentLogger = pino(
  {
    level: logLevel,
    base: {
      env: NODE_ENV,
      service: SERVICE_NAME ?? "unknown",
    },
  },
  transport,
);
