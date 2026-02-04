import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// DELETE /api/invite-codes/[id] - Revoke (delete) an unused invite code (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Invite code ID is required" },
        { status: 400 }
      );
    }

    const { data: inviteCode, error: fetchError } = await supabaseAdmin
      .from("invite_codes")
      .select("id, store_id, is_used")
      .eq("id", id)
      .single();

    if (fetchError || !inviteCode) {
      return NextResponse.json(
        { error: "Invite code not found" },
        { status: 404 }
      );
    }

    if (inviteCode.is_used) {
      return NextResponse.json(
        { error: "Cannot revoke a code that has already been used" },
        { status: 400 }
      );
    }

    const owner = await isStoreOwner(userId, inviteCode.store_id);
    if (!owner) {
      return NextResponse.json(
        { error: "Only store owners can revoke invitation codes" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("invite_codes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Failed to delete invite code:", deleteError);
      return NextResponse.json(
        { error: "Failed to revoke invite code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite codes DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
