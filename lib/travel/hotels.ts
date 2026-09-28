const STAYING_API_URL = "https://api.stayingapi.com";

export interface HotelOption {
  id: string;
  name: string;
  platform: string;
  url?: string;

  price?: {
    currency: string;
    nightlyPrice?: number;
    totalPrice?: number;
    nights?: number;
  };

  images: string[];

  latitude?: number;
  longitude?: number;

  address?: string;
  propertyType?: string;

  starRating?: number;
  guestRating?: number;
  reviewCount?: number;

  amenities?: string[];
}

interface SearchHotelsInput {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface StayingSearchResponse {
  data?: unknown[];
  meta?: {
    platforms?: string[];
    creditsCharged?: number;
  };
}

export async function searchHotels(
  input: SearchHotelsInput
): Promise<HotelOption[]> {
  const apiKey = process.env.STAYING_API_KEY;

  if (!apiKey) {
    throw new Error("STAYING_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    location: input.location,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: String(input.guests),
    platforms: "airbnb,booking",
    limit: "10",
  });

  const response = await fetch(
    `${STAYING_API_URL}/v1/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  /*
   * StayingAPI can return 202 when a live search
   * needs to run asynchronously.
   */
  if (response.status === 202) {
    const jobResponse = await response.json();

    const jobId = jobResponse?.data?.jobId;

    if (!jobId) {
      throw new Error(
        "StayingAPI returned 202 but no jobId was provided"
      );
    }

    return await pollHotelJob(jobId, apiKey);
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `StayingAPI request failed with status ${response.status}: ${errorText}`
    );
  }

  const data =
    (await response.json()) as StayingSearchResponse;

  return normalizeHotels(data.data);
}

async function pollHotelJob(
  jobId: string,
  apiKey: string
): Promise<HotelOption[]> {
  const maxAttempts = 20;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) =>
      setTimeout(resolve, pollInterval)
    );

    const response = await fetch(
      `${STAYING_API_URL}/v1/jobs/${jobId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const job = await response.json();

    console.log(
      `StayingAPI hotel job ${jobId} - attempt ${
        attempt + 1
      }/${maxAttempts}:`,
      JSON.stringify(job, null, 2)
    );

    if (!response.ok) {
      throw new Error(
        `StayingAPI job request failed with status ${response.status}`
      );
    }

    const status = job?.data?.status;

    if (status === "completed") {
      return normalizeHotels(
        job?.data?.result
      );
    }

    if (
      status === "failed" ||
      status === "cancelled"
    ) {
      throw new Error(
        `StayingAPI hotel search job ${status}`
      );
    }
  }

  throw new Error(
    "StayingAPI hotel search is still processing. Please try again."
  );
}

function normalizeHotels(
  results: unknown
): HotelOption[] {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.map((hotel: any) => ({
    id: String(hotel.id),

    name:
      hotel.name ??
      "Unknown hotel",

    platform:
      hotel.platform ??
      "unknown",

    url:
      hotel.url,

    price: hotel.price
      ? {
          currency:
            hotel.price.currency,

          nightlyPrice:
            hotel.price.nightlyPrice,

          totalPrice:
            hotel.price.totalPrice,

          nights:
            hotel.price.nights,
        }
      : undefined,

    images:
      Array.isArray(hotel.images)
        ? hotel.images.filter(
            (image: unknown): image is string =>
              typeof image === "string"
          )
        : [],

    latitude:
      hotel.location?.lat,

    longitude:
      hotel.location?.lng,

    address:
      hotel.location?.city,

    propertyType:
      hotel.propertyType,

    starRating:
      hotel.starRating,

    guestRating:
      hotel.guestRating,

    reviewCount:
      hotel.reviewCount,

    amenities:
      Array.isArray(hotel.amenities)
        ? hotel.amenities
        : [],
  }));
}