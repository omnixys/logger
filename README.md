# @omnixys/observability

![version](https://img.shields.io/npm/v/@omnixys/observability)
![license](https://img.shields.io/badge/license-GPL--3.0-blue)

Unified observability module for Omnixys microservices.

Provides:
- Structured logging (Pino-style + Kafka)
- Distributed tracing (OpenTelemetry)
- Metrics (Prometheus)
- Automatic context propagation
- HTTP request logging (NestJS interceptor)

---

## ✨ Features

- 🔥 **OmnixysLogger**
  - Structured JSON logs
  - Batch Kafka publishing
  - Automatic trace context injection

- 🔍 **Distributed Tracing**
  - OpenTelemetry SDK
  - OTLP export (Tempo / Collector)
  - Auto-instrumentation (HTTP, NestJS, Kafka)

- 📊 **Metrics**
  - Prometheus exporter
  - `/metrics` endpoint

- ⚡ **NestJS Integration**
  - Global module
  - LoggingInterceptor
  - TraceInterceptor

---

## 📦 Installation

```bash
pnpm add @omnixys/observability
````

---

## ⚙️ Setup

```ts
import { ObservabilityModule } from '@omnixys/observability';

@Module({
  imports: [
    ObservabilityModule.forRoot({
      serviceName: 'authentication',

      otel: {
        endpoint: 'http://localhost:4318/v1/traces',
        samplingRatio: 1,
      },

      metrics: {
        port: 9464,
      },

      kafka: {
        brokers: ['localhost:9092'],
      },
    }),
  ],
})
export class AppModule {}
```

---

## 🧠 Usage

### Logger

```ts
import { OmnixysLogger } from '@omnixys/observability';

@Injectable()
export class AuthService {
  constructor(private readonly logger: OmnixysLogger) {}

  async login() {
    const log = this.logger.child('login');

    log.info('User login started');

    // ...
    
    log.info('User login completed');
  }
}
```

---

## 📡 Log Flow

```text
Service
  ↓
OmnixysLogger
  ↓
BatchLogger (buffered)
  ↓
Kafka (logstream.*)
  ↓
logstream-service
  ↓
Loki / Tempo / Grafana
```

---

## 🔍 Tracing

* Automatic span creation via `TraceInterceptor`
* Context propagation via OpenTelemetry
* Compatible with:

  * Tempo
  * Jaeger
  * Zipkin

---

## 📊 Metrics

* Prometheus endpoint exposed at:

```text
http://localhost:<metrics.port>/metrics
```

---

## 🧱 Architecture

```text
ObservabilityModule
├── OmnixysLogger
│   └── BatchLogger → Kafka
├── OpenTelemetry SDK
│   ├── Traces → OTLP
│   └── Metrics → Prometheus
├── Interceptors
│   ├── LoggingInterceptor
│   └── TraceInterceptor
```

---

## ⚠️ Breaking Changes (v1.0.0)

* Replaces legacy logging system
* Removes env-based configuration
* Logger must be accessed via DI (`OmnixysLogger`)
* Kafka logging is now internal (no direct usage)
* Introduces module-based configuration (`forRoot`)

---

## 🛠️ Roadmap

* [ ] Retry & DLQ for BatchLogger
* [ ] Structured error logging
* [ ] GraphQL tracing support
* [ ] Kafka consumer tracing
* [ ] Log sampling / filtering

---

## 📄 License

GPL-3.0-or-later © Omnixys Technologies