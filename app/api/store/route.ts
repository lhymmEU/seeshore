import { NextRequest, NextResponse } from "next/server";
import { fetchStoreInfo, fetchStoreByUserId, createStore, updateStore } from "@/data/supabase";

// GET /api/store?id=xxx or /api/store?userId=xxx - Fetch store info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("id");
        const userId = searchParams.get("userId");

        if (storeId) {
            // Fetch by store ID
            const store = await fetchStoreInfo(storeId);
            return NextResponse.json(store);
        }

        if (userId) {
            // Fetch store by user ID (owner or assistant)
            const store = await fetchStoreByUserId(userId);
            if (!store) {
                return NextResponse.json(
                    { error: "No store found for this user" },
                    { status: 404 }
                );
            }
            return NextResponse.json(store);
        }

        return NextResponse.json(
            { error: "Store ID or User ID is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Failed to fetch store:", error);
        return NextResponse.json(
            { error: "Failed to fetch store" },
            { status: 500 }
        );
    }
}

// POST /api/store - Create a new store
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, banner, description, rules, ownerId } = body;

        if (!name || !ownerId) {
            return NextResponse.json(
                { error: "Name and owner ID are required" },
                { status: 400 }
            );
        }

        const store = await createStore(
            {
                name,
                banner: banner || undefined,
                description: description || undefined,
                rules: rules || undefined,
            },
            ownerId
        );

        return NextResponse.json(store);
    } catch (error) {
        console.error("Failed to create store:", error);
        return NextResponse.json(
            { error: "Failed to create store" },
            { status: 500 }
        );
    }
}

// PUT /api/store - Update an existing store
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, banner, description, rules, featuredBooks } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const updates: {
            name?: string;
            banner?: string;
            description?: string;
            rules?: string;
            featuredBooks?: string[];
        } = {};

        if (name !== undefined) updates.name = name;
        if (banner !== undefined) updates.banner = banner;
        if (description !== undefined) updates.description = description;
        if (rules !== undefined) updates.rules = rules;
        if (featuredBooks !== undefined) updates.featuredBooks = featuredBooks;

        const store = await updateStore(id, updates, accessToken);
        return NextResponse.json(store);
    } catch (error) {
        console.error("Failed to update store:", error);
        return NextResponse.json(
            { error: "Failed to update store" },
            { status: 500 }
        );
    }
}

