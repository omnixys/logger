export interface LoggerModuleOptions {
  serviceName: string;

  kafka?: {
    enabled?: boolean;
    topic?: string;
  };

  batch?: {
    enabled?: boolean;
    maxSize?: number;
    maxBufferSize?: number;
    flushInterval?: number;
    maxRetries?: number;
    overflowStrategy?: "drop-oldest" | "drop-newest";
  };
}
