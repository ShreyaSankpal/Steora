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

export async function POST(
  request: Request
): Promise<Response> {
  const body: TravelPlanApiRequest =
    await request.json();

  const destinationQuery =
    body.request.destination.query.trim();

  if (!destinationQuery) {
    return Response.json(
      { error: "Destination is required" },
      { status: 400 }
    );
  }

  console.log("STEP 1: Starting geocoding");

const location =
  await geocodeDestination(destinationQuery);

console.log("STEP 1: Geocoding completed");
  if (!location) {
    return Response.json(
      {
        error: `Could not find destination: ${destinationQuery}`,
      },
      { status: 404 }
    );
  }

  console.log("STEP 2: Starting weather");

const weather = await getWeather(
  location.latitude,
  location.longitude,
  body.request.startDate,
  body.request.endDate
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
    body.request,
    travelDataWithRoutes.places
  );

  /*
   * Step 2:
   * Check constraints that can be evaluated
   * before generating the itinerary.
   */
  const feasibility = evaluateConstraints(
    body.request,
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
  console.log("STEP 5: Starting Gemini");

const aiPlan = await generateItinerary({
    request: body.request,
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
      body.request,
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
  body.request.budget,
  budgetBreakdown.estimatedTotal,
  budgetBreakdown.verifiedTotal,
  budgetBreakdown.isComplete,
  body.request.currency
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
    ...body.request,
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

  console.log(
    "FINAL TRIP RESPONSE:",
    JSON.stringify(trip, null, 2)
  );

  return Response.json({ trip });
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
