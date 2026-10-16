// OpenTelemetry tracing, OFF unless OTEL_EXPORTER_OTLP_ENDPOINT is set.
//
// Without that variable, register() returns at once: @vercel/otel is never
// loaded, no tracer provider is registered, and Next's built-in spans stay
// no-ops (zero overhead). With it, traces go straight to the OTLP endpoint
// (e.g. Grafana Cloud), authenticated by OTEL_EXPORTER_OTLP_HEADERS. Both are
// set in the Vercel project settings, never in the repo. See .claude_context.md
// "Ops & fiabilité".
//
// Node.js runtime only: process.env.NEXT_RUNTIME is inlined at build time, so
// the edge compilation of this file drops the import entirely.
export async function register() {
  // Constant condition (not an early return): the bundler drops the whole
  // block, import included, from the edge compilation.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({ serviceName: "latexci-web" });
  }
}
