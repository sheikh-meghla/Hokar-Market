"use client";

import { useMemo, useSyncExternalStore } from "react";
import { MAX_QUANTITY, lineKey } from "./cart-shared";

export { MAX_QUANTITY, lineKey };

export type CartItem = {
  /** Product id. */
  id: string;
  slug?: string;
  name: string;
  nameBn?: string;
  price: number;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  /** Whether the line is picked for the next order. */
  selected: boolean;
};

export const CART_STORAGE_KEY = "city-gold-cart";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();

// Cache the parsed cart so useSyncExternalStore gets a stable snapshot.
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;
// Used only when localStorage is unavailable.
let memoryRaw: string | null = null;

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const merged = new Map<string, CartItem>();
    for (const entry of parsed) {
      if (
        !entry ||
        typeof entry.id !== "string" ||
        typeof entry.name !== "string" ||
        typeof entry.price !== "number" ||
        !Number.isFinite(entry.price) ||
        typeof entry.quantity !== "number" ||
        !Number.isFinite(entry.quantity) ||
        entry.quantity < 1
      ) {
        continue;
      }
      const item: CartItem = {
        id: entry.id,
        slug: typeof entry.slug === "string" ? entry.slug : undefined,
        name: entry.name,
        nameBn: typeof entry.nameBn === "string" ? entry.nameBn : undefined,
        price: entry.price,
        image: typeof entry.image === "string" ? entry.image : undefined,
        color: typeof entry.color === "string" ? entry.color : undefined,
        size: typeof entry.size === "string" ? entry.size : undefined,
        quantity: Math.min(MAX_QUANTITY, Math.floor(entry.quantity)),
        // Lines saved before selection existed count as selected.
        selected: entry.selected !== false,
      };
      const key = lineKey(item);
      const existing = merged.get(key);
      if (existing) {
        existing.quantity = Math.min(
          MAX_QUANTITY,
          existing.quantity + item.quantity,
        );
        existing.selected = existing.selected || item.selected;
      } else {
        merged.set(key, item);
      }
    }
    return [...merged.values()];
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
}

function getSnapshot(): CartItem[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parseCart(raw);
  }
  return cachedItems;
}

const getServerSnapshot = (): CartItem[] => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeCart(items: CartItem[]) {
  const raw = JSON.stringify(items);
  memoryRaw = raw;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch {
    // Keep the in-memory copy for this session.
  }
  listeners.forEach((listener) => listener());
}

/** Add a line, or increase the quantity when the same variant already exists. */
export function addToCart(
  item: Omit<CartItem, "quantity" | "selected">,
  quantity = 1,
) {
  const items = getSnapshot();
  const key = lineKey(item);
  const index = items.findIndex((line) => lineKey(line) === key);
  if (index >= 0) {
    writeCart(
      items.map((line, i) =>
        i === index
          ? {
              ...line,
              quantity: Math.min(MAX_QUANTITY, line.quantity + quantity),
              selected: true,
            }
          : line,
      ),
    );
  } else {
    writeCart([
      ...items,
      { ...item, quantity: Math.min(MAX_QUANTITY, quantity), selected: true },
    ]);
  }
}

export function setCartQuantity(key: string, quantity: number) {
  const next = Math.min(MAX_QUANTITY, Math.max(1, quantity));
  writeCart(
    getSnapshot().map((line) =>
      lineKey(line) === key ? { ...line, quantity: next } : line,
    ),
  );
}

export function setSelected(key: string, selected: boolean) {
  writeCart(
    getSnapshot().map((line) =>
      lineKey(line) === key ? { ...line, selected } : line,
    ),
  );
}

export function setAllSelected(selected: boolean) {
  writeCart(getSnapshot().map((line) => ({ ...line, selected })));
}

/** Remove several lines at once (e.g. the ones that were just ordered). */
export function removeLines(keys: string[]) {
  const remove = new Set(keys);
  writeCart(getSnapshot().filter((line) => !remove.has(lineKey(line))));
}

export function removeFromCart(key: string) {
  writeCart(getSnapshot().filter((line) => lineKey(line) !== key));
}

const subscribeNever = () => () => {};

/** False during SSR and the hydration pass, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items],
  );
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  return {
    items,
    count,
    subtotal,
    selectedItems,
    selectedSubtotal,
    addItem: addToCart,
    setQuantity: setCartQuantity,
    removeItem: removeFromCart,
    setSelected,
    setAllSelected,
    removeLines,
  };
}
