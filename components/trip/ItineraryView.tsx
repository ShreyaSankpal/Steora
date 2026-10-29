import type { CurrencyCode, Itinerary } from "@/types/trip";
import { ItineraryDayCard } from "./ItineraryDayCard";

export function ItineraryView({
  itinerary,
  currency,
  onRemoveActivity,
  onToggleCompletion,
}: {
  itinerary: Itinerary;
  currency: CurrencyCode;
  onRemoveActivity?: (id: string) => void;
  onToggleCompletion?: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {itinerary.days.map((day) => (
        <ItineraryDayCard
          key={day.date}
          day={day}
          currency={currency}
          onRemoveActivity={onRemoveActivity}
          onToggleCompletion={onToggleCompletion}
        />
      ))}
    </div>
  );
}
