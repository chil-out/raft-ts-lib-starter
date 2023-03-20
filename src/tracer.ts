import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  WebTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { LongTaskInstrumentation } from '@opentelemetry/instrumentation-long-task';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

export function Tracer() {
  const exporter = new OTLPTraceExporter({
    url: 'https:192.168.10.106:443/v1/traces',
  });
  const tracerProvider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'browser',
    }),
  });
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  tracerProvider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        // load custom configuration for xml-http-request instrumentation
        '@opentelemetry/instrumentation-xml-http-request': {
          propagateTraceHeaderCorsUrls: [
            /token/g, //Regex to match your backend urls. This should be updated.

            /**
             *^ - 字符串开头。
              . - 除换行符以外的所有字符。
              $ - 字符串结尾。
              \d,\w,\s - 匹配数字、字符、空格。
              \D,\W,\S - 匹配非数字、非字符、非空格。
              [abc] - 匹配 a、b 或 c 中的一个字母。
              [a-z] - 匹配 a 到 z 中的一个字母。
              [^abc] - 匹配除了 a、b 或 c 中的其他字母。
              aa|bb - 匹配 aa 或 bb。
              ? - 0 次或 1 次匹配。
              * - 匹配 0 次或多次。
              + - 匹配 1 次或多次。
              {n} - 匹配 n 次。
              {n,} - 匹配 n 次以上。
              {m, n} - 最少 m 次，最多 n 次匹配
             */
          ],
        },
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: [
            /.+/g, //Regex to match your backend urls. This should be updated.
          ],
        },
        '@opentelemetry/instrumentation-document-load': {},
        '@opentelemetry/instrumentation-user-interaction': {
          enabled: true,
          eventNames: ['click', 'submit', 'keypress'],
          shouldPreventSpanCreation: (event, element, span) => {
            span.setAttribute('target.id', element.id);
          },
        },
      }),
      new LongTaskInstrumentation({
        // see under for available configuration
        observerCallback: (span, longtaskEvent) => {
          span.setAttribute('location.pathname', window.location.pathname);
        },
      }),
    ],
  });
}
