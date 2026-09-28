import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/travel/hotels";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get("location");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = Number(searchParams.get("guests") || "2");

    if (!location || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: "location, checkIn and checkOut are required",
        },
        { status: 400 }
      );
    }

    const hotels = await searchHotels({
      location,
      checkIn,
      checkOut,
      guests,
    });

    return NextResponse.json({
      success: true,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    console.error("Hotel search failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Hotel search failed",
      },
      { status: 500 }
    );
  }
}