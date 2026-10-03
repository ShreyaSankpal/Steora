export interface PlaceDetails {
  name: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  googleMapsUrl?: string;
}

export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is missing");
  }

  const url = new URL(
    "https://serpapi.com/search.json"
  );

  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("type", "place");
  url.searchParams.set("data_id", placeId);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `SerpApi place details failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  console.log(
    "SERPAPI PLACE DETAILS:",
    JSON.stringify(data, null, 2)
  );

  return null;
}