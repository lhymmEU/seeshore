import { NextRequest, NextResponse } from "next/server";
import { updateBook, deregisterBook, fetchBook } from "@/data/supabase";

// GET /api/books/[id] - Fetch a single book
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const book = await fetchBook(id);
        return NextResponse.json(book);
    } catch (error) {
        console.error("Failed to fetch book:", error);
        return NextResponse.json(
            { error: "Failed to fetch book" },
            { status: 500 }
        );
    }
}

// PUT /api/books/[id] - Update a book
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            isbn,
            title,
            author,
            cover,
            background,
            publicationDate,
            description,
            categories,
            location,
            link,
        } = body;

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;

        const book = await updateBook(
            id,
            {
                isbn: isbn?.trim() || undefined,
                title: title?.trim(),
                author: author?.trim() || undefined,
                cover: cover || undefined,
                background: background || undefined,
                publicationDate: publicationDate || undefined,
                description: description?.trim() || undefined,
                categories: categories || undefined,
                location: location?.trim() || undefined,
                link: link?.trim() || undefined,
            },
            accessToken
        );

        return NextResponse.json(book);
    } catch (error) {
        console.error("Failed to update book:", error);
        return NextResponse.json(
            { error: "Failed to update book" },
            { status: 500 }
        );
    }
}

// DELETE /api/books/[id] - Delete a book
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;

        await deregisterBook(id, accessToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete book:", error);
        return NextResponse.json(
            { error: "Failed to delete book" },
            { status: 500 }
        );
    }
}
