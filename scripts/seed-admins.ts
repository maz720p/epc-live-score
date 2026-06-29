/**
 * Creates multiple admin accounts for multi-station live scoring
 * (one admin per station/meja during the competition).
 *
 * Usage:
 *   pnpm run seed:admins            # creates admin1..admin7 (default 7)
 *   pnpm run seed:admins -- 10      # creates admin1..admin10
 *
 * Each account:
 *   email:    admin{N}@epc.local
 *   password: EPCSUKSESS          (same password for every admin, easy to share)
 *   role:     admin
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (never expose this key client-side).
 * Safe to re-run: existing accounts are detected and just have their role
 * re-confirmed, they are never recreated or have their password changed.
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

const SHARED_PASSWORD = "EPCSUKSESS";

async function upsertAdmin(email: string, password: string, fullName: string) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  // email_exists -> account is already there, that's fine, just continue below.
  if (createError && createError.code !== "email_exists") {
    throw createError;
  }

  let userId = created?.user?.id;

  if (!userId) {
    // Already exists — look up the id so we can still (re)confirm the profile/role.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    userId = list.users.find((u) => u.email === email)?.id;
  }

  if (!userId) {
    console.log(`Could not resolve user id for ${email} — skipping.`);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role: "admin" });

  if (profileError) throw profileError;
  console.log(`Ready: ${email} / ${password}`);
}

async function main() {
  // Find the first numeric argument, regardless of where "--" ended up
  // (pnpm forwards args after "--", e.g. `pnpm run seed:admins -- 10`).
  const numericArg = process.argv.slice(2).find((arg) => /^\d+$/.test(arg));
  const count = numericArg ? Number(numericArg) : 7;

  for (let n = 1; n <= count; n++) {
    const email = `admin${n}@epc.local`;
    await upsertAdmin(email, SHARED_PASSWORD, `Admin ${n}`);
  }

  console.log(`\nDone. ${count} admin account(s) ready, all using password "${SHARED_PASSWORD}".`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});