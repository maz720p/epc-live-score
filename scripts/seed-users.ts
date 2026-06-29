/**
 * Creates the two demo accounts from diagram B (Login authentication flow):
 *   admin1 / EPCSUKSESS   -> role: admin
 *   peserta / epc16       -> role: participant
 * Run once after `supabase db push` with: pnpm run seed:users
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (never expose this key client-side).
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertUser(email: string, password: string, fullName: string, role: "admin" | "participant") {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError && !createError.message.includes("already registered")) {
    throw createError;
  }

  const userId = created?.user?.id;
  if (!userId) {
    console.log(`User ${email} already exists — skipping creation, please set role manually if needed.`);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role });

  if (profileError) throw profileError;
  console.log(`Seeded ${role}: ${email}`);
}

async function main() {
  await upsertUser(
    process.env.SEED_ADMIN_EMAIL ?? "admin1@epc.local",
    process.env.SEED_ADMIN_PASSWORD ?? "EPCSUKSESS",
    "Admin EPC",
    "admin"
  );
  await upsertUser(
    process.env.SEED_PARTICIPANT_EMAIL ?? "peserta@epc.local",
    process.env.SEED_PARTICIPANT_PASSWORD ?? "epc16",
    "Peserta EPC",
    "participant"
  );
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
