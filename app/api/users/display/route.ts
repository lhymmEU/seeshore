import { NextRequest, NextResponse } from "next/server";
import { updateDisplayConfig, fetchUser, fetchUserDisplayConfig } from "@/data/supabase";
import type { DisplayConfig } from "@/types/type";

// GET /api/users/display?id=xxx - Fetch user's display config (public)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const displayConfig = await fetchUserDisplayConfig(userId);
        const user = await fetchUser(userId);

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                location: user.location,
            },
            displayConfig,
        });
    } catch (error) {
        console.error("Failed to fetch display config:", error);
        return NextResponse.json(
            { error: "Failed to fetch display config" },
            { status: 500 }
        );
    }
}

// PUT /api/users/display - Update user's display config (authenticated)
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Verify the token and get user ID
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data: { user: authUser }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
        
        if (authError || !authUser) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { displayConfig } = body as { displayConfig: DisplayConfig };

        if (!displayConfig) {
            return NextResponse.json(
                { error: "Display config is required" },
                { status: 400 }
            );
        }

        const updatedUser = await updateDisplayConfig(
            authUser.id,
            displayConfig,
            accessToken
        );

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update display config:", error);
        return NextResponse.json(
            { error: "Failed to update display config" },
            { status: 500 }
        );
    }
}
