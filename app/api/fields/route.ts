import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_FIELD_ORDER, normalizeOrder } from "@/lib/fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Public: the form reads the field order to render fields in the admin's order.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("form_settings")
      .select("field_order")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ order: DEFAULT_FIELD_ORDER });
    }
    return NextResponse.json({ order: normalizeOrder(data.field_order) });
  } catch {
    // Not configured / unreachable: fall back so the form still renders.
    return NextResponse.json({ order: DEFAULT_FIELD_ORDER });
  }
}

// Admin only: save a new field order.
export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin password is not configured on the server." },
      { status: 500 }
    );
  }
  const provided = req.headers.get("x-admin-password") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const order = normalizeOrder((body as { order?: unknown })?.order);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("form_settings").upsert({
      id: 1,
      field_order: order,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Save order failed:", error.message);
      return NextResponse.json(
        { error: "Could not save the field order." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({ order });
}
