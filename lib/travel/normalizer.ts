import type {
  Destination,
  Interest,
  PriceStatus,
  TravelPlace,
  Weather,
} from "@/types/trip";

import type { GeocodingResult } from "@/lib/location/geocoding";
import type { WeatherResult } from "@/lib/weather/weather";
import type { PlaceResult } from "@/lib/places/places";

export interface NormalizedPlace extends TravelPlace {}

export interface RoutingData {
  fromDestination: Array<{
    distanceKm?: number;
    travelTimeMinutes?: number;
  }>;

  betweenPlaces: Array<
    Array<{
      distanceKm?: number;
      travelTimeMinutes?: number;
    }>
  >;
}

export interface NormalizedTravelData {
  destination: Destination;
  weather: WeatherResult;
  places: NormalizedPlace[];
  routing: RoutingData;
}

export function normalizeTravelData(
  location: GeocodingResult,
  weather: WeatherResult,
  places: PlaceResult[]
): NormalizedTravelData {
  return {
    destination: {
      query: location.name,
      name: location.name,
      country: location.country,
      coordinates: {
        lat: location.latitude,
        lng: location.longitude,
      },
      resolution: "resolved",
    },

    weather,

    places: places.map((place) => {
     const normalizedPlace: NormalizedPlace = {
  name: place.name,

  coordinates: {
    lat: place.latitude,
    lng: place.longitude,
  },

  category: place.category,
  placeId: place.placeId,

  /*
   * We do NOT have verified pricing yet.
   * Therefore Steora must explicitly mark the
   * price as unavailable instead of inventing one.
   */
  priceStatus: "unavailable" as PriceStatus,
};

      return normalizedPlace;
    }),

    routing: {
      fromDestination: [],
      betweenPlaces: [],
    },
  };
}