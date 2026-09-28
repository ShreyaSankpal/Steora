import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/travel/flights";
import type { CurrencyCode } from "@/types/trip";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const departureId = searchParams.get("departureId");
    const arrivalId = searchParams.get("arrivalId");
    const outboundDate = searchParams.get("outboundDate");
    const returnDate = searchParams.get("returnDate") || undefined;

    const currency =
      (searchParams.get("currency") || "INR") as CurrencyCode;

    if (!departureId || !arrivalId || !outboundDate) {
      return NextResponse.json(
        {
          error:
            "departureId, arrivalId and outboundDate are required",
        },
        { status: 400 }
      );
    }

    const flights = await searchFlights({
      departureId,
      arrivalId,
      outboundDate,
      returnDate,
      currency,
    });

    return NextResponse.json({
      success: true,
      count: flights.length,
      flights,
    });
  } catch (error) {
    console.error("Flight search failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Flight search failed",
      },
      { status: 500 }
    );
  }
}