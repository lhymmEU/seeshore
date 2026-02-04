import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

async function isStoreOwner(userId: string, storeId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("store_owners")
    .select("store_id")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// GET /api/invite-codes?storeId=xxx - List invite codes for a store (owner only)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    const owner = await isStoreOwner(userId, storeId);
    if (!owner) {
      return NextResponse.json(
        { error: "Only store owners can view invitation codes" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("invite_codes")
      .select("id, code, store_id, created_by, used_by, used_at, expires_at, is_used, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch invite codes:", error);
      return NextResponse.json(
        { error: "Failed to fetch invite codes" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Invite codes GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/invite-codes - Create a new invite code (owner only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { storeId, expiresInDays } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    const owner = await isStoreOwner(userId, storeId);
    if (!owner) {
      return NextResponse.json(
        { error: "Only store owners can create invitation codes" },
        { status: 403 }
      );
    }

    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateInviteCode();
      const { data: existing } = await supabaseAdmin
        .from("invite_codes")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique code" },
        { status: 500 }
      );
    }

    const expiresAt =
      typeof expiresInDays === "number" && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data: inserted, error } = await supabaseAdmin
      .from("invite_codes")
      .insert({
        code,
        store_id: storeId,
        created_by: userId,
        expires_at: expiresAt,
        is_used: false,
      })
      .select("id, code, store_id, created_by, used_by, used_at, expires_at, is_used, created_at")
      .single();

    if (error) {
      console.error("Failed to create invite code:", error);
      return NextResponse.json(
        { error: "Failed to create invite code" },
        { status: 500 }
      );
    }

    return NextResponse.json(inserted);
  } catch (err) {
    console.error("Invite codes POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
