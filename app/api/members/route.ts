import { NextRequest, NextResponse } from "next/server";
import { searchStoreMembers } from "@/data/supabase";

// GET /api/members - Fetch store members with optional search query
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");
        const query = searchParams.get("q") || undefined;

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        const members = await searchStoreMembers(storeId, query);
        return NextResponse.json(members);
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}
