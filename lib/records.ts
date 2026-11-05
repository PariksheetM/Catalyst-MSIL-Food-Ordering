// Shared server helpers for record validation and admin auth.
import { FIELD_DEFS } from "./fields";

export type ParsedRecord = {
  entry_date: string;
  paratha_qty: number;
  emp_name: string;
  employee_id: string;
  mobile_no: string;
  meal_type: string;
  item_name: string;
  rate: number;
};

export function parseRecord(
  body: unknown
): { ok: true; value: ParsedRecord } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const date = typeof b.entry_date === "string" ? b.entry_date.trim() : "";
  const name = typeof b.emp_name === "string" ? b.emp_name.trim() : "";
  const empId = typeof b.employee_id === "string" ? b.employee_id.trim() : "";
  const mobileDigits = (
    typeof b.mobile_no === "string" ? b.mobile_no : ""
  ).replace(/\D/g, "");
  const meal = typeof b.meal_type === "string" ? b.meal_type.trim() : "";
  const qty = Number(b.paratha_qty);

  if (!date) return { ok: false, error: "Date is required." };
  if (!name) return { ok: false, error: "Employee name is required." };
  if (!empId) return { ok: false, error: "Employee ID is required." };
  if (mobileDigits.length !== 10) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }
  if (!meal) return { ok: false, error: "Meal type is required." };
  if (!Number.isInteger(qty) || qty < 0) {
    return {
      ok: false,
      error: "Paratha quantity must be a whole number (0 or more).",
    };
  }

  const item =
    typeof b.item_name === "string" && b.item_name.trim()
      ? b.item_name.trim()
      : (FIELD_DEFS.item_name.prefill ?? "");
  const rn = Number(b.rate);
  const rate =
    Number.isFinite(rn) && rn >= 0 ? rn : Number(FIELD_DEFS.rate.prefill);

  return {
    ok: true,
    value: {
      entry_date: date,
      paratha_qty: qty,
      emp_name: name,
      employee_id: empId,
      mobile_no: mobileDigits,
      meal_type: meal,
      item_name: item,
      rate,
    },
  };
}

// Constant-time-ish check of the admin password header.
export function checkAdmin(
  req: Request
): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      status: 500,
      error: "Admin password is not configured on the server.",
    };
  }
  const provided = req.headers.get("x-admin-password") ?? "";
  if (provided.length !== expected.length) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, status: 401, error: "Unauthorized." };
  return { ok: true };
}
