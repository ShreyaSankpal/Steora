import type {
  Activity,
  CurrencyCode,
} from "@/types/trip";

interface ActivityCardProps {
  activity: Activity;
  currency: CurrencyCode;
}

const REASON_PRIORITY = [
  "matches_interests",
  "suitable_for_weather",
  "matches_travel_style",
  "fits_available_time",
  "close_to_previous",
  "fits_budget",
] as const;

export function ActivityCard({
  activity,
  currency,
}: ActivityCardProps) {
  const hasVerifiedPrice =
    activity.cost !== undefined &&
    activity.costStatus === "verified";

  const primaryReason =
    [...activity.reasons]
      .sort(
        (a, b) =>
          REASON_PRIORITY.indexOf(
            a.code as (typeof REASON_PRIORITY)[number]
          ) -
          REASON_PRIORITY.indexOf(
            b.code as (typeof REASON_PRIORITY)[number]
          )
      )[0];

  return (
    <article className="group rounded-2xl border border-line bg-paper p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              {activity.startTime}
            </span>

            <span className="text-xs text-ink-muted">
              {activity.durationMinutes} min
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-ink sm:text-lg">
            {activity.name}
          </h3>

          {activity.locationName ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <span className="text-accent">📍</span>
              <span>{activity.locationName}</span>
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          {hasVerifiedPrice ? (
            <>
              <p className="text-base font-bold text-ink">
                {currency} {activity.cost}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-valid">
                Verified price
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-ink-muted">
                Price
              </p>

              <p className="mt-0.5 text-xs text-ink-muted">
                Unavailable
              </p>
            </>
          )}
        </div>
      </div>

      {/* Why Steora selected this */}
      {primaryReason ? (
        <div className="mt-4 rounded-xl border border-accent/10 bg-accent-soft/40 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            Why this place?
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            ✓ {primaryReason.label}
          </p>

          {primaryReason.detail ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              {primaryReason.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-ink-muted">
        <span>{activity.startTime}</span>

        <span className="h-1 w-1 rounded-full bg-line" />

        <span>{activity.durationMinutes} min</span>

        {hasVerifiedPrice ? (
          <>
            <span className="h-1 w-1 rounded-full bg-line" />

            <span className="text-valid">
              Real price data
            </span>
          </>
        ) : null}
      </div>
    </article>
  );
}