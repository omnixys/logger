export interface LoggerModuleOptions {
  serviceName: string;

  /** Register request logging globally for HTTP and GraphQL operations. */
  registerGlobalInterceptor?: boolean;

  batch?: {
    enabled?: boolean;
    maxSize?: number;
    maxBufferSize?: number;
    flushInterval?: number;
    maxRetries?: number;
    overflowStrategy?: "drop-oldest" | "drop-newest";
  };
}
