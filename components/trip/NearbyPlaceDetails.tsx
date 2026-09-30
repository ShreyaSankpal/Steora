"use client";

import type { TravelPlace } from "@/types/trip";

interface NearbyPlaceDetailsProps {
  place: TravelPlace;
  destinationName: string;
  onClose: () => void;
}

export function NearbyPlaceDetails({
  place,
  destinationName,
  onClose,
}: NearbyPlaceDetailsProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name}, ${place.coordinates.lat}, ${place.coordinates.lng}`
  )}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    destinationName
  )}&destination=${place.coordinates.lat},${place.coordinates.lng}`;

  const hasVerifiedPrice =
    place.price !== undefined &&
    place.priceStatus === "verified";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-line bg-paper-raised shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Nearby place
            </p>

            <h2 className="mt-2 font-display text-2xl tracking-tight text-ink sm:text-3xl">
              {place.name}
            </h2>

            <p className="mt-1 text-sm capitalize text-ink-muted">
              {place.category}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close place details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-lg text-ink-muted transition hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="space-y-5 p-5 sm:p-6">
          {/* Location */}
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Location
            </p>

            <p className="mt-2 text-sm font-medium text-ink">
              {place.coordinates.lat.toFixed(5)},{" "}
              {place.coordinates.lng.toFixed(5)}
            </p>
          </div>

          {/* Travel information */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs text-ink-muted">
                Distance
              </p>

              <p className="mt-1 text-base font-semibold text-ink">
                {place.distanceFromDestinationKm !== undefined
                  ? `${place.distanceFromDestinationKm.toFixed(1)} km`
                  : "Unavailable"}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs text-ink-muted">
                Travel time
              </p>

              <p className="mt-1 text-base font-semibold text-ink">
                {place.travelTimeFromDestinationMinutes !== undefined
                  ? `${Math.round(
                      place.travelTimeFromDestinationMinutes
                    )} min`
                  : "Unavailable"}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs text-ink-muted">
              Price
            </p>

            {hasVerifiedPrice ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-semibold text-ink">
                  {place.currency} {place.price}
                </span>

                <span className="text-xs font-medium text-valid">
                  Verified price
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">
                Price unavailable
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Get route
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accent-soft"
            >
              Open in Maps
            </a>
          </div>

          {/* Provider source */}
          {place.source?.url ? (
            <div className="border-t border-line pt-4">
              <a
                href={place.source.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-ink-muted underline underline-offset-2 hover:text-accent"
              >
                View information from {place.source.name}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}