import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";

export interface GeocodingResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const GEOCODING_TIMEOUT_MS = 10_000;

export async function geocodeDestination(
  query: string
): Promise<GeocodingResult | null> {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetchWithTimeout(url, undefined, {
    timeoutMs: GEOCODING_TIMEOUT_MS,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch destination data");
  }

  const data = await response.json();

  if (!data.results?.length) {
    return null;
  }

  const result = data.results[0];

  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}