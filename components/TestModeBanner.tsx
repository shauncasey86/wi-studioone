// Fixed strip shown on the public site while testing mode is on, so it's never
// mistaken for the live site. Bookings/edits made now are wiped when test mode
// is turned off in the admin.
export default function TestModeBanner() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: "var(--clay-deep)",
        color: "var(--paper)",
        fontFamily: "var(--mono)",
        fontSize: "0.64rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "0.45rem 1rem",
      }}
    >
      Testing mode — bookings &amp; edits here are not live and will be reset
    </div>
  );
}
