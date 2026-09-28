import type { CurrencyCode } from "@/types/trip";

const SERPAPI_URL = "https://serpapi.com/search.json";

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  departureAirport: {
    name: string;
    id: string;
    time: string;
  };
  arrivalAirport: {
    name: string;
    id: string;
    time: string;
  };
  durationMinutes: number;
  travelClass?: string;
  airplane?: string;
  legroom?: string;
}

export interface FlightOption {
  price: number;
  currency: CurrencyCode;
  type: string;
  totalDurationMinutes: number;
  segments: FlightSegment[];
  layovers: Array<{
    name: string;
    id: string;
    durationMinutes: number;
  }>;
  bookingToken?: string;
}

interface SerpApiFlight {
  airline?: string;
  flight_number?: string;
  departure_airport?: {
    name?: string;
    id?: string;
    time?: string;
  };
  arrival_airport?: {
    name?: string;
    id?: string;
    time?: string;
  };
  duration?: number;
  travel_class?: string;
  airplane?: string;
  legroom?: string;
}

interface SerpApiResult {
  best_flights?: Array<{
    flights?: SerpApiFlight[];
    layovers?: Array<{
      name?: string;
      id?: string;
      duration?: number;
    }>;
    total_duration?: number;
    price?: number;
    type?: string;
    booking_token?: string;
  }>;
  other_flights?: Array<{
    flights?: SerpApiFlight[];
    layovers?: Array<{
      name?: string;
      id?: string;
      duration?: number;
    }>;
    total_duration?: number;
    price?: number;
    type?: string;
    booking_token?: string;
  }>;
  error?: string;
}

interface SearchFlightsInput {
  departureId: string;
  arrivalId: string;
  outboundDate: string;
  returnDate?: string;
  currency: CurrencyCode;
}

export async function searchFlights(
  input: SearchFlightsInput
): Promise<FlightOption[]> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: input.departureId,
    arrival_id: input.arrivalId,
    outbound_date: input.outboundDate,
    currency: input.currency,
    hl: "en",
    gl: "in",
    type: input.returnDate ? "1" : "2",
  });

  if (input.returnDate) {
    params.set("return_date", input.returnDate);
  }

  const response = await fetch(
    `${SERPAPI_URL}?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `SerpApi request failed with status ${response.status}`
    );
  }

  const data =
    (await response.json()) as SerpApiResult;

  if (data.error) {
    throw new Error(data.error);
  }

  const results = [
    ...(data.best_flights ?? []),
    ...(data.other_flights ?? []),
  ];

  return results
    .filter(
      (result) =>
        typeof result.price === "number" &&
        Array.isArray(result.flights)
    )
    .map((result) => ({
      price: result.price!,
      currency: input.currency,
      type: result.type ?? "Unknown",
      totalDurationMinutes:
        result.total_duration ?? 0,
      segments: (result.flights ?? [])
        .filter(
          (flight) =>
            flight.departure_airport &&
            flight.arrival_airport
        )
        .map((flight) => ({
          airline: flight.airline ?? "Unknown",
          flightNumber:
            flight.flight_number ?? "Unknown",
          departureAirport: {
            name:
              flight.departure_airport?.name ??
              "Unknown",
            id:
              flight.departure_airport?.id ??
              "Unknown",
            time:
              flight.departure_airport?.time ??
              "Unknown",
          },
          arrivalAirport: {
            name:
              flight.arrival_airport?.name ??
              "Unknown",
            id:
              flight.arrival_airport?.id ??
              "Unknown",
            time:
              flight.arrival_airport?.time ??
              "Unknown",
          },
          durationMinutes:
            flight.duration ?? 0,
          travelClass:
            flight.travel_class,
          airplane:
            flight.airplane,
          legroom:
            flight.legroom,
        })),
      layovers: (result.layovers ?? []).map(
        (layover) => ({
          name: layover.name ?? "Unknown",
          id: layover.id ?? "Unknown",
          durationMinutes:
            layover.duration ?? 0,
        })
      ),
      bookingToken:
        result.booking_token,
    }));
}