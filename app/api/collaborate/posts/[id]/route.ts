import { NextRequest, NextResponse } from "next/server";
import { fetchCollaboratePost, updateCollaboratePost, deleteCollaboratePost } from "@/data/supabase";

// GET /api/collaborate/posts/[id] - Fetch a single post by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Post ID is required" },
                { status: 400 }
            );
        }

        const post = await fetchCollaboratePost(id);
        return NextResponse.json(post);
    } catch (error) {
        console.error("Failed to fetch collaborate post:", error);
        return NextResponse.json(
            { error: "Failed to fetch post" },
            { status: 500 }
        );
    }
}

// PUT /api/collaborate/posts/[id] - Update a post
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, photos } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Post ID is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const post = await updateCollaboratePost(
            id,
            {
                title: title?.trim(),
                description: description?.trim(),
                photos,
            },
            accessToken
        );

        return NextResponse.json(post);
    } catch (error) {
        console.error("Failed to update collaborate post:", error);
        return NextResponse.json(
            { error: "Failed to update post" },
            { status: 500 }
        );
    }
}

// DELETE /api/collaborate/posts/[id] - Delete a post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Post ID is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        await deleteCollaboratePost(id, accessToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete collaborate post:", error);
        return NextResponse.json(
            { error: "Failed to delete post" },
            { status: 500 }
        );
    }
}
