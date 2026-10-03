"use client";

import { useState } from "react";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { Trip } from "@/types/trip";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function TripHeader({ trip }: { trip: Trip }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const destination =
    trip.request.destination.name ||
    trip.request.destination.query;

  function handleSave() {
    localStorage.setItem(
      `steora.saved-trip.${trip.id}`,
      JSON.stringify(trip)
    );

    setSaved(true);
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      console.error("Failed to copy trip link.");
    }
  }

  return (
    <header className="overflow-hidden rounded-3xl border border-line bg-paper-raised shadow-sm">
      <div className="relative p-6 sm:p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-accent via-cyan to-accent" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Your trip
              </p>

              <StatusBadge status={trip.status} />
            </div>

            <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
              {destination}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
              <span>
                {formatDateRange(
                  trip.request.startDate,
                  trip.request.endDate
                )}
              </span>

              <span className="hidden text-line sm:inline">
                •
              </span>

              <span>
                {trip.request.travelers}{" "}
                {trip.request.travelers === 1
                  ? "traveler"
                  : "travelers"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              {saved ? "✓ Trip saved" : "Save trip"}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              {copied ? "✓ Link copied" : "Share trip"}
            </button>

            <button
              type="button"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
            >
              ✦ Change trip
            </button>
          </div>
        </div>

        {/* Trip details */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-accent/15 bg-accent-soft/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Budget
            </p>

            <p className="mt-2 text-lg font-semibold text-ink">
              {formatMoney(
                trip.request.budget,
                trip.request.currency
              )}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Total trip budget
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Travelers
            </p>

            <p className="mt-2 text-lg font-semibold text-ink">
              {trip.request.travelers}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              {trip.request.travelers === 1
                ? "Person"
                : "People"}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Travel style
            </p>

            <p className="mt-2 text-lg font-semibold capitalize text-ink">
              {trip.request.travelStyle.replace("-", " ")}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Your preferred style
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Daily pace
            </p>

            <p className="mt-2 text-lg font-semibold capitalize text-ink">
              {trip.request.dailyPace}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Activities per day
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}