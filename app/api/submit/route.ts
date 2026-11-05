import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseRecord } from "@/lib/records";
import { checkOrderTiming } from "@/lib/ordering";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseRecord(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Enforce the ordering window / same-day cut-off (server-authoritative).
  const timingError = checkOrderTiming(parsed.value.entry_date);
  if (timingError) {
    return NextResponse.json({ error: timingError }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("paratha_records")
      .insert(parsed.value);

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
