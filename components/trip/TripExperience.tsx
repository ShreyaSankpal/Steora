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
    const storedTrip = sessionStorage.getItem(`stayora.trip.${tripId}`);

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
    return trip.request.destination.name || trip.request.destination.query;
  }, [trip]);

  if (!trip) {
    return (
      <p className="px-4 py-16 text-sm text-ink-muted">
        Preparing trip…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <PreviewBanner>
        Trip data is currently coming from the travel planning API.
      </PreviewBanner>

      <TripHeader trip={trip} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          {trip.itinerary ? (
            <ItineraryView
              itinerary={trip.itinerary}
              currency={trip.request.currency}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          {trip.feasibility ? (
            <FeasibilityPanel feasibility={trip.feasibility} />
          ) : null}

          {trip.budgetBreakdown ? (
            <BudgetBreakdownCard breakdown={trip.budgetBreakdown} />
          ) : null}

          <section className="space-y-3 rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="text-lg font-semibold">Weather</h2>

            <div className="grid gap-3">
              {trip.weather?.map((item) => (
                <WeatherCard key={item.date} weather={item} />
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="text-lg font-semibold">Nearby Places</h2>

            <div className="space-y-3">
              {trip.request.places?.map((place) => (
                <div
                  key={place.name}
                  className="rounded-xl border border-line p-3"
                >
                  <p className="font-medium">{place.name}</p>

                  <p className="text-sm text-ink-muted">
                    {place.distanceFromDestinationKm?.toFixed(2)} km ·{" "}
                    {place.travelTimeFromDestinationMinutes?.toFixed(0)} min
                  </p>
                </div>
              ))}
            </div>
          </section>

          <MapPlaceholder
            destination={{
              name: destinationName,
              coordinates: trip.request.destination.coordinates,
            }}
            itinerary={trip.itinerary}
          />

          <ReplanPanel tripId={trip.id} request={trip.request} />
        </div>
      </div>
      <HotelResults
        location={destinationName}
        checkIn={trip.request.startDate}
        checkOut={trip.request.endDate}
        guests={trip.request.travelers}
/>
    </div>
  );
}