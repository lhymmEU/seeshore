import { NextRequest, NextResponse } from "next/server";
import { registerBook, fetchBooks, fetchBook } from "@/data/supabase";

// GET /api/books?storeId=xxx or /api/books?id=xxx - Fetch books
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get("id");
        const storeId = searchParams.get("storeId");

        if (bookId) {
            // Fetch single book by ID
            const book = await fetchBook(bookId);
            return NextResponse.json(book);
        }

        if (storeId) {
            // Fetch books by store ID
            const books = await fetchBooks(storeId);
            return NextResponse.json(books);
        }

        // Fetch all books if no filter provided
        const allBooks = await fetchBooks();
        return NextResponse.json(allBooks);
    } catch (error) {
        console.error("Failed to fetch books:", error);
        return NextResponse.json(
            { error: "Failed to fetch books" },
            { status: 500 }
        );
    }
}

// POST /api/books - Register a new book
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            storeId, 
            isbn,
            title, 
            author, 
            cover, 
            background,
            publicationDate, 
            description, 
            categories,
            location,
            link
        } = body;

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: "Book title is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const book = await registerBook(storeId, {
            isbn: isbn?.trim() || undefined,
            title: title.trim(),
            author: author?.trim() || undefined,
            cover: cover || undefined,
            background: background || undefined,
            publicationDate: publicationDate || undefined,
            description: description?.trim() || undefined,
            categories: categories || undefined,
            location: location?.trim() || undefined,
            link: link?.trim() || undefined,
        }, accessToken);

        return NextResponse.json(book);
    } catch (error) {
        console.error("Failed to register book:", error);
        return NextResponse.json(
            { error: "Failed to register book" },
            { status: 500 }
        );
    }
}

