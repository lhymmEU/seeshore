import { NextRequest, NextResponse } from "next/server";
import { updateCollaborateReply, deleteCollaborateReply } from "@/data/supabase";

// PUT /api/collaborate/replies/[id] - Update a reply
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Reply ID is required" },
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

        const reply = await updateCollaborateReply(id, content.trim(), accessToken);
        return NextResponse.json(reply);
    } catch (error) {
        console.error("Failed to update collaborate reply:", error);
        return NextResponse.json(
            { error: "Failed to update reply" },
            { status: 500 }
        );
    }
}

// DELETE /api/collaborate/replies/[id] - Delete a reply
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Reply ID is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        await deleteCollaborateReply(id, accessToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete collaborate reply:", error);
        return NextResponse.json(
            { error: "Failed to delete reply" },
            { status: 500 }
        );
    }
}
