// Phase 0 holding page. The real StudioONE site (ported pixel-for-pixel from
// legacy/studioone.html) lands in Phase 1.
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-space-mono), monospace",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <h1 style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>StudioONE</h1>
        <p style={{ opacity: 0.7 }}>
          Scaffold ready. The site is ported in Phase 1.
        </p>
        <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>
          Health check: <a href="/api/health">/api/health</a>
        </p>
      </div>
    </main>
  );
}
