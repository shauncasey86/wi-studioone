// Phase 0 seed stub.
//
// The real, idempotent seed — which loads today's copy from
// legacy/studioone.html into the database so a fresh deploy renders the current
// site exactly — is built in Phase 2 (Content model + seed).
async function main() {
  console.log("[seed] No data to seed yet (real seed arrives in Phase 2).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
