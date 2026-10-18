"use client";

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
}: HotelResultsProps) {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold">
        Hotel search temporarily paused
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Hotel searches are temporarily disabled to preserve
        API credits. Your trip planning remains available.
      </p>
    </section>
  );
}