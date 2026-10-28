
import type { TravelPlanApiRequest } from "@/types/trip";
import type {
  CurrencyCode,
  DailyPace,
  Interest,
  TravelStyle,
} from "@/types/trip";

export type ValidationErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_DESTINATION"
  | "INVALID_DATES"
  | "INVALID_TRAVELERS"
  | "INVALID_BUDGET"
  | "INVALID_CURRENCY"
  | "INVALID_INTERESTS"
  | "INVALID_TRAVEL_STYLE"
  | "INVALID_PACE"
  | "INVALID_MAX_TRAVEL_TIME"
  | "INVALID_PREFERENCES"
  | "INVALID_COORDINATES"
  | "UNKNOWN_FIELD"
  | "BODY_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  value?: TravelPlanApiRequest;
}

const MAX_DESTINATION_QUERY_LENGTH = 120;
const MAX_ADDITIONAL_PREFERENCES_LENGTH = 500;
const MAX_TRIP_DURATION_DAYS = 14;
const MIN_TRAVELERS = 1;
const MAX_TRAVELERS = 20;
const MIN_BUDGET = 1;
const MAX_BUDGET = 1_000_000_000;
const MIN_MAX_TRAVEL_TIME_MINUTES = 5;
const MAX_MAX_TRAVEL_TIME_MINUTES = 720;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

const ALLOWED_CURRENCIES: readonly CurrencyCode[] = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "AUD",
  "CAD",
];

const ALLOWED_INTERESTS: readonly Interest[] = [
  "nature",
  "food",
  "history",
  "culture",
  "adventure",
  "shopping",
  "nightlife",
  "art",
  "beaches",
  "photography",
];

const ALLOWED_TRAVEL_STYLES: readonly TravelStyle[] = [
  "relaxed",
  "balanced",
  "fast-paced",
  "luxury",
  "budget",
  "adventure",
];

const ALLOWED_DAILY_PACES: readonly DailyPace[] = ["slow", "moderate", "packed"];

const TOP_LEVEL_ALLOWED_KEYS = new Set(["request"]);
const TRIP_REQUEST_ALLOWED_KEYS = new Set([
  "destination",
  "startDate",
  "endDate",
  "travelers",
  "budget",
  "currency",
  "interests",
  "travelStyle",
  "dailyPace",
  "maxTravelTimeMinutes",
  "additionalPreferences",
  "places",
]);
const DESTINATION_ALLOWED_KEYS = new Set([
  "query",
  "name",
  "country",
  "placeId",
  "coordinates",
  "resolution",
]);

export function validateTravelPlanRequest(
  body: unknown
): ValidationResult {
  const errors: ValidationError[] = [];

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_REQUEST",
          message: "Expected a JSON object with a request field.",
        },
      ],
    };
  }

  const record = body as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!TOP_LEVEL_ALLOWED_KEYS.has(key)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Unexpected field "${key}" is not part of the request.`,
        field: key,
      });
    }
  }

  if (!("request" in record)) {
    errors.push({
      code: "INVALID_REQUEST",
      message: "request is required.",
      field: "request",
    });
    return { ok: false, errors };
  }

  const request = record.request;
  if (request === null || typeof request !== "object" || Array.isArray(request)) {
    errors.push({
      code: "INVALID_REQUEST",
      message: "request must be an object.",
      field: "request",
    });
    return { ok: false, errors };
  }

  const trip = request as Record<string, unknown>;

  for (const key of Object.keys(trip)) {
    if (!TRIP_REQUEST_ALLOWED_KEYS.has(key)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Unexpected field "${key}" is not part of the trip request.`,
        field: `request.${key}`,
      });
    }
  }

const destination = validateDestination(trip.destination, errors);

  const startDate = validateDate(trip.startDate, "request.startDate", errors);
  const endDate = validateDate(trip.endDate, "request.endDate", errors);

  if (startDate && endDate) {
    for (const error of validateDateRange(startDate, endDate)) {
      errors.push(error);
    }
  }

  validateTravelers(trip.travelers, errors);
  validateBudget(trip.budget, errors);
  validateCurrency(trip.currency, errors);
  validateInterests(trip.interests, errors);
  validateTravelStyle(trip.travelStyle, errors);
  validateDailyPace(trip.dailyPace, errors);
  validateMaxTravelTime(trip.maxTravelTimeMinutes, errors);
  validatePreferences(trip.additionalPreferences, errors);

  if (destination && destination.coordinates) {
    validateCoordinates(destination.coordinates, "request.destination.coordinates", errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const value = trip as unknown as TravelPlanApiRequest["request"];

  return {
    ok: true,
    errors: [],
    value: { request: value },
  };
}

function validateDestination(
  destination: unknown,
  errors: ValidationError[]
): { query: string; coordinates?: { lat: number; lng: number } } | null {
  if (destination === null || typeof destination !== "object" || Array.isArray(destination)) {
    errors.push({
      code: "INVALID_DESTINATION",
      message: "destination must be an object.",
      field: "request.destination",
    });
    return null;
  }

  const record = destination as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!DESTINATION_ALLOWED_KEYS.has(key)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Unexpected field "${key}" is not part of the destination.`,
        field: `request.destination.${key}`,
      });
    }
  }

  if (typeof record.query !== "string") {
    errors.push({
      code: "INVALID_DESTINATION",
      message: "destination.query must be a string.",
      field: "request.destination.query",
    });
    return null;
  }

  const query = record.query.trim();

  if (query.length === 0) {
    errors.push({
      code: "INVALID_DESTINATION",
      message: "Destination is required.",
      field: "request.destination.query",
    });
    return null;
  }

  if (query.length > MAX_DESTINATION_QUERY_LENGTH) {
    errors.push({
      code: "INVALID_DESTINATION",
      message: `Destination must be ${MAX_DESTINATION_QUERY_LENGTH} characters or fewer.`,
      field: "request.destination.query",
    });
  }

  let coordinates: { lat: number; lng: number } | undefined;

  if (record.coordinates !== undefined) {
    if (record.coordinates === null || typeof record.coordinates !== "object" || Array.isArray(record.coordinates)) {
      errors.push({
        code: "INVALID_COORDINATES",
        message: "destination.coordinates must be an object with lat and lng.",
        field: "request.destination.coordinates",
      });
    } else {
      coordinates = record.coordinates as { lat: number; lng: number };
    }
  }

  return { query, coordinates };
}


function validateDate(value: unknown, field: string, errors: ValidationError[]) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push({
      code: "INVALID_DATES",
      message: `${field} must be a non-empty date string.`,
      field,
    });
    return null;
  }

  const parsed = parseDate(value);

  if (!parsed) {
    errors.push({
      code: "INVALID_DATES",
      message: `${field} is not a valid calendar date.`,
      field,
    });
    return null;
  }

  return parsed;
}

function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}


function validateTravelers(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({
      code: "INVALID_TRAVELERS",
      message: "travelers must be a finite number.",
      field: "request.travelers",
    });
    return;
  }

  if (!Number.isInteger(value)) {
    errors.push({
      code: "INVALID_TRAVELERS",
      message: "travelers must be a whole number.",
      field: "request.travelers",
    });
    return;
  }

  if (value < MIN_TRAVELERS || value > MAX_TRAVELERS) {
    errors.push({
      code: "INVALID_TRAVELERS",
      message: `travelers must be between ${MIN_TRAVELERS} and ${MAX_TRAVELERS}.`,
      field: "request.travelers",
    });
  }
}

function validateBudget(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({
      code: "INVALID_BUDGET",
      message: "budget must be a finite number.",
      field: "request.budget",
    });
    return;
  }

  if (value < MIN_BUDGET) {
    errors.push({
      code: "INVALID_BUDGET",
      message: "budget must be greater than zero.",
      field: "request.budget",
    });
    return;
  }

  if (value > MAX_BUDGET) {
    errors.push({
      code: "INVALID_BUDGET",
      message: `budget must be ${MAX_BUDGET} or fewer.`,
      field: "request.budget",
    });
  }
}

function validateCurrency(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "string") {
    errors.push({
      code: "INVALID_CURRENCY",
      message: "currency must be a string.",
      field: "request.currency",
    });
    return;
  }

  if (!(ALLOWED_CURRENCIES as readonly string[]).includes(value)) {
    errors.push({
      code: "INVALID_CURRENCY",
      message: `currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}.`,
      field: "request.currency",
    });
  }
}

function validateInterests(value: unknown, errors: ValidationError[]) {
  if (!Array.isArray(value)) {
    errors.push({
      code: "INVALID_INTERESTS",
      message: "interests must be an array.",
      field: "request.interests",
    });
    return;
  }

  if (value.length === 0) {
    errors.push({
      code: "INVALID_INTERESTS",
      message: "Select at least one interest.",
      field: "request.interests",
    });
    return;
  }

  for (const item of value) {
    if (typeof item !== "string") {
      errors.push({
        code: "INVALID_INTERESTS",
        message: "Each interest must be a string.",
        field: "request.interests",
      });
      return;
    }

    if (!(ALLOWED_INTERESTS as readonly string[]).includes(item as Interest)) {
      errors.push({
        code: "INVALID_INTERESTS",
        message: `Unknown interest "${item}".`,
        field: "request.interests",
      });
      return;
    }
  }
}

function validateTravelStyle(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "string") {
    errors.push({
      code: "INVALID_TRAVEL_STYLE",
      message: "travelStyle must be a string.",
      field: "request.travelStyle",
    });
    return;
  }

  if (!(ALLOWED_TRAVEL_STYLES as readonly string[]).includes(value as TravelStyle)) {
    errors.push({
      code: "INVALID_TRAVEL_STYLE",
      message: `travelStyle must be one of: ${ALLOWED_TRAVEL_STYLES.join(", ")}.`,
      field: "request.travelStyle",
    });
  }
}

function validateDailyPace(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "string") {
    errors.push({
      code: "INVALID_PACE",
      message: "dailyPace must be a string.",
      field: "request.dailyPace",
    });
    return;
  }

  if (!(ALLOWED_DAILY_PACES as readonly string[]).includes(value as DailyPace)) {
    errors.push({
      code: "INVALID_PACE",
      message: `dailyPace must be one of: ${ALLOWED_DAILY_PACES.join(", ")}.`,
      field: "request.dailyPace",
    });
  }
}

function validateMaxTravelTime(value: unknown, errors: ValidationError[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({
      code: "INVALID_MAX_TRAVEL_TIME",
      message: "maxTravelTimeMinutes must be a finite number.",
      field: "request.maxTravelTimeMinutes",
    });
    return;
  }

  if (!Number.isInteger(value)) {
    errors.push({
      code: "INVALID_MAX_TRAVEL_TIME",
      message: "maxTravelTimeMinutes must be a whole number.",
      field: "request.maxTravelTimeMinutes",
    });
    return;
  }

  if (value < MIN_MAX_TRAVEL_TIME_MINUTES || value > MAX_MAX_TRAVEL_TIME_MINUTES) {
    errors.push({
      code: "INVALID_MAX_TRAVEL_TIME",
      message: `maxTravelTimeMinutes must be between ${MIN_MAX_TRAVEL_TIME_MINUTES} and ${MAX_MAX_TRAVEL_TIME_MINUTES}.`,
      field: "request.maxTravelTimeMinutes",
    });
  }
}

function validatePreferences(value: unknown, errors: ValidationError[]) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      code: "INVALID_PREFERENCES",
      message: "additionalPreferences must be a string.",
      field: "request.additionalPreferences",
    });
    return;
  }

  if (value.length > MAX_ADDITIONAL_PREFERENCES_LENGTH) {
    errors.push({
      code: "INVALID_PREFERENCES",
      message: `additionalPreferences must be ${MAX_ADDITIONAL_PREFERENCES_LENGTH} characters or fewer.`,
      field: "request.additionalPreferences",
    });
  }
}

function validateCoordinates(
  coordinates: { lat?: number; lng?: number },
  field: string,
  errors: ValidationError[]
) {
  if (typeof coordinates.lat !== "number" || !Number.isFinite(coordinates.lat)) {
    errors.push({
      code: "INVALID_COORDINATES",
      message: `${field}.lat must be a finite number.`,
      field: `${field}.lat`,
    });
  } else if (coordinates.lat < MIN_LATITUDE || coordinates.lat > MAX_LATITUDE) {
    errors.push({
      code: "INVALID_COORDINATES",
      message: `${field}.lat must be between ${MIN_LATITUDE} and ${MAX_LATITUDE}.`,
      field: `${field}.lat`,
    });
  }

  if (typeof coordinates.lng !== "number" || !Number.isFinite(coordinates.lng)) {
    errors.push({
      code: "INVALID_COORDINATES",
      message: `${field}.lng must be a finite number.`,
      field: `${field}.lng`,
    });
  } else if (coordinates.lng < MIN_LONGITUDE || coordinates.lng > MAX_LONGITUDE) {
    errors.push({
      code: "INVALID_COORDINATES",
      message: `${field}.lng must be between ${MIN_LONGITUDE} and ${MAX_LONGITUDE}.`,
      field: `${field}.lng`,
    });
  }
}


export function validateDateRange(
  startDate: Date,
  endDate: Date
): ValidationError[] {
  const errors: ValidationError[] = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start) {
    errors.push({
      code: "INVALID_DATES",
      message: "request.startDate is not a valid calendar date.",
      field: "request.startDate",
    });
  }

  if (!end) {
    errors.push({
      code: "INVALID_DATES",
      message: "request.endDate is not a valid calendar date.",
      field: "request.endDate",
    });
  }

  if (start && end) {
    if (end < start) {
      errors.push({
        code: "INVALID_DATES",
        message: "request.endDate must be on or after request.startDate.",
        field: "request.endDate",
      });
    }

    const durationDays =
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000) + 1;

    if (durationDays > MAX_TRIP_DURATION_DAYS) {
      errors.push({
        code: "INVALID_DATES",
        message: `Trips can be at most ${MAX_TRIP_DURATION_DAYS} days.`,
        field: "request.endDate",
      });
    }
  }

  return errors;
}

export function firstValidationError(
  result: ValidationResult
): ValidationError | undefined {
  return result.errors[0];
}

export function validationErrorToResponse(
  result: ValidationResult
): { status: number; body: { error: string; code: string } } {
  const first = result.errors[0];

  return {
    status: 400,
    body: {
      error: first?.message ?? "The request was invalid.",
      code: first?.code ?? "INVALID_REQUEST",
    },
  };
}
