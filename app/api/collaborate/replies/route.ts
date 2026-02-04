import { NextRequest, NextResponse } from "next/server";
import { fetchCollaborateReplies, createCollaborateReply } from "@/data/supabase";

// GET /api/collaborate/replies?postId=xxx - Fetch all replies for a post
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");

        if (!postId) {
            return NextResponse.json(
                { error: "Post ID is required" },
                { status: 400 }
            );
        }

        const replies = await fetchCollaborateReplies(postId);
        return NextResponse.json(replies);
    } catch (error) {
        console.error("Failed to fetch collaborate replies:", error);
        return NextResponse.json(
            { error: "Failed to fetch replies" },
            { status: 500 }
        );
    }
}

// POST /api/collaborate/replies - Create a new reply
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, authorId, content } = body;

        if (!postId) {
            return NextResponse.json(
                { error: "Post ID is required" },
                { status: 400 }
            );
        }

        if (!authorId) {
            return NextResponse.json(
                { error: "Author ID is required" },
                { status: 400 }
            );
        }

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const reply = await createCollaborateReply(
            postId,
            authorId,
            content.trim(),
            accessToken
        );

        return NextResponse.json(reply);
    } catch (error) {
        console.error("Failed to create collaborate reply:", error);
        return NextResponse.json(
            { error: "Failed to create reply" },
            { status: 500 }
        );
    }
}
