import { NextResponse } from "next/server";
import { getAvailabilityWindow } from "@/lib/booking/service";

// Live availability for the diary window (CLAUDE.md §8). Cache-light.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAvailabilityWindow();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "availability_unavailable" },
      { status: 503 },
    );
  }
}
