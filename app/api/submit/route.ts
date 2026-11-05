import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { FIELD_DEFS } from "@/lib/fields";
import { checkOrderTiming } from "@/lib/ordering";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { entry_date, paratha_qty, emp_name, meal_type, item_name, rate } =
    (body ?? {}) as Record<string, unknown>;

  const date = typeof entry_date === "string" ? entry_date.trim() : "";
  const name = typeof emp_name === "string" ? emp_name.trim() : "";
  const meal = typeof meal_type === "string" ? meal_type.trim() : "";
  const qty = Number(paratha_qty);

  if (!date) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json(
      { error: "Employee name is required." },
      { status: 400 }
    );
  }
  if (!meal) {
    return NextResponse.json(
      { error: "Meal type is required." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json(
      { error: "Paratha quantity must be a whole number (0 or more)." },
      { status: 400 }
    );
  }

  // Enforce the ordering window / same-day 7:30 AM cut-off (server-authoritative).
  const timingError = checkOrderTiming(date);
  if (timingError) {
    return NextResponse.json({ error: timingError }, { status: 400 });
  }

  // Item name and rate are prefilled/fixed fields. Use the incoming value when
  // present and valid, otherwise fall back to the known default so these can
  // never be submitted blank.
  const itemName =
    typeof item_name === "string" && item_name.trim()
      ? item_name.trim()
      : (FIELD_DEFS.item_name.prefill ?? "");
  const rateNum = Number(rate);
  const rateVal =
    Number.isFinite(rateNum) && rateNum >= 0
      ? rateNum
      : Number(FIELD_DEFS.rate.prefill);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("paratha_records").insert({
      entry_date: date,
      paratha_qty: qty,
      emp_name: name,
      meal_type: meal,
      item_name: itemName,
      rate: rateVal,
    });

    if (error) {
      console.error("Insert failed:", error.message);
      return NextResponse.json(
        { error: "Could not save the record. Please try again." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server is not configured. Contact the administrator." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
