"use client";

import type { HotelOption } from "@/lib/travel/hotels";

interface HotelCardProps {
  hotel: HotelOption;
  selected?: boolean;
  onSelect?: (hotel: HotelOption) => void;
}

export default function HotelCard({
  hotel,
  selected = false,
  onSelect,
}: HotelCardProps) {
  const image = hotel.images[0];

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        selected
          ? "border-green-500 ring-2 ring-green-100"
          : "border-gray-200"
      }`}
    >
      {image ? (
        <img
          src={image}
          alt={hotel.name}
          className="h-56 w-full object-cover"
        />
      ) : (
        <div className="flex h-56 items-center justify-center bg-gray-100 text-sm text-gray-500">
          Hotel image unavailable
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {hotel.name}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {hotel.propertyType
                ? hotel.propertyType.replace("_", " ")
                : "Hotel"}{" "}
              · {hotel.platform}
            </p>
          </div>

          {hotel.starRating !== undefined && (
            <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-700">
              ★ {hotel.starRating}
            </span>
          )}
        </div>

        {/* Guest rating */}
        {hotel.guestRating !== undefined && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700">
              {hotel.guestRating.toFixed(1)}
            </span>

            {hotel.reviewCount !== undefined && (
              <span className="text-gray-500">
                {hotel.reviewCount.toLocaleString()} reviews
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {hotel.address && (
          <p className="mb-4 text-sm text-gray-500">
            {hotel.address}
          </p>
        )}

        {/* Amenities */}
        {hotel.amenities &&
          hotel.amenities.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {hotel.amenities
                .slice(0, 5)
                .map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                  >
                    {amenity}
                  </span>
                ))}
            </div>
          )}

        {/* Price */}
        {hotel.price ? (
          <div className="mb-5 border-t border-gray-100 pt-4">
            {hotel.price.nightlyPrice !== undefined && (
              <p className="text-xl font-bold text-gray-900">
                {hotel.price.currency}{" "}
                {hotel.price.nightlyPrice.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  / night
                </span>
              </p>
            )}

            {hotel.price.totalPrice !== undefined && (
              <p className="mt-1 text-sm text-gray-500">
                Total: {hotel.price.currency}{" "}
                {hotel.price.totalPrice.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
                {hotel.price.nights
                  ? ` · ${hotel.price.nights} nights`
                  : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="mb-5 text-sm text-gray-500">
            Price unavailable
          </p>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(hotel)}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "bg-green-600 text-white"
                  : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              {selected ? "✓ Hotel selected" : "Select this hotel"}
            </button>
          )}

          {hotel.url && (
            <a
              href={hotel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
            >
              View on Google Hotels
            </a>
          )}
        </div>
      </div>
    </article>
  );
}