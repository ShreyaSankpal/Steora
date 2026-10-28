import type { NormalizedTravelData } from "@/lib/travel/normalizer";

import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";

interface GeoapifyMatrixResponse {
  sources_to_targets?: Array<
    Array<{
      distance?: number | null;
      time?: number | null;
    }>
  >;
}

interface GeoapifyRouteResponse {
  features?: Array<{
    geometry?: {
      type?: string;
      coordinates?: Array<Array<[number, number]>>;
    };
  }>;
}

const MAX_PLACE_MATRIX_SIZE = 1000;
const ROUTE_TIMEOUT_MS = 20_000;

export async function calculateTravelTimes(
  travelData: NormalizedTravelData
): Promise<NormalizedTravelData> {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("Geoapify API key is missing");
  }

  if (travelData.places.length === 0) {
    return travelData;
  }

  const destinationCoordinates =
    travelData.destination.coordinates;

  if (!destinationCoordinates) {
    throw new Error(
      "Destination coordinates are missing"
    );
  }

  const placeCoordinates = travelData.places.map(
    (place) => ({
      location: [
        place.coordinates.lng,
        place.coordinates.lat,
      ],
    })
  );

  const destinationSource = {
    location: [
      destinationCoordinates.lng,
      destinationCoordinates.lat,
    ],
  };

  // --------------------------------------------------
  // STEP 1: Destination -> every real place
  // --------------------------------------------------

  const destinationResponse = await fetchWithTimeout(
    `https://api.geoapify.com/v1/routematrix?apiKey=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "drive",
        sources: [destinationSource],
        targets: placeCoordinates,
        units: "metric",
      }),
    },
    { timeoutMs: ROUTE_TIMEOUT_MS }
  );

  if (!destinationResponse.ok) {
    const errorText =
      await destinationResponse.text();

    throw new Error(
      "Geoapify destination routing failed: " +
        destinationResponse.status +
        " " +
        destinationResponse.statusText +
        " " +
        errorText
    );
  }

  const destinationData =
    (await destinationResponse.json()) as GeoapifyMatrixResponse;

  const destinationMatrix =
    destinationData.sources_to_targets?.[0];

  if (!destinationMatrix) {
    throw new Error(
      "Geoapify did not return destination routing data"
    );
  }

  // Add real destination distance/time to every place.
  const places = travelData.places.map(
    (place, index) => {
      const route =
        destinationMatrix[index];

      return {
        ...place,

        distanceFromDestinationKm:
          route?.distance != null
            ? route.distance / 1000
            : undefined,

        travelTimeFromDestinationMinutes:
          route?.time != null
            ? route.time / 60
            : undefined,
      };
    }
  );

  // --------------------------------------------------
  // STEP 2: Select places for place-to-place routing
  // --------------------------------------------------

  /*
   * Geoapify allows at most 1000 matrix elements
   * for a regular API call.
   *
   * 31 x 31 = 961
   *
   * We keep ALL discovered places, but calculate
   * detailed place-to-place routing only for the
   * closest 31 places.
   */

  const maxRoutedPlaces = Math.floor(
    Math.sqrt(MAX_PLACE_MATRIX_SIZE)
  );

  const routedPlaceIndexes = places
    .map((place, index) => ({
      index,
      distance:
        place.distanceFromDestinationKm ??
        Number.POSITIVE_INFINITY,
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance
    )
    .slice(0, maxRoutedPlaces)
    .map((item) => item.index);

  const routedPlaceCoordinates =
    routedPlaceIndexes.map(
      (index) => placeCoordinates[index]
    );

  // --------------------------------------------------
  // STEP 3: Place -> place routing
  // --------------------------------------------------

  const placeResponse = await fetchWithTimeout(
    `https://api.geoapify.com/v1/routematrix?apiKey=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "drive",
        sources: routedPlaceCoordinates,
        targets: routedPlaceCoordinates,
        units: "metric",
      }),
    },
    { timeoutMs: ROUTE_TIMEOUT_MS }
  );

  if (!placeResponse.ok) {
    const errorText =
      await placeResponse.text();

    throw new Error(
      "Geoapify place-to-place routing failed: " +
        placeResponse.status +
        " " +
        placeResponse.statusText +
        " " +
        errorText
    );
  }

  const placeData =
    (await placeResponse.json()) as GeoapifyMatrixResponse;

  const placeMatrix =
    placeData.sources_to_targets;

  if (!placeMatrix) {
    throw new Error(
      "Geoapify did not return place-to-place routing data"
    );
  }

  // --------------------------------------------------
  // STEP 4: Build full routing matrix
  // --------------------------------------------------

  /*
   * Keep the same indexes as the complete places array.
   *
   * Places outside the routed subset will have
   * undefined place-to-place routing data.
   */

  const betweenPlaces: Array<
    Array<{
      distanceKm?: number;
      travelTimeMinutes?: number;
    }>
  > = places.map(() =>
    places.map(() => ({}))
  );

  routedPlaceIndexes.forEach(
    (
      originalSourceIndex,
      matrixSourceIndex
    ) => {
      routedPlaceIndexes.forEach(
        (
          originalTargetIndex,
          matrixTargetIndex
        ) => {
          const route =
            placeMatrix[
              matrixSourceIndex
            ]?.[matrixTargetIndex];

          betweenPlaces[
            originalSourceIndex
          ][originalTargetIndex] = {
            distanceKm:
              route?.distance != null
                ? route.distance / 1000
                : undefined,

            travelTimeMinutes:
              route?.time != null
                ? route.time / 60
                : undefined,
          };
        }
      );
    }
  );

  // --------------------------------------------------
  // STEP 5: Destination routing data
  // --------------------------------------------------

  const fromDestination =
    destinationMatrix.map((route) => ({
      distanceKm:
        route?.distance != null
          ? route.distance / 1000
          : undefined,

      travelTimeMinutes:
        route?.time != null
          ? route.time / 60
          : undefined,
    }));

  return {
    ...travelData,

    places,

    routing: {
      fromDestination,
      betweenPlaces,
    },
  };
}

// --------------------------------------------------
// Route geometry
// --------------------------------------------------

export async function calculateRouteGeometry(
  waypoints: Array<{
    lat: number;
    lng: number;
  }>
): Promise<Array<[number, number]>> {
  const apiKey =
    process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Geoapify API key is missing"
    );
  }

  if (waypoints.length < 2) {
    return [];
  }

  const waypointString = waypoints
    .map(
      (point) =>
        `${point.lat},${point.lng}`
    )
    .join("|");

  const params = new URLSearchParams({
    waypoints: waypointString,
    mode: "drive",
    format: "geojson",
    apiKey,
  });

  const response = await fetchWithTimeout(
    `https://api.geoapify.com/v1/routing?${params.toString()}`,
    undefined,
    { timeoutMs: ROUTE_TIMEOUT_MS }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      "Geoapify route geometry failed: " +
        response.status +
        " " +
        response.statusText +
        " " +
        errorText
    );
  }

  const data =
    (await response.json()) as GeoapifyRouteResponse;

  const lines =
    data.features?.[0]?.geometry
      ?.coordinates;

  if (!lines) {
    throw new Error(
      "Geoapify did not return route geometry"
    );
  }

  return lines
    .flat()
    .map(([lng, lat]) => [
      lat,
      lng,
    ]);
}