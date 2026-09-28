"use client";

import type { HotelOption } from "@/lib/travel/hotels";

interface HotelCardProps {
  hotel: HotelOption;
}

export default function HotelCard({
  hotel,
}: HotelCardProps) {
  const image = hotel.images[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {image ? (
        <img
          src={image}
          alt={hotel.name}
          className="h-56 w-full object-cover"
        />
      ) : (
        <div className="flex h-56 items-center justify-center bg-gray-100 text-sm text-gray-500">
          Image unavailable
        </div>
      )}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {hotel.name}
            </h3>

            <p className="mt-1 text-sm capitalize text-gray-500">
              {hotel.platform}
            </p>
          </div>

          {hotel.starRating !== undefined && (
            <span className="text-sm text-gray-600">
              ★ {hotel.starRating}
            </span>
          )}
        </div>

        {hotel.address && (
          <p className="mb-4 text-sm text-gray-500">
            {hotel.address}
          </p>
        )}

        {hotel.price ? (
          <div className="mb-5">
            {hotel.price.nightlyPrice !== undefined && (
              <p className="text-xl font-bold text-gray-900">
                {hotel.price.currency}{" "}
                {hotel.price.nightlyPrice.toFixed(2)}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  / night
                </span>
              </p>
            )}

            {hotel.price.totalPrice !== undefined && (
              <p className="mt-1 text-sm text-gray-500">
                {hotel.price.currency}{" "}
                {hotel.price.totalPrice.toFixed(2)}
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

        {hotel.url && (
          <a
            href={hotel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
          >
            View listing
          </a>
        )}
      </div>
    </article>
  );
}