import { NextRequest, NextResponse } from "next/server";
import { fetchUsers, fetchUser } from "@/data/supabase";

// GET /api/users?ids=xxx,yyy,zzz or /api/users?id=xxx - Fetch users
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("id");
        const userIds = searchParams.get("ids");

        if (userId) {
            // Fetch single user by ID
            const user = await fetchUser(userId);
            return NextResponse.json(user);
        }

        if (userIds) {
            // Fetch multiple users by IDs
            const ids = userIds.split(",").filter(id => id.trim());
            if (ids.length === 0) {
                return NextResponse.json([]);
            }
            const users = await fetchUsers(ids);
            return NextResponse.json(users);
        }

        return NextResponse.json(
            { error: "User ID or User IDs are required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

