"use client";

import HotelResults from "@/components/hotels/HotelResults";
import { useEffect, useMemo, useState } from "react";
import type { Trip } from "@/types/trip";
import { BudgetBreakdownCard } from "./BudgetBreakdownCard";
import { FeasibilityPanel } from "./FeasibilityPanel";
import { ItineraryView } from "./ItineraryView";
import { MapPlaceholder } from "./MapPlaceholder";
import { ReplanPanel } from "./ReplanPanel";
import { TripHeader } from "./TripHeader";
import { WeatherCard } from "./WeatherCard";
import { PreviewBanner } from "@/components/ui/PreviewBanner";

export function TripExperience({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const storedTrip = sessionStorage.getItem(
      `stayora.trip.${tripId}`
    );

    if (!storedTrip) {
      return;
    }

    try {
      const parsedTrip = JSON.parse(storedTrip) as Trip;
      setTrip(parsedTrip);
    } catch {
      console.error("Failed to read stored trip.");
    }
  }, [tripId]);

  const destinationName = useMemo(() => {
    if (!trip) return "";

    return (
      trip.request.destination.name ||
      trip.request.destination.query
    );
  }, [trip]);

  if (!trip) {
    return (
      <p className="px-4 py-16 text-sm text-ink-muted">
        Preparing trip…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Preview notice */}
      <PreviewBanner>
        Trip data is currently coming from the travel planning API.
      </PreviewBanner>

      {/* Trip header */}
      <TripHeader trip={trip} />

      {/* =========================================
          MAIN TRIP WORKSPACE
          ========================================= */}
      <section>
        <div className="mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Plan your days
            </p>

            <h2 className="mt-1 font-display text-3xl tracking-tight text-ink">
              Your {destinationName} itinerary
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Explore your activities and routes together.
              Your itinerary and map stay connected in one workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:items-start">
          {/* LEFT — ITINERARY */}
          <div className="min-w-0">
            <div className="rounded-3xl border border-line bg-paper-raised p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Day-by-day plan
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    Activities organized around your preferences
                  </p>
                </div>

                {trip.itinerary ? (
                  <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
                    {trip.itinerary.days.length}{" "}
                    {trip.itinerary.days.length === 1
                      ? "day"
                      : "days"}
                  </span>
                ) : null}
              </div>

              {trip.itinerary ? (
                <ItineraryView
                  itinerary={trip.itinerary}
                  currency={trip.request.currency}
                />
              ) : (
                <div className="rounded-2xl border border-line bg-paper p-6 text-sm text-ink-muted">
                  No itinerary available.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — MAP */}
          <div className="min-w-0 lg:sticky lg:top-6">
            <MapPlaceholder
              destination={{
                name: destinationName,
                coordinates:
                  trip.request.destination.coordinates,
              }}
              itinerary={trip.itinerary}
            />
          </div>
        </div>
      </section>

      {/* =========================================
          NEARBY PLACES
          ========================================= */}
      <section className="overflow-hidden rounded-3xl border border-line bg-paper-raised p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Explore
            </p>

            <h2 className="mt-1 font-display text-2xl text-ink">
              Nearby places
            </h2>

            <p className="mt-1 text-sm text-ink-muted">
              Discover real places around your destination.
            </p>
          </div>

          {trip.request.places &&
          trip.request.places.length > 0 ? (
            <span className="w-fit rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
              {trip.request.places.length} places
            </span>
          ) : null}
        </div>

        {trip.request.places &&
        trip.request.places.length > 0 ? (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {trip.request.places.map((place) => (
              <div
                key={place.name}
                className="group min-w-[240px] max-w-[280px] shrink-0 rounded-2xl border border-line bg-paper p-4 transition duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 font-semibold text-ink">
                    {place.name}
                  </p>

                  <span className="mt-0.5 shrink-0 text-accent opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="text-sm text-ink-muted">
                    {place.distanceFromDestinationKm !==
                    undefined
                      ? `${place.distanceFromDestinationKm.toFixed(
                          1
                        )} km away`
                      : "Distance unavailable"}
                  </p>

                  <p className="text-sm text-ink-muted">
                    {place.travelTimeFromDestinationMinutes !==
                    undefined
                      ? `${place.travelTimeFromDestinationMinutes.toFixed(
                          0
                        )} min travel`
                      : "Travel time unavailable"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-paper p-5 text-sm text-ink-muted">
            No nearby places available.
          </p>
        )}
      </section>

      {/* =========================================
          TRIP INSIGHTS
          ========================================= */}
      <section className="grid gap-6 lg:grid-cols-2">
        {trip.feasibility ? (
          <FeasibilityPanel
            feasibility={trip.feasibility}
          />
        ) : null}

        {trip.budgetBreakdown ? (
          <BudgetBreakdownCard
            breakdown={trip.budgetBreakdown}
          />
        ) : null}
      </section>

      {/* =========================================
          WEATHER
          ========================================= */}
      <section className="rounded-3xl border border-line bg-paper-raised p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Conditions
          </p>

          <h2 className="mt-1 font-display text-2xl text-ink">
            Weather during your trip
          </h2>

          <p className="mt-1 text-sm text-ink-muted">
            Weather information for your travel dates.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trip.weather?.map((item) => (
            <WeatherCard
              key={item.date}
              weather={item}
            />
          ))}
        </div>
      </section>

      {/* =========================================
          REPLAN
          ========================================= */}
      <ReplanPanel
        tripId={trip.id}
        request={trip.request}
      />

      {/* =========================================
          HOTELS
          ========================================= */}
      <section className="rounded-3xl border border-line bg-paper-raised p-5 shadow-sm sm:p-6">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Stay
          </p>

          <h2 className="mt-1 font-display text-2xl text-ink">
            Find your hotel
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Compare real hotel prices, ratings, amenities,
            and photos before choosing where to stay.
          </p>
        </div>

        <HotelResults
          location={destinationName}
          checkIn={trip.request.startDate}
          checkOut={trip.request.endDate}
          guests={trip.request.travelers}
        />
      </section>
    </div>
  );
}
