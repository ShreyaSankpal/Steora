import type {
  Activity,
  Itinerary,
  SavedTripSummary,
  Trip,
} from "@/types/trip";

function createActivity(
  activity: Omit<Activity, "costStatus">
): Activity {
  return {
    ...activity,
    costStatus: "unavailable",
  };
}

const previewItinerary: Itinerary = {
  days: [
    {
      dayNumber: 1,
      date: "2026-01-01",

      segments: {
        morning: [
          createActivity({
            id: "preview-1",
            name: "Sample destination activity",
            category: "activity",
            locationName: "Destination",
            startTime: "09:00",
            durationMinutes: 120,
            reasons: [],
          }),
        ],

        afternoon: [],

        evening: [],
      },
    },
  ],
};

export const previewTrip: Trip = {
  id: "preview-trip",

  status: "draft",

  createdAt:
    new Date().toISOString(),

  updatedAt:
    new Date().toISOString(),

  request: {
    destination: {
      query: "Preview",
      name: "Preview",
      resolution: "suggested",
    },

    startDate: "2026-01-01",
    endDate: "2026-01-02",

    travelers: 1,

    budget: 0,

    currency: "INR",

    interests: [],

    travelStyle: "balanced",

    dailyPace: "moderate",

    maxTravelTimeMinutes: 60,

    additionalPreferences: "",
  },

  itinerary: previewItinerary,

  budgetBreakdown: {
    currency: "INR",

    totalBudget: 0,

    /*
     * No real price is available for the
     * preview activity.
     */
    verifiedTotal: 0,

    /*
     * null means Steora cannot honestly
     * calculate the complete trip cost.
     */
    estimatedTotal: null,

    pricingCoverage: 0,

    unpricedActivities: 1,

    isComplete: false,

    bookedTotal: null,

    lines: [
      {
        category: "activities",
        verified: 0,
        unpricedItems: 1,
        booked: null,
      },

      {
        category: "food",
        verified: 0,
        unpricedItems: 0,
        booked: null,
      },

      {
        category: "local_transport",
        verified: 0,
        unpricedItems: 0,
        booked: null,
      },

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
    ],
  },
};

export const PREVIEW_SAVED_TRIPS: SavedTripSummary[] = [];