"use client";

import { useEffect, useState } from "react";
import HotelCard from "./HotelCard";
import type { HotelOption } from "@/lib/travel/hotels";

interface HotelResultsProps {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  selectedHotelId?: string;
  onSelectHotel?: (hotel: HotelOption) => void;
}

export default function HotelResults({
  location,
  checkIn,
  checkOut,
  guests,
  selectedHotelId,
  onSelectHotel,
}: HotelResultsProps) {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHotels() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          location,
          checkIn,
          checkOut,
          guests: String(guests),
        });

        const response = await fetch(
          `/api/hotels?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load hotels"
          );
        }

        setHotels(data.hotels ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load hotels"
        );
      } finally {
        setLoading(false);
      }
    }

    loadHotels();
  }, [location, checkIn, checkOut, guests]);

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="mb-6 text-2xl font-bold">
          Hotels
        </h2>

        <div className="rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          Finding available hotels...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <h2 className="mb-6 text-2xl font-bold">
          Hotels
        </h2>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (hotels.length === 0) {
    return (
      <section className="py-8">
        <h2 className="mb-6 text-2xl font-bold">
          Hotels
        </h2>

        <div className="rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          No hotels were found for these dates.
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Hotels
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {hotels.length} available options
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            selected={selectedHotelId === hotel.id}
            onSelect={onSelectHotel}
          />
        ))}
      </div>
    </section>
  );
}