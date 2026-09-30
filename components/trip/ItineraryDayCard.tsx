import { formatLongDate } from "@/lib/format";
import type {
  CurrencyCode,
  DaySegment,
  ItineraryDay,
} from "@/types/trip";
import { ActivityCard } from "./ActivityCard";
import { WeatherCard } from "./WeatherCard";

const SEGMENTS: {
  key: DaySegment;
  label: string;
  description: string;
}[] = [
  {
    key: "morning",
    label: "Morning",
    description: "Start your day",
  },
  {
    key: "afternoon",
    label: "Afternoon",
    description: "Explore & experience",
  },
  {
    key: "evening",
    label: "Evening",
    description: "Wind down",
  },
];

export function ItineraryDayCard({
  day,
  currency,
}: {
  day: ItineraryDay;
  currency: CurrencyCode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-paper-raised shadow-sm">
      {/* Day header */}
      <div className="border-b border-line bg-gradient-to-r from-accent-soft/50 via-paper-raised to-paper-raised p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Day number */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white shadow-sm">
              {day.dayNumber}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Day {day.dayNumber}
              </p>

              <h3 className="mt-1 font-display text-2xl tracking-tight text-ink sm:text-3xl">
                {formatLongDate(day.date)}
              </h3>

              <p className="mt-1 text-sm text-ink-muted">
                Your activities for today
              </p>
            </div>
          </div>

          {/* Weather */}
          {day.weather ? (
            <div className="shrink-0">
              <WeatherCard
                weather={day.weather}
                compact
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-5 sm:p-6">
        <div className="space-y-8">
          {SEGMENTS.map((segment, segmentIndex) => {
            const activities =
              day.segments[segment.key];

            return (
              <div key={segment.key} className="relative">
                {/* Segment heading */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-accent">
                    {segmentIndex + 1}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      {segment.label}
                    </h4>

                    <p className="text-xs text-ink-muted">
                      {segment.description}
                    </p>
                  </div>

                  <div className="h-px flex-1 bg-line" />
                </div>

                {/* Activities */}
                {activities.length > 0 ? (
                  <div className="relative ml-4 border-l-2 border-accent-soft pl-6">
                    <div className="space-y-4">
                      {activities.map(
                        (activity, index) => (
                          <div
                            key={
                              activity.id ||
                              `${segment.key}-${index}`
                            }
                            className="relative"
                          >
                            {/* Timeline dot */}
                            <span className="absolute -left-[33px] top-5 h-3 w-3 rounded-full border-2 border-white bg-accent shadow-sm ring-4 ring-accent-soft" />

                            <ActivityCard
                              activity={activity}
                              currency={currency}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ml-12 rounded-2xl border border-dashed border-line bg-paper p-4 text-sm text-ink-muted">
                    No activities planned for this time.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}