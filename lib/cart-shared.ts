// Shared by the client cart store and the server-side order validation, so it
// must stay free of "use client" / "use server" directives.

export const MAX_QUANTITY = 99;

/** One cart line = one product in one colour/size variant. */
export function lineKey(item: {
  id: string;
  color?: string;
  size?: string;
}) {
  return [item.id, item.color ?? "", item.size ?? ""].join("|");
}
