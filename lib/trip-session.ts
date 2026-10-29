import type { TripRequest } from "@/types/trip";

const STORAGE_KEY = "steora.trip-draft";

export interface TripDraft {
  id: string;
  request: TripRequest;
  createdAt: string;
}

export function createDraftId() {
  return `preview-${crypto.randomUUID().slice(0, 8)}`;
}

export function saveTripDraft(draft: TripDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function readTripDraft(): TripDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TripDraft;
  } catch {
    return null;
  }
}

export function emptyTripRequest(): TripRequest {
  return {
    destination: { query: "", resolution: "idle" },
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: 2500,
    currency: "INR",
    interests: [],
    travelStyle: "balanced",
    dailyPace: "moderate",
    maxTravelTimeMinutes: 30,
    additionalPreferences: "",
  };
}
