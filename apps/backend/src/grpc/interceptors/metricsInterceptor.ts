'use strict';
/**
 * apps/backend/src/grpc/interceptors/metricsInterceptor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC server-side metrics interceptor.
 *
 * Tracks per-method call counts, latencies (histogram buckets), and error
 * counts. Metrics are exposed on the shared counter object accessible from
 * the /metrics HTTP endpoint in server.ts.
 *
 * Prometheus-compatible output added to /metrics:
 *   lkvip_grpc_calls_total{method="...",status="ok|error"} N
 *   lkvip_grpc_latency_ms{method="...",le="50"} N
 *   lkvip_grpc_active_streams{method="..."} N
 */

/** @type {Map<string, { calls: number, errors: number, latencyBuckets: number[], activeStreams: number }>} */
const methodStats = new Map();

const HISTOGRAM_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

function getStats(method) {
  if (!methodStats.has(method)) {
    methodStats.set(method, {
      calls:         0,
      errors:        0,
      latencyBuckets: new Array(HISTOGRAM_BUCKETS.length).fill(0),
      latencySum:    0,
      activeStreams:  0,
    });
  }
  return methodStats.get(method);
}

function recordLatency(stats, ms) {
  stats.latencySum = (stats.latencySum || 0) + ms;
  for (let i = 0; i < HISTOGRAM_BUCKETS.length; i++) {
    if (ms <= HISTOGRAM_BUCKETS[i]) stats.latencyBuckets[i]++;
  }
}

/**
 * Build a gRPC server interceptor that records call metrics.
 * @returns {Function}
 */
function makeMetricsInterceptor() {
  return function metricsInterceptor(methodDescriptor, call) {
    const method = methodDescriptor.path;
    const stats  = getStats(method);
    const start  = Date.now();

    stats.calls++;
    stats.activeStreams++;

    const listener = {
      onReceiveMetadata: (metadata, next) => next(metadata),
      onReceiveMessage:  (message,  next) => next(message),
      onReceiveStatus(status, next) {
        const ms = Date.now() - start;
        recordLatency(stats, ms);
        stats.activeStreams = Math.max(0, stats.activeStreams - 1);
        if (status.code !== 0 /* OK */) stats.errors++;
        next(status);
      },
    };

    return { listener };
  };
}

/**
 * Generate Prometheus-compatible metric lines for the /metrics HTTP endpoint.
 * Called from server.ts when building the /metrics response.
 *
 * @returns {string[]} array of Prometheus text lines
 */
function getMetricLines() {
  const lines = [
    '',
    '# HELP lkvip_grpc_calls_total Total gRPC calls per method',
    '# TYPE lkvip_grpc_calls_total counter',
  ];

  for (const [method, s] of methodStats) {
    const shortMethod = method.replace(/^\/lkvip\./, '');
    lines.push(`lkvip_grpc_calls_total{method="${shortMethod}",status="ok"} ${s.calls - s.errors}`);
    lines.push(`lkvip_grpc_calls_total{method="${shortMethod}",status="error"} ${s.errors}`);
  }

  lines.push('', '# HELP lkvip_grpc_active_streams Active gRPC server-streaming connections');
  lines.push('# TYPE lkvip_grpc_active_streams gauge');
  for (const [method, s] of methodStats) {
    const shortMethod = method.replace(/^\/lkvip\./, '');
    lines.push(`lkvip_grpc_active_streams{method="${shortMethod}"} ${s.activeStreams}`);
  }

  lines.push('', '# HELP lkvip_grpc_latency_ms_sum Sum of gRPC call latencies (ms)');
  lines.push('# TYPE lkvip_grpc_latency_ms_sum counter');
  for (const [method, s] of methodStats) {
    const shortMethod = method.replace(/^\/lkvip\./, '');
    lines.push(`lkvip_grpc_latency_ms_sum{method="${shortMethod}"} ${s.latencySum || 0}`);
  }

  return lines;
}

/** Raw map for health checks (e.g. get active stream count). */
function getMethodStats() {
  return methodStats;
}

module.exports = { makeMetricsInterceptor, getMetricLines, getMethodStats };
