import { execSync } from "node:child_process";

function supabaseStatus() {
  try {
    const out = execSync("supabase status -o json", { encoding: "utf-8" });
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

function startSupabase() {
  console.log("🚀 Starting Supabase local...");
  execSync("supabase start", { stdio: "inherit" });
}

export default async () => {
  let status = supabaseStatus();

  if (!status) {
    startSupabase();
    status = supabaseStatus();
  }

  console.log({status})

  process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = status.PUBLISHABLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY;

  console.log("🔧 Loaded Supabase local env vars:");
  console.log(" - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(" - NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log(" - SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Optional: reset DB before running tests
  console.log("🧹 Resetting database...");
  execSync("supabase db reset", { stdio: "inherit" });
};
