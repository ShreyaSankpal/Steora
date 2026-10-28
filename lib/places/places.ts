import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";

export interface PlaceResult {
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  placeId?: string;
  distanceFromDestinationKm?: number;
}

interface GeoapifyFeature {
  properties?: {
    name?: string;
    categories?: string[];
    place_id?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[];
}

const SEARCH_CATEGORIES = [
  "tourism.attraction",
  "tourism.sights",
  "entertainment.museum",
  "natural",
  "catering.restaurant",
  "catering.cafe",
];

const MAX_DISTANCE_KM = 50;
const PLACES_TIMEOUT_MS = 15_000;

export async function getPlaces(
  latitude: number,
  longitude: number
): Promise<PlaceResult[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("Geoapify places API key is missing");
  }

  const results = await Promise.all(
    SEARCH_CATEGORIES.map((category) =>
      searchPlaces(category, latitude, longitude, apiKey)
    )
  );

  const uniquePlaces = new Map<string, PlaceResult>();

  for (const place of results.flat()) {
    const distance = calculateDistanceKm(
      latitude,
      longitude,
      place.latitude,
      place.longitude
    );

    if (distance > MAX_DISTANCE_KM) {
      continue;
    }

    const placeWithDistance: PlaceResult = {
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category,
      ...(place.placeId
        ? { placeId: place.placeId }
        : {}),
      distanceFromDestinationKm: distance,
    };

    const key = normalizePlaceName(place.name);

    if (!uniquePlaces.has(key)) {
      uniquePlaces.set(key, placeWithDistance);
    }
  }

  return Array.from(uniquePlaces.values());
}

async function searchPlaces(
  category: string,
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<PlaceResult[]> {
  const url = new URL(
    "https://api.geoapify.com/v2/places"
  );

  url.searchParams.set("categories", category);
  url.searchParams.set(
    "filter",
    `circle:${longitude},${latitude},50000`
  );
  url.searchParams.set(
    "bias",
    `proximity:${longitude},${latitude}`
  );
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetchWithTimeout(url, undefined, {
    timeoutMs: PLACES_TIMEOUT_MS,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "Geoapify places search failed: " +
        response.status +
        " " +
        response.statusText +
        " " +
        errorText
    );
  }

  const data =
    (await response.json()) as GeoapifyResponse;

  const places: PlaceResult[] = [];

  for (const feature of data.features ?? []) {
    const coordinates =
      feature.geometry?.coordinates;

    const name = feature.properties?.name;

    if (!coordinates || !name) {
      continue;
    }

    const place: PlaceResult = {
      name,
      latitude: coordinates[1],
      longitude: coordinates[0],
      category:
        feature.properties?.categories?.[0] ??
        category,
    };

    if (feature.properties?.place_id) {
      place.placeId =
        feature.properties.place_id;
    }

    places.push(place);
  }

  return places;
}

function normalizePlaceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}