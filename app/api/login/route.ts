import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    // For now, just return 200 success
    return NextResponse.json(
      { 
        success: true, 
        message: "Login successful",
        user: { username, role }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

