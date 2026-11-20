import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isRankCoreAdmin } from "@/lib/rankcore-admin";

export const runtime = "nodejs";

// Demo user (falmeida)
const DEMO_USER_ID = "9b7e2a2a-7f2f-4f6a-9d9e-falmeida000001";

// For admin we return a huge daily limit so UI never gates
const ADMIN_DAILY_LIMIT = 999999;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Plan → daily Pro Scan limits.
 */
const PLAN_LIMITS: Record<string, number> = {
  free: Number(process.env.PROSCAN_LIMIT_FREE ?? 0),
  personal: Number(process.env.PROSCAN_LIMIT_PERSONAL ?? 3),
  business: Number(process.env.PROSCAN_LIMIT_BUSINESS ?? 15),
  agency: Number(process.env.PROSCAN_LIMIT_AGENCY ?? 40),
};

function computePlanLimit(planRaw: string | null | undefined, status: string) {
  const plan = (planRaw || "free").toLowerCase();
  const isActive = status === "active";
  if (!isActive || plan === "free") return PLAN_LIMITS.free;
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

function nextUtcMidnightISO() {
  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setUTCHours(24, 0, 0, 0);
  return resetAt.toISOString();
}

export async function GET(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServer();
    const { searchParams } = new URL(req.url);

    const authedUser = await supabaseAuth.auth.getUser().then(
      ({ data }) => data.user,
      () => null,
    );
    const authedEmail = authedUser?.email?.toLowerCase() ?? null;
    const isAdmin = isRankCoreAdmin(authedUser);

    // IMPORTANT:
    // - If user is authenticated, ALWAYS use authedUserId (ignore spoofable ?u=)
    // - If not authenticated, fall back to ?u= or demo id
    const userIdParam = searchParams.get("u");
    const userId = isAdmin
      ? `admin-${authedEmail}` // stable admin id (quota irrelevant)
      : authedUser?.id || userIdParam || DEMO_USER_ID;

    // -----------------------------
    // ADMIN SHORT-CIRCUIT
    // -----------------------------
    if (isAdmin) {
      return NextResponse.json({
        userId,
        email: authedEmail,
        plan: "agency",
        status: "active",
        limit: ADMIN_DAILY_LIMIT,
        usedToday: 0,
        remaining: ADMIN_DAILY_LIMIT,
        resetAt: nextUtcMidnightISO(),
        isPro: true,
        demoUser: false,
        adminTester: true,
      });
    }

    // -----------------------------
    // Normal users
    // -----------------------------
    const supabaseAdmin = getSupabaseAdmin();
    let usedToday = 0;
    let plan = "free";
    let status = "inactive";
    let resetAtISO: string | null = null;

    // 1) Read subscription (if exists)
    // IMPORTANT: your table uses plan_id (NOT plan)
    try {
      const { data: sub } = await supabaseAdmin
        .from("proscan_subscriptions")
        .select("plan_id,status,current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      if (sub) {
        plan = String(sub.plan_id || plan).toLowerCase();
        status = sub.status || status;
      }
    } catch {
      // ignore missing table / schema mismatch
    }

    const limit = computePlanLimit(plan, status);
    const isPaidActive = status === "active" && plan !== "free";

    // 2) Read / upsert usage today
    try {
      const now = new Date();
      resetAtISO = nextUtcMidnightISO();

      const { data: usage } = await supabaseAdmin
        .from("proscan_usage")
        .select("used_today, reset_at, limit")
        .eq("user_id", userId)
        .maybeSingle();

      if (usage) {
        const resetAtDb = usage.reset_at ? new Date(usage.reset_at) : null;

        if (resetAtDb && resetAtDb > now) usedToday = usage.used_today || 0;
        else usedToday = 0;
      }

      await supabaseAdmin.from("proscan_usage").upsert({
        user_id: userId,
        used_today: usedToday,
        limit,
        reset_at: resetAtISO,
      });
    } catch {
      // ignore missing usage table
    }

    const remaining = Math.max(limit - usedToday, 0);

    return NextResponse.json({
      userId,
      email: authedEmail,
      plan,
      status,
      limit,
      usedToday,
      remaining,
      resetAt: resetAtISO,
      isPro: isPaidActive,
      demoUser: userId === DEMO_USER_ID,
      adminTester: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Quota check failed" },
      { status: 500 }
    );
  }
}
