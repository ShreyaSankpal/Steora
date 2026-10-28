import { calculateBudgetBreakdown } from "@/lib/travel/budget";
import { generateItinerary } from "@/lib/ai/itinerary";
import { rankPlaces } from "@/lib/travel/filter";
import {
  calculateTravelTimes,
  calculateRouteGeometry,
} from "@/lib/travel/routing";
import { evaluateConstraints } from "@/lib/travel/constraints";
import { normalizeTravelData } from "@/lib/travel/normalizer";
import { getWeather } from "@/lib/weather/weather";
import { getPlaces } from "@/lib/places/places";
import { geocodeDestination } from "@/lib/location/geocoding";

import type {
  ConstraintResult,
  ConstraintStatus,
  TravelPlanApiRequest,
  TravelPlanApiResponse,
} from "@/types/trip";

import {
  validateTravelPlanRequest,
  type ValidationErrorCode,
} from "@/lib/validation/travel-plan";

type ErrorCode =
  | ValidationErrorCode
  | "DESTINATION_NOT_FOUND"
  | "INTERNAL_ERROR";

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number
): Response {
  return Response.json({ error: message, code }, { status });
}

/*
 * Maximum accepted request body size, in bytes.
 *
 * A trip request is small (a few hundred fields at most),
 * so 1 MB is generous while still bounding memory use.
 */
const MAX_REQUEST_BODY_BYTES = 1_000_000;

/*
 * Reads the request body in a bounded way.
 *
 * - Content-Type is checked first: only application/json is
 *   accepted. A missing content-type is tolerated because some
 *   clients omit it, but any other declared type is rejected
 *   with 415 before any bytes are read.
 * - Content-Length is used only as an early-rejection hint.
 *   The real limit is enforced while streaming, so a client
 *   cannot bypass it by lying about Content-Length.
 * - The body is read exactly once and returned as parsed JSON,
 *   ready for the runtime validator.
 */
async function readBoundedJsonBody(
  request: Request
): Promise<
  | { ok: true; body: unknown }
  | {
      ok: false;
      error: string;
      code: ErrorCode;
      status: number;
    }
> {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return {
      ok: false,
      error:
        "Unsupported content type. Only application/json is accepted.",
      code: "UNSUPPORTED_MEDIA_TYPE",
      status: 415,
    };
  }

  const contentLengthHeader = request.headers.get(
    "content-length"
  );

  if (contentLengthHeader) {
    const declaredSize = Number(contentLengthHeader);

    if (
      Number.isFinite(declaredSize) &&
      declaredSize > MAX_REQUEST_BODY_BYTES
    ) {
      return {
        ok: false,
        error: `Request body exceeds the maximum allowed size of ${MAX_REQUEST_BODY_BYTES} bytes.`,
        code: "BODY_TOO_LARGE",
        status: 413,
      };
    }
  }

  const reader = request.body?.getReader();

  if (!reader) {
    return {
      ok: false,
      error:
        "The request was malformed. Please check your inputs and try again.",
      code: "INVALID_REQUEST",
      status: 400,
    };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let oversized = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        oversized = true;
        break;
      }

      chunks.push(value);
    }
  } catch {
    return {
      ok: false,
      error:
        "The request was malformed. Please check your inputs and try again.",
      code: "INVALID_REQUEST",
      status: 400,
    };
  } finally {
    reader.releaseLock();
  }

  if (oversized) {
    return {
      ok: false,
      error: `Request body exceeds the maximum allowed size of ${MAX_REQUEST_BODY_BYTES} bytes.`,
      code: "BODY_TOO_LARGE",
      status: 413,
    };
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      error:
        "The request was malformed. Please check your inputs and try again.",
      code: "INVALID_REQUEST",
      status: 400,
    };
  }

  const text = new TextDecoder().decode(
    chunks.length === 1
      ? chunks[0]
      : concatUint8Arrays(chunks)
  );

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      error:
        "The request was malformed. Please check your inputs and try again.",
      code: "INVALID_REQUEST",
      status: 400,
    };
  }
}

function concatUint8Arrays(
  chunks: readonly Uint8Array[]
): Uint8Array {
  const total = chunks.reduce(
    (sum, chunk) => sum + chunk.byteLength,
    0
  );
  const result = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}

export async function POST(
  request: Request
): Promise<Response> {
  const bodyResult = await readBoundedJsonBody(request);

  if (!bodyResult.ok) {
    return errorResponse(
      bodyResult.error,
      bodyResult.code,
      bodyResult.status
    );
  }

  const body = bodyResult.body as TravelPlanApiRequest;

  const validation = validateTravelPlanRequest(body);

  if (!validation.ok || !validation.value) {
    const first = validation.errors[0] ?? {
      code: "INVALID_REQUEST",
      message:
        "The request was malformed. Please check your inputs and try again.",
    };
    return errorResponse(first.message, first.code, 400);
  }

  const validatedBody = validation.value;

  try {
    const destinationQuery =
      validatedBody.request.destination.query.trim();

    if (!destinationQuery) {
      return errorResponse(
        "Destination is required",
        "INVALID_REQUEST",
        400
      );
    }

  console.log("STEP 1: Starting geocoding");

    const location =
      await geocodeDestination(destinationQuery);

    console.log("STEP 1: Geocoding completed");
  if (!location) {
    return errorResponse(
      `Could not find destination: ${destinationQuery}`,
      "DESTINATION_NOT_FOUND",
      404
    );
  }

  console.log("STEP 2: Starting weather");

const weather = await getWeather(
  location.latitude,
  location.longitude,
  validatedBody.request.startDate,
  validatedBody.request.endDate
);

console.log("STEP 2: Weather completed");

  console.log("STEP 3: Starting places");

const places = await getPlaces(
  location.latitude,
  location.longitude
);

console.log("STEP 3: Places completed");

  const normalizedData = normalizeTravelData(
    location,
    weather,
    places
  );

  console.log("STEP 4: Starting routing");

const travelDataWithRoutes =
  await calculateTravelTimes(normalizedData);

console.log("STEP 4: Routing completed");
  /*
   * Step 1:
   * Rank places instead of silently removing them.
   *
   * User preferences such as maximum travel time
   * influence ranking but do not automatically
   * remove a place.
   */
  const rankedPlaces = rankPlaces(
    validatedBody.request,
    travelDataWithRoutes.places
  );

  /*
   * Step 2:
   * Check constraints that can be evaluated
   * before generating the itinerary.
   */
  const feasibility = evaluateConstraints(
    validatedBody.request,
    {
      ...travelDataWithRoutes,
      places: rankedPlaces,
    }
  );

  /*
   * Step 3:
   * Generate the AI itinerary using the ranked
   * real places.
   */
console.log(
    "STEP 5: Starting Gemini"
  );

  const aiPlan = await generateItinerary({
    request: validatedBody.request,
    weather: travelDataWithRoutes.weather,
    eligiblePlaces: rankedPlaces,
    routing: travelDataWithRoutes.routing,
  });
  console.log("STEP 5: Gemini completed");

  /*
   * Step 4:
   * Calculate route geometry for each day.
   */
  const routeGeometryByDay = await Promise.all(
    aiPlan.itinerary.days.map(async (day) => {
      const points = getDayRoutePoints(
        day,
        travelDataWithRoutes.destination
      );

      if (points.length < 2) {
        return [];
      }

      return calculateRouteGeometry(points);
    })
  );

  /*
   * Step 5:
   * Calculate the verified cost of the generated
   * itinerary.
   */
  const budgetBreakdown =
    calculateBudgetBreakdown(
      validatedBody.request,
      aiPlan.itinerary
    );

  const itineraryWithRoutes = {
    ...aiPlan.itinerary,

    days: aiPlan.itinerary.days.map(
      (day, index) => ({
        ...day,
        routeGeometry:
          routeGeometryByDay[index],
      })
    ),
  };

  /*
   * Step 6:
   * Validate the final known budget.
   */
  const budgetCheck = checkFinalBudget(
    validatedBody.request.budget,
    budgetBreakdown.estimatedTotal,
    budgetBreakdown.verifiedTotal,
    budgetBreakdown.isComplete,
    validatedBody.request.currency
  );

  const finalChecks =
    feasibility.checks.filter(
      (check) => check.id !== "overall"
    );

  const existingBudgetIndex =
    finalChecks.findIndex(
      (check) => check.id === "budget"
    );

  if (existingBudgetIndex !== -1) {
    finalChecks[existingBudgetIndex] =
      budgetCheck;
  } else {
    finalChecks.push(budgetCheck);
  }

  const finalOverall =
    getOverallStatus(finalChecks);

  finalChecks.push({
    id: "overall",
    label: "Overall feasibility",
    status: finalOverall,
    summary:
      getOverallSummary(finalOverall),
  });

  const finalFeasibility = {
    overall: finalOverall,
    checks: finalChecks,
  };

  /*
   * Keep the ranked real places in the resolved
   * request so the frontend can access them.
   */
  const resolvedRequest = {
    ...validatedBody.request,
    destination:
      travelDataWithRoutes.destination,
    weather:
      travelDataWithRoutes.weather,
    places: rankedPlaces,
  };

  const now =
    new Date().toISOString();

  const trip: TravelPlanApiResponse["trip"] = {
    id: crypto.randomUUID(),

    status:
      finalFeasibility.overall ===
      "needs_replanning"
        ? "needs_replanning"
        : finalFeasibility.overall ===
            "warning"
          ? "warning"
          : "valid",

    createdAt: now,
    updatedAt: now,

    request: resolvedRequest,
    feasibility: finalFeasibility,
    itinerary: itineraryWithRoutes,
    budgetBreakdown,
  };

  return Response.json({ trip });
  } catch {
    /*
     * Any unexpected failure in the trip-generation pipeline is
     * reported generically as INTERNAL_ERROR (500). We deliberately do
     * not inspect the thrown error here: whether the underlying cause is
     * a downstream JSON parse, a provider failure, a configuration
     * problem, or a bug, it is surfaced the same way so that no
     * internal detail, stack trace, or provider body ever reaches the
     * client.
     */
    console.error("Travel plan failed.", {
      code: "INTERNAL_ERROR",
    });

    return errorResponse(
      "We couldn't complete your trip plan. Please try again later.",
      "INTERNAL_ERROR",
      500
    );
  }
}

function getDayRoutePoints(
  day: {
    segments: {
      morning: Array<{
        coordinates?: {
          lat: number;
          lng: number;
        };
      }>;

      afternoon: Array<{
        coordinates?: {
          lat: number;
          lng: number;
        };
      }>;

      evening: Array<{
        coordinates?: {
          lat: number;
          lng: number;
        };
      }>;
    };
  },

  destination: {
    coordinates?: {
      lat: number;
      lng: number;
    };
  }
): Array<{
  lat: number;
  lng: number;
}> {
  const points: Array<{
    lat: number;
    lng: number;
  }> = [];

  if (destination.coordinates) {
    points.push(destination.coordinates);
  }

  const segments = [
    day.segments.morning,
    day.segments.afternoon,
    day.segments.evening,
  ];

  segments.forEach((activities) => {
    activities.forEach((activity) => {
      if (activity.coordinates) {
        points.push(activity.coordinates);
      }
    });
  });

  return points;
}

function checkFinalBudget(
  budget: number,
  estimatedTotal: number | null,
  verifiedTotal: number,
  isComplete: boolean,
  currency: string
): ConstraintResult {
  if (budget <= 0) {
    return {
      id: "budget",
      label: "Budget",
      status: "needs_replanning",
      summary:
        "The trip budget must be greater than zero.",
    };
  }

  if (!isComplete) {
    return {
      id: "budget",
      label: "Budget",
      status: "warning",
      summary:
        `Steora has verified ${currency} ${verifiedTotal} ` +
        `of trip costs, but some prices are unavailable. ` +
        `The complete trip cost cannot be calculated yet.`,
    };
  }

  if (
    estimatedTotal !== null &&
    estimatedTotal > budget
  ) {
    return {
      id: "budget",
      label: "Budget",
      status: "needs_replanning",
      summary:
        `The verified trip cost is ${currency} ${estimatedTotal}, ` +
        `which exceeds your ${currency} ${budget} budget.`,
    };
  }

  return {
    id: "budget",
    label: "Budget",
    status: "valid",
    summary:
      `The verified trip cost of ${currency} ${estimatedTotal ?? 0} ` +
      `is within your ${currency} ${budget} budget.`,
  };
}

function getOverallStatus(
  checks: ConstraintResult[]
): ConstraintStatus {
  if (
    checks.some(
      (check) =>
        check.status === "needs_replanning"
    )
  ) {
    return "needs_replanning";
  }

  if (
    checks.some(
      (check) =>
        check.status === "warning"
    )
  ) {
    return "warning";
  }

  return "valid";
}

function getOverallSummary(
  status: ConstraintStatus
): string {
  if (status === "needs_replanning") {
    return "One or more constraints require changes before planning can continue.";
  }

  if (status === "warning") {
    return "The trip can continue, but some places do not satisfy all travel preferences.";
  }

  return "The available trip constraints are currently satisfied.";
}
