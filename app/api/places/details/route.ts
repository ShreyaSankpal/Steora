import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/places/placeDetails";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json(
        {
          success: false,
          error: "placeId is required",
        },
        { status: 400 }
      );
    }

    const place = await getPlaceDetails(placeId);

    return NextResponse.json({
      success: true,
      place,
    });
  } catch (error) {
    console.error("Place details failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Place details failed",
      },
      { status: 500 }
    );
  }
}