import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      paused: true,
      message: "Place details are temporarily paused.",
    },
    { status: 503 }
  );
}