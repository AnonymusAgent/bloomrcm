import { NextResponse } from "next/server";
import { getAdminUser, getIdleRemaining, destroySession } from "@/lib/auth";
import { IDLE_TIMEOUT_SECONDS, IDLE_WARNING_SECONDS } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Session heartbeat. Calling getAdminUser() refreshes the activity timestamp
 * (throttled) and enforces the idle policy, so this doubles as the check the
 * client uses to decide when to warn or sign the user out.
 */
export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { authenticated: false, remaining: 0, timeout: IDLE_TIMEOUT_SECONDS, warnAt: IDLE_WARNING_SECONDS },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      remaining: await getIdleRemaining(),
      timeout: IDLE_TIMEOUT_SECONDS,
      warnAt: IDLE_WARNING_SECONDS,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Explicit sign-out used by the inactivity timer. */
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
