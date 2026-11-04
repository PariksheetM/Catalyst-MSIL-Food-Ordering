// Shared field definitions for the submission form.
// Imported by both the form (client) and the API routes (server), so it must
// stay free of any server-only imports.

export type FieldKey =
  | "emp_name"
  | "entry_date"
  | "paratha_qty"
  | "meal_type"
  | "item_name"
  | "rate";

export interface FieldDef {
  key: FieldKey;
  label: string;
  kind: "text" | "date" | "number" | "prefilled";
  placeholder?: string;
  prefill?: string; // value shown (read-only) for prefilled fields
  suffix?: string; // static text shown after the input, e.g. "per Piece"
  required: boolean;
}

export const FIELD_DEFS: Record<FieldKey, FieldDef> = {
  emp_name: {
    key: "emp_name",
    label: "Emp Name",
    kind: "text",
    placeholder: "Your name",
    required: true,
  },
  entry_date: {
    key: "entry_date",
    label: "Date",
    kind: "date",
    required: true,
  },
  paratha_qty: {
    key: "paratha_qty",
    label: "Paratha Qty",
    kind: "number",
    placeholder: "e.g. 3",
    required: true,
  },
  meal_type: {
    key: "meal_type",
    label: "Meal Type",
    kind: "text",
    placeholder: "e.g. Breakfast, Lunch, Dinner",
    required: true,
  },
  item_name: {
    key: "item_name",
    label: "Item Name",
    kind: "prefilled",
    prefill: "Aloo Pyaz Paratha",
    required: true,
  },
  rate: {
    key: "rate",
    label: "Rate",
    kind: "prefilled",
    prefill: "12",
    suffix: "per Piece",
    required: true,
  },
};

export const DEFAULT_FIELD_ORDER: FieldKey[] = [
  "emp_name",
  "entry_date",
  "paratha_qty",
  "meal_type",
  "item_name",
  "rate",
];

// Clean an arbitrary value into a valid, complete field order:
// keeps known keys in the given order, drops unknowns/duplicates, and
// appends any missing keys so the form always renders every field.
export function normalizeOrder(order: unknown): FieldKey[] {
  const seen = new Set<string>();
  const result: FieldKey[] = [];
  if (Array.isArray(order)) {
    for (const k of order) {
      if (typeof k === "string" && k in FIELD_DEFS && !seen.has(k)) {
        seen.add(k);
        result.push(k as FieldKey);
      }
    }
  }
  for (const k of DEFAULT_FIELD_ORDER) {
    if (!seen.has(k)) result.push(k);
  }
  return result;
}
