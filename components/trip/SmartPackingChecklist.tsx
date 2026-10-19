
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Trip } from "@/types/trip";

type PackingItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
};

function generatePackingItems(trip: Trip): PackingItem[] {
  const items: PackingItem[] = [
    { id: "document-id", name: "Government ID or passport", category: "Documents", checked: false },
    { id: "document-booking", name: "Tickets and booking confirmations", category: "Documents", checked: false },
    { id: "document-money", name: "Cards and some cash", category: "Documents", checked: false },
    { id: "clothing-outfits", name: "Everyday outfits", category: "Clothing", checked: false },
    { id: "clothing-underwear", name: "Underwear and socks", category: "Clothing", checked: false },
    { id: "clothing-sleepwear", name: "Sleepwear", category: "Clothing", checked: false },
    { id: "health-medicine", name: "Personal medicines and prescriptions", category: "Health", checked: false },
    { id: "health-first-aid", name: "Basic first-aid supplies", category: "Health", checked: false },
    { id: "electronics-phone", name: "Phone and charger", category: "Electronics", checked: false },
    { id: "electronics-power", name: "Power bank", category: "Electronics", checked: false },
    { id: "essentials-toiletries", name: "Toiletries and personal care", category: "Essentials", checked: false },
    { id: "essentials-bag", name: "Day bag for outings", category: "Essentials", checked: false },
  ];

  const start = new Date(`${trip.request.startDate}T00:00:00Z`);
  const end = new Date(`${trip.request.endDate}T00:00:00Z`);

  if (
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    end >= start
  ) {
    const days = Math.floor(
      (end.getTime() - start.getTime()) / 86_400_000,
    ) + 1;

    items.push({
      id: "clothing-trip",
      name: `${days} ${days === 1 ? "day" : "days"} of outfits, planned for your trip`,
      category: "Clothing",
      checked: false,
    });
  }

  const weather = trip.weather ?? [];
  const rainy = weather.some((day) => day.precipitationChance >= 40);
  const hot = weather.some((day) => day.highC >= 30);
  const cold = weather.some((day) => day.lowC <= 12);

  if (rainy) {
    items.push({
      id: "weather-rain",
      name: "Umbrella or rain jacket",
      category: "Weather",
      checked: false,
    });
  }

  if (hot) {
    items.push(
      {
        id: "weather-sunscreen",
        name: "Sunscreen",
        category: "Weather",
        checked: false,
      },
      {
        id: "weather-water",
        name: "Reusable water bottle",
        category: "Weather",
        checked: false,
      },
    );
  }

  if (cold) {
    items.push({
      id: "weather-warm",
      name: "Warm layers or a jacket",
      category: "Weather",
      checked: false,
    });
  }

  if (trip.request.interests.includes("beaches")) {
    items.push({
      id: "interest-beach",
      name: "Swimwear and beach essentials",
      category: "Activities",
      checked: false,
    });
  }

  if (trip.request.interests.includes("adventure")) {
    items.push({
      id: "interest-adventure",
      name: "Comfortable activity-appropriate footwear",
      category: "Activities",
      checked: false,
    });
  }

  if (trip.request.interests.includes("photography")) {
    items.push({
      id: "interest-photo",
      name: "Camera and spare memory card",
      category: "Electronics",
      checked: false,
    });
  }

  return items;
}

function isPackingItem(value: unknown): value is PackingItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.checked === "boolean"
  );
}

export function SmartPackingChecklist({ trip }: { trip: Trip }) {
  const storageKey = `steora.packing.${trip.id}`;

  const defaultItems = useMemo(
    () => generatePackingItems(trip),
    [trip],
  );

  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("Essentials");
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    let initialItems = defaultItems;

    try {
      const saved = window.localStorage.getItem(storageKey);

      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.every(isPackingItem)) {
          initialItems = parsed;
        }
      }
    } catch {
      setStorageAvailable(false);
    }

    setItems(initialItems);
    setReady(true);
  }, [defaultItems, storageKey]);

  useEffect(() => {
    if (!ready) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [items, ready, storageKey]);

  const completed = items.filter((item) => item.checked).length;
  const progress = items.length
    ? Math.round((completed / items.length) * 100)
    : 0;

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items],
  );

  function toggleItem(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newItem.trim();
    if (!name) return;

    setItems((current) => [
      ...current,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        category: newCategory,
        checked: false,
      },
    ]);

    setNewItem("");
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="rounded-3xl border border-line bg-paper-raised p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Travel essentials
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Smart packing checklist
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Your packing list adapts to your trip dates, available weather
            information, and selected interests.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-4 sm:min-w-32">
          <p className="text-xs text-ink-muted">Items packed</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {completed}
            <span className="text-base font-normal text-ink-muted">
              {" "}/ {items.length}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>Packing progress</span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Packing progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={addItem}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder="Add an item, e.g. sunglasses"
          aria-label="New packing item"
          className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          maxLength={120}
        />

        <select
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          aria-label="Packing item category"
          className="rounded-xl border border-line bg-paper px-3 py-3 text-sm text-ink outline-none focus:border-accent"
        >
          <option>Essentials</option>
          <option>Documents</option>
          <option>Clothing</option>
          <option>Health</option>
          <option>Electronics</option>
          <option>Weather</option>
          <option>Activities</option>
        </select>

        <button
          type="submit"
          disabled={!newItem.trim()}
          className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add item
        </button>
      </form>

      {!ready ? (
        <p className="mt-6 text-sm text-ink-muted">Loading your saved checklist…</p>
      ) : (
        <div className="mt-6 space-y-6">
          {categories.map((category) => {
            const categoryItems = items.filter(
              (item) => item.category === category,
            );

            return (
              <div key={category}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">
                    {category}
                  </h3>
                  <span className="text-xs text-ink-muted">
                    {categoryItems.filter((item) => item.checked).length}/
                    {categoryItems.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                        aria-label={`Mark ${item.name} as ${item.checked ? "not packed" : "packed"}`}
                        className="h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                      />

                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          item.checked
                            ? "text-ink-muted line-through"
                            : "text-ink"
                        }`}
                      >
                        {item.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-lg px-2 py-1 text-xs text-ink-muted transition hover:bg-line hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-muted">
              Your list is empty. Add your first packing item above.
            </p>
          )}

          {progress === 100 && items.length > 0 && (
            <p className="rounded-xl border border-line bg-paper p-4 text-sm font-medium text-ink">
              All packed! You are ready for your trip.
            </p>
          )}
        </div>
      )}

      {!storageAvailable && (
        <p className="mt-4 text-xs text-ink-muted">
          Browser storage is unavailable. Your checklist may not persist after
          leaving this page.
        </p>
      )}
    </section>
  );
}
