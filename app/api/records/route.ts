import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  // Constant-time-ish comparison to avoid leaking length/char timing.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(req: Request) {
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

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("paratha_records")
      .select(
        "id, entry_date, paratha_qty, emp_name, meal_type, item_name, rate, created_at"
      )
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Select failed:", error.message);
      return NextResponse.json(
        { error: "Could not load records." },
        { status: 500 }
      );
    }
    return NextResponse.json({ records: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }
}
