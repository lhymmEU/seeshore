import { NextRequest, NextResponse } from "next/server";
import { createEvent, fetchEvents, fetchEvent } from "@/data/supabase";

// GET /api/events?storeId=xxx or /api/events?id=xxx - Fetch events
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("id");
        const storeId = searchParams.get("storeId");
        const status = searchParams.get("status") as "proposed" | "open" | "full" | "cancelled" | "rejected" | "finished" | null;
        const limit = searchParams.get("limit");

        if (eventId) {
            // Fetch single event by ID
            const event = await fetchEvent(eventId);
            return NextResponse.json(event);
        }

        if (storeId) {
            // Fetch events by store ID with optional filters
            const events = await fetchEvents({
                storeId,
                status: status || undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            return NextResponse.json(events);
        }

        return NextResponse.json(
            { error: "Event ID or Store ID is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, title, cover, startDate, endDate, description, location, hostIds } = body;

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID is required" },
                { status: 400 }
            );
        }

        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: "Event title is required" },
                { status: 400 }
            );
        }

        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        const event = await createEvent(storeId, {
            title: title.trim(),
            cover: cover || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            description: description?.trim() || undefined,
            location: location?.trim() || undefined,
            hostIds: hostIds || undefined,
        }, accessToken);

        return NextResponse.json(event);
    } catch (error) {
        console.error("Failed to create event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}

