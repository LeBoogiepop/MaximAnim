import { NextResponse } from "next/server";

/**
 * The build this deployment serves. A page compares it with the build it was
 * loaded from (Réglages → À propos) to offer "Mettre à jour maintenant".
 * Never cached (the service worker leaves /api/* to the network too).
 */
export function GET() {
  return NextResponse.json(
    { sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev", builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
