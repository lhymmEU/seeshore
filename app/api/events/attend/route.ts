import { NextRequest, NextResponse } from "next/server";
import { attendEvent, fetchEvent } from "@/data/supabase";
import { isEventPastDeadline } from "@/lib/date-utils";

// POST /api/events/attend - Attend an event (requires authentication)
export async function POST(request: NextRequest) {
    try {
        // Extract access token from Authorization header
        const authHeader = request.headers.get("Authorization");
        const accessToken = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Authentication required. Please log in to attend events." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { eventId, userId } = body;

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Fetch the event to check its status and deadline
        const event = await fetchEvent(eventId);

        // Check if event status allows attendance
        if (event.status === 'finished') {
            return NextResponse.json(
                { error: "This event has already ended." },
                { status: 400 }
            );
        }

        if (event.status === 'cancelled') {
            return NextResponse.json(
                { error: "This event has been cancelled." },
                { status: 400 }
            );
        }

        if (event.status === 'rejected') {
            return NextResponse.json(
                { error: "This event is not available." },
                { status: 400 }
            );
        }

        if (event.status === 'proposed') {
            return NextResponse.json(
                { error: "This event is pending approval." },
                { status: 400 }
            );
        }

        // Double-check deadline (in case auto-finish hasn't run yet)
        if (isEventPastDeadline(event.endDate)) {
            return NextResponse.json(
                { error: "This event has already ended." },
                { status: 400 }
            );
        }

        await attendEvent(eventId, userId, accessToken);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to attend event:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to attend event";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
