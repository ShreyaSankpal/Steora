import type {
  Activity,
  BudgetBreakdown,
  BudgetCategory,
  BudgetLine,
  TripRequest,
} from "@/types/trip";

/**
 * Steora budget calculation.
 *
 * Important:
 * - Never invent prices.
 * - Only verified activity costs are counted.
 * - Unknown prices remain explicitly unpriced.
 * - estimatedTotal is null when the complete trip cost
 *   cannot be calculated from verified data.
 */

export function calculateBudgetBreakdown(
  request: TripRequest,
  itinerary: {
    days: Array<{
      segments: {
        morning: Activity[];
        afternoon: Activity[];
        evening: Activity[];
      };
    }>;
  }
): BudgetBreakdown {
  const activities = itinerary.days.flatMap((day) => [
    ...day.segments.morning,
    ...day.segments.afternoon,
    ...day.segments.evening,
  ]);

  const pricedActivities = activities.filter(
    (activity) =>
      activity.cost !== undefined &&
      activity.costStatus === "verified"
  );

  const unpricedActivities = activities.filter(
    (activity) =>
      activity.cost === undefined ||
      activity.costStatus === "unavailable"
  ).length;

  const pricingCoverage =
    activities.length === 0
      ? 100
      : Math.round(
          (pricedActivities.length / activities.length) * 100
        );

  const lines: BudgetLine[] = [
    createCategoryLine(
      activities,
      "activities"
    ),

    createCategoryLine(
      activities,
      "food"
    ),

    createCategoryLine(
      activities,
      "local_transport"
    ),

    {
      category: "accommodation",
      verified: 0,
      unpricedItems: 0,
      booked: null,
    },

    {
      category: "other",
      verified: 0,
      unpricedItems: 0,
      booked: null,
    },
  ];

  const verifiedTotal = lines.reduce(
    (total, line) =>
      total + line.verified,
    0
  );

  /**
   * We only expose a complete estimatedTotal when
   * every itinerary activity has a verified price.
   *
   * Otherwise null prevents the UI from accidentally
   * presenting the verified subtotal as the full trip cost.
   */
  const estimatedTotal =
    unpricedActivities === 0
      ? verifiedTotal
      : null;

  return {
    currency: request.currency,
    totalBudget: request.budget,

    verifiedTotal,
    estimatedTotal,

    pricingCoverage,
    unpricedActivities,

    isComplete:
      unpricedActivities === 0,

    bookedTotal: null,

    lines,
  };
}

function createCategoryLine(
  activities: Activity[],
  category: BudgetCategory
): BudgetLine {
  const categoryActivities =
    activities.filter(
      (activity) =>
        getBudgetCategory(activity) ===
        category
    );

  const verified = categoryActivities
    .filter(
      (activity) =>
        activity.cost !== undefined &&
        activity.costStatus === "verified"
    )
    .reduce(
      (total, activity) =>
        total + (activity.cost ?? 0),
      0
    );

  const unpricedItems =
    categoryActivities.filter(
      (activity) =>
        activity.cost === undefined ||
        activity.costStatus ===
          "unavailable"
    ).length;

  return {
    category,
    verified,
    unpricedItems,
    booked: null,
  };
}

function getBudgetCategory(
  activity: Activity
): BudgetCategory {
  switch (activity.category) {
    case "food":
      return "food";

    case "transport":
      return "local_transport";

    case "activity":
    case "culture":
    case "nature":
      return "activities";

    case "rest":
    case "other":
    default:
      return "other";
  }
}