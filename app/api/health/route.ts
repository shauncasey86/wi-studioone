import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Health probe used by Railway and by the Phase 0 acceptance gate. It proves the
// app is up AND that it can reach Postgres. Never cache it.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { status: "error", database: "unreachable", message },
      { status: 503 },
    );
  }
}
