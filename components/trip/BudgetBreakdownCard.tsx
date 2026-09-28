import { formatMoney } from "@/lib/format";
import type {
  BudgetBreakdown as BudgetBreakdownType,
  BudgetCategory,
} from "@/types/trip";

const LABELS: Record<BudgetCategory, string> = {
  activities: "Activities",
  food: "Food",
  local_transport: "Local transport",
  accommodation: "Accommodation",
  other: "Other",
};

export function BudgetBreakdownCard({
  breakdown,
}: {
  breakdown: BudgetBreakdownType;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <h2 className="text-lg font-semibold">Budget</h2>

      <p className="mt-1 text-sm text-ink-muted">
        Only verified prices are included. Unavailable prices are not estimated
        or invented.
      </p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        {/* Stated budget */}
        <div className="rounded-xl bg-paper p-3">
          <p className="text-ink-muted">Stated budget</p>
          <p className="mt-1 font-medium">
            {formatMoney(
              breakdown.totalBudget,
              breakdown.currency
            )}
          </p>
        </div>

        {/* Verified / estimated total */}
        <div className="rounded-xl bg-paper p-3">
          <p className="text-ink-muted">
            {breakdown.isComplete
              ? "Verified total"
              : "Verified costs"}
          </p>

          <p className="mt-1 font-medium">
            {formatMoney(
              breakdown.verifiedTotal,
              breakdown.currency
            )}
          </p>

          {!breakdown.isComplete && (
            <p className="mt-1 text-xs text-ink-muted">
              Complete total unavailable
            </p>
          )}
        </div>

        {/* Booked total */}
        <div className="rounded-xl bg-paper p-3">
          <p className="text-ink-muted">Booked total</p>

          <p className="mt-1 font-medium">
            {breakdown.bookedTotal == null
              ? "Not booked"
              : formatMoney(
                  breakdown.bookedTotal,
                  breakdown.currency
                )}
          </p>
        </div>
      </div>

      {/* Pricing coverage */}
      <div className="mt-4 rounded-xl bg-paper p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">
            Pricing coverage
          </span>

          <span className="font-medium">
            {breakdown.pricingCoverage}%
          </span>
        </div>

        {breakdown.unpricedActivities > 0 && (
          <p className="mt-1 text-xs text-ink-muted">
            {breakdown.unpricedActivities}{" "}
            {breakdown.unpricedActivities === 1
              ? "activity"
              : "activities"}{" "}
            without verified pricing
          </p>
        )}
      </div>

      {/* Category breakdown */}
      <ul className="mt-4 divide-y divide-line">
        {breakdown.lines.map((line) => (
          <li
            key={line.category}
            className="flex items-center justify-between gap-3 py-3 text-sm"
          >
            <span>
              {LABELS[line.category]}

              {line.unpricedItems > 0 && (
                <span className="ml-2 text-xs text-ink-muted">
                  ({line.unpricedItems} unpriced)
                </span>
              )}
            </span>

            <span className="text-right">
              <span className="block">
                Verified{" "}
                {formatMoney(
                  line.verified,
                  breakdown.currency
                )}
              </span>

              <span className="block text-xs text-ink-muted">
                Booked{" "}
                {line.booked == null
                  ? "—"
                  : formatMoney(
                      line.booked,
                      breakdown.currency
                    )}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* Transparency message */}
      {!breakdown.isComplete && (
        <div className="mt-4 rounded-xl border border-line bg-paper p-3">
          <p className="text-sm font-medium">
            Complete trip cost unavailable
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            Some itinerary activities do not have verified
            pricing yet. Steora will not invent those prices.
          </p>
        </div>
      )}
    </section>
  );
}