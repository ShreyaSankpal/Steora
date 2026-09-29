import { spawn } from "child_process";
import path from "path";

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

interface RoostProperty {
  id?: string;
  name?: string;
  type?: string;
  class?: number | null;
  rating?: number | null;
  reviews?: number | null;
  nights?: number;
  perNight?: number | null;

  total?: {
    amount?: number;
    currency?: string;
  } | null;

  taxesIncluded?: boolean;

  deal?: {
    percentLessThanUsual?: number;
    label?: string;
  } | null;

  amenities?: string[];
  url?: string;
}

interface RoostSearchResponse {
  properties?: RoostProperty[];

  query?: {
    nights?: number;
    currency?: string;
  };
}

interface SerpApiPhoto {
  photo_url?: string;
  thumbnail_url?: string;
}

interface SerpApiPhotoSection {
  photos?: SerpApiPhoto[];
}

interface SerpApiPhotosResponse {
  sections?: SerpApiPhotoSection[];

  error?: string;

  search_metadata?: {
    status?: string;
  };
}

export async function searchHotels(
  input: SearchHotelsInput
): Promise<HotelOption[]> {
  const bridgePath = path.join(
    process.cwd(),
    "scripts",
    "roost_bridge.py"
  );

  return new Promise((resolve, reject) => {
    const python = spawn("python", [
      bridgePath,
      input.location,
      input.checkIn,
      input.checkOut,
    ]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("error", (error) => {
      reject(
        new Error(
          `Failed to start Roost bridge: ${error.message}`
        )
      );
    });

    python.on("close", async (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Roost hotel search failed.${
              stderr
                ? ` ${stderr.trim()}`
                : ""
            }`
          )
        );

        return;
      }

      try {
        const data =
          JSON.parse(stdout) as RoostSearchResponse;

        const hotels =
          normalizeRoostHotels(data);

        const hotelsWithPhotos =
          await Promise.all(
            hotels.map(async (hotel) => {
              const images =
                await getHotelPhotos(
                  hotel.id
                );

              return {
                ...hotel,
                images,
              };
            })
          );

        resolve(hotelsWithPhotos);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Roost response: ${
              error instanceof Error
                ? error.message
                : "Invalid JSON"
            }`
          )
        );
      }
    });
  });
}

function normalizeRoostHotels(
  data: RoostSearchResponse
): HotelOption[] {
  if (!Array.isArray(data.properties)) {
    return [];
  }

  const defaultNights =
    data.query?.nights;

  const defaultCurrency =
    data.query?.currency;

  return data.properties.map(
    (hotel): HotelOption => {
      const totalPrice =
        typeof hotel.total?.amount === "number"
          ? hotel.total.amount
          : undefined;

      const currency =
        hotel.total?.currency ??
        defaultCurrency;

      const nights =
        typeof hotel.nights === "number"
          ? hotel.nights
          : defaultNights;

      const nightlyPrice =
        totalPrice !== undefined &&
        nights !== undefined &&
        nights > 0
          ? totalPrice / nights
          : undefined;

      return {
        id:
          hotel.id ??
          crypto.randomUUID(),

        name:
          hotel.name ??
          "Unknown hotel",

        platform:
          "Google Hotels",

        url:
          hotel.url,

        price:
          totalPrice !== undefined ||
          currency !== undefined
            ? {
                currency:
                  currency ?? "INR",

                nightlyPrice,

                totalPrice,

                nights,
              }
            : undefined,

        /*
         * Images are populated after
         * Roost normalization using
         * SerpApi Google Hotels Photos.
         */
        images: [],

        /*
         * Roost currently does not provide
         * reliable coordinates/address fields
         * in this response.
         *
         * We intentionally leave these
         * unavailable instead of inventing data.
         */
        latitude:
          undefined,

        longitude:
          undefined,

        address:
          undefined,

        propertyType:
          hotel.type,

        starRating:
          typeof hotel.class === "number"
            ? hotel.class
            : undefined,

        guestRating:
          typeof hotel.rating === "number"
            ? hotel.rating
            : undefined,

        reviewCount:
          typeof hotel.reviews === "number"
            ? hotel.reviews
            : undefined,

        amenities:
          Array.isArray(hotel.amenities)
            ? hotel.amenities.filter(
                (
                  amenity
                ): amenity is string =>
                  typeof amenity === "string"
              )
            : [],
      };
    }
  );
}

async function getHotelPhotos(
  propertyToken: string
): Promise<string[]> {
  const apiKey =
    process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    console.error(
      "SERPAPI_API_KEY is not configured."
    );

    return [];
  }

  const params = new URLSearchParams({
    engine: "google_hotels_photos",
    property_token: propertyToken,
    api_key: apiKey,
  });

  const url =
    `https://serpapi.com/search.json?${params.toString()}`;

  console.log(
    "Fetching hotel photos for:",
    propertyToken
  );

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    console.log(
      "SerpApi photo status:",
      response.status
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "SerpApi photo request failed:",
        errorText
      );

      return [];
    }

    const data =
      (await response.json()) as SerpApiPhotosResponse;

    if (data.error) {
      console.error(
        "SerpApi returned an error:",
        data.error
      );

      return [];
    }

    const sections = Array.isArray(
      data.sections
    )
      ? data.sections
      : [];

    console.log(
      "Photo sections:",
      sections.length
    );

    /*
     * SerpApi Google Hotels Photos returns
     * photos inside:
     *
     * sections[].photos[]
     */
    const images = sections
      .flatMap(
        (section) =>
          Array.isArray(section.photos)
            ? section.photos
            : []
      )
      .map(
        (photo) =>
          photo.photo_url ??
          photo.thumbnail_url
      )
      .filter(
        (url): url is string =>
          typeof url === "string" &&
          url.length > 0
      )
      .filter(
        (
          url,
          index,
          array
        ) =>
          array.indexOf(url) === index
      )
      .slice(0, 3);

    console.log(
      "Images extracted:",
      images.length
    );

    return images;
  } catch (error) {
    console.error(
      "Failed to fetch hotel photos:",
      error
    );

    return [];
  }
}