export default function ToolLoading() {
  return (
    <div
      style={{
        height: "calc(100vh - 54px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: "0.6rem",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
              opacity: 0.3,
              animation: `dot-pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--fg-muted)",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.04em",
        }}
      >
        loading tool…
      </span>

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
