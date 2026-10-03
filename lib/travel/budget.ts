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
 * - Only verified activity prices are counted.
 * - Only the selected hotel can contribute accommodation cost.
 * - Unselected hotel options are never included.
 * - Unknown prices remain explicitly unpriced.
 * - Currency mismatches are not silently converted.
 * - estimatedTotal is null when the represented trip
 *   cost cannot be fully calculated from verified data.
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
  },
  selectedHotel?: {
    totalPrice?: number;
    currency?: string;
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

  /*
   * Accommodation is only included after the user
   * selects a hotel.
   */
  const accommodationLine =
    createAccommodationLine(
      selectedHotel,
      request.currency
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

    accommodationLine,

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

  /*
   * Count accommodation as unpriced only when a hotel
   * has actually been selected but its verified price
   * cannot be used.
   */
  const unpricedAccommodation =
    accommodationLine.unpricedItems;

  const totalUnpricedItems =
    unpricedActivities +
    unpricedAccommodation;

  /*
   * Pricing coverage represents all activities plus
   * the selected hotel, when one exists.
   */
  const totalPricedItems =
    pricedActivities.length +
    (accommodationLine.verified > 0
      ? 1
      : 0);

  const totalCostItems =
    activities.length +
    (selectedHotel ? 1 : 0);

  const pricingCoverage =
    totalCostItems === 0
      ? 100
      : Math.round(
          (totalPricedItems /
            totalCostItems) *
            100
        );

  /*
   * We only expose a complete estimatedTotal when
   * every represented cost item has a verified price.
   *
   * If no hotel has been selected, accommodation is
   * intentionally not part of the calculation yet.
   */
  const estimatedTotal =
    totalUnpricedItems === 0
      ? verifiedTotal
      : null;

  return {
    currency: request.currency,
    totalBudget: request.budget,

    verifiedTotal,
    estimatedTotal,

    pricingCoverage,
    unpricedActivities:
      totalUnpricedItems,

    isComplete:
      totalUnpricedItems === 0,

    bookedTotal: null,

    lines,
  };
}

function createAccommodationLine(
  selectedHotel:
    | {
        totalPrice?: number;
        currency?: string;
      }
    | undefined,
  tripCurrency: string
): BudgetLine {
  /*
   * No hotel selected:
   * accommodation is not included yet.
   */
  if (!selectedHotel) {
    return {
      category: "accommodation",
      verified: 0,
      unpricedItems: 0,
      booked: null,
    };
  }

  /*
   * A hotel was selected but there is no verified
   * total price.
   */
  if (
    selectedHotel.totalPrice === undefined ||
    !selectedHotel.currency
  ) {
    return {
      category: "accommodation",
      verified: 0,
      unpricedItems: 1,
      booked: null,
    };
  }

  /*
   * Never add different currencies together without
   * an explicit currency conversion.
   */
  if (
    selectedHotel.currency !==
    tripCurrency
  ) {
    return {
      category: "accommodation",
      verified: 0,
      unpricedItems: 1,
      booked: null,
    };
  }

  return {
    category: "accommodation",
    verified:
      selectedHotel.totalPrice,
    unpricedItems: 0,
    booked: null,
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