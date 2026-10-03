"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PACE_OPTIONS } from "@/lib/constants";
import { emptyTripRequest } from "@/lib/trip-session";
import type { DailyPace, TripRequest } from "@/types/trip";
import { BudgetInput } from "./BudgetInput";
import { DateRangeInput } from "./DateRangeInput";
import { DestinationInput } from "./DestinationInput";
import { InterestSelector } from "./InterestSelector";
import { TravelStyleSelector } from "./TravelStyleSelector";

export function TripPlanner() {
  const router = useRouter();
  const [request, setRequest] = useState<TripRequest>(emptyTripRequest);
  const [error, setError] = useState<string | null>(null);

  function update(partial: Partial<TripRequest>) {
    setRequest((current) => ({ ...current, ...partial }));
  }

  async function onSubmit(event: FormEvent) {
  event.preventDefault();

  if (!request.destination.query.trim()) {
    setError("Add a destination.");
    return;
  }

  if (!request.startDate || !request.endDate) {
    setError("Choose start and end dates.");
    return;
  }

  if (request.endDate < request.startDate) {
    setError("End date must be on or after the start date.");
    return;
  }
  

  if (request.travelers < 1) {
    setError("There must be at least one traveler.");
    return;
  }

  if (request.budget <= 0) {
    setError("Enter a budget greater than zero.");
    return;
  }

  if (request.interests.length === 0) {
    setError(
      "Select at least one interest so constraints have something to match."
    );
    return;
  }

  setError(null);

  const resolved: TripRequest = {
    ...request,
    destination: {
      ...request.destination,
      query: request.destination.query.trim(),
      resolution:
        request.destination.resolution === "resolved"
          ? "resolved"
          : "suggested",
    },
  };

  try {
    const response = await fetch("/api/travel-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: resolved,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create travel plan.");
    }

    console.log("TRAVEL PLAN API RESPONSE:", data);

    const id = data.trip.id;

sessionStorage.setItem(
  `stayora.trip.${id}`,
  JSON.stringify(data.trip)
);

router.push(`/plan/loading?tripId=${id}`);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong while planning the trip."
    );
  }
}

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
        <h2 className="font-display text-2xl">Requirements</h2>
        <p className="mt-2 text-sm text-ink-muted">
          This object is a <code>TripRequest</code>. It is ready to POST to{" "}
          <code>/api/travel-plan</code> once that route exists. Nothing is sent
          yet.
        </p>
        <div className="mt-6 space-y-6">
          <DestinationInput
            value={request.destination}
            onChange={(destination) => update({ destination })}
          />
          <DateRangeInput
            startDate={request.startDate}
            endDate={request.endDate}
            onChange={(range) => update(range)}
          />
          <div>
            <label htmlFor="travelers" className="text-sm font-medium">
              Travelers
            </label>
            <input
              id="travelers"
              type="number"
              min={1}
              max={20}
              value={request.travelers}
              onChange={(event) =>
                update({ travelers: Number(event.target.value) })
              }
              className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2 sm:max-w-40"
            />
          </div>
          <BudgetInput
            budget={request.budget}
            currency={request.currency}
            onChange={update}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
        <InterestSelector
          value={request.interests}
          onChange={(interests) => update({ interests })}
        />
        <div className="mt-8">
          <TravelStyleSelector
            value={request.travelStyle}
            onChange={(travelStyle) => update({ travelStyle })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Pace and time constraints</h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Preferred daily pace</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {PACE_OPTIONS.map((option) => {
              const selected = request.dailyPace === option.value;
              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-3 ${
                    selected
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-paper"
                  }`}
                >
                  <input
                    type="radio"
                    name="dailyPace"
                    className="sr-only"
                    checked={selected}
                    onChange={() =>
                      update({ dailyPace: option.value as DailyPace })
                    }
                  />
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-6">
          <label htmlFor="maxTravelTime" className="text-sm font-medium">
            Maximum preferred travel time between activities
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="maxTravelTime"
              type="range"
              min={10}
              max={90}
              step={5}
              value={request.maxTravelTimeMinutes}
              onChange={(event) =>
                update({ maxTravelTimeMinutes: Number(event.target.value) })
              }
              className="w-full accent-accent"
            />
            <span className="w-16 text-sm tabular-nums">
              {request.maxTravelTimeMinutes} min
            </span>
          </div>
        </div>
        <div className="mt-6">
          <label htmlFor="preferences" className="text-sm font-medium">
            Additional preferences
          </label>
          <textarea
            id="preferences"
            rows={4}
            value={request.additionalPreferences}
            onChange={(event) =>
              update({ additionalPreferences: event.target.value })
            }
            placeholder="Walkable areas, dietary needs, avoid late nights…"
            className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          />
        </div>
      </section>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover sm:w-auto"
      >
        Run planning pipeline
      </button>
    </form>
  );
}
