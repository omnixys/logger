import { KafkaTopics } from "@omnixys/kafka";

export interface LoggerModuleOptions {
  serviceName: string;

  kafka?: {
    enabled?: boolean;
    topic?: string;
  };

  batch?: {
    enabled?: boolean;
    maxSize?: number;
    flushInterval?: number;
  };
}
