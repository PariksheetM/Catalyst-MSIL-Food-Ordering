import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the service_role key, so it must
// never be imported into a client component or exposed to the browser.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Thrown at request time (not build time) so a missing env var is obvious.
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.");
}

export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
