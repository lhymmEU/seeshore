import { NextRequest, NextResponse } from "next/server";
import { fetchCollaboratePosts, createCollaboratePost } from "@/data/supabase";

// GET /api/collaborate/posts?storeId=xxx - Fetch all posts for a store
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        const posts = await fetchCollaboratePosts(storeId);
        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch collaborate posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}

// POST /api/collaborate/posts - Create a new post
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, authorId, title, description, photos } = body;

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        if (!authorId) {
            return NextResponse.json(
                { error: "Author ID is required" },
                { status: 400 }
            );
        }

        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!description || !description.trim()) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const post = await createCollaboratePost(
            storeId,
            authorId,
            {
                title: title.trim(),
                description: description.trim(),
                photos: photos || [],
            },
            accessToken
        );

        return NextResponse.json(post);
    } catch (error) {
        console.error("Failed to create collaborate post:", error);
        return NextResponse.json(
            { error: "Failed to create post" },
            { status: 500 }
        );
    }
}
