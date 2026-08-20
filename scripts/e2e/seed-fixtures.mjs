import { createClient } from "@supabase/supabase-js";

const required = (name) => {
 const value = process.env[name];
 if (!value) throw new Error(`Missing ${name}`);
 return value;
};

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");

const password = process.env.E2E_FIXTURE_PASSWORD ?? "HanziHome-E2E!2026";
const accounts = [
 { email: process.env.E2E_USER_A_EMAIL ?? "hanzihome-e2e-a@example.test", name: "Fixture A" },
 { email: process.env.E2E_USER_B_EMAIL ?? "hanzihome-e2e-b@example.test", name: "Fixture B" },
];
const admin = createClient(supabaseUrl, serviceRoleKey, {
 auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(account) {
 const created = await admin.auth.admin.createUser({
  email: account.email,
  password,
  email_confirm: true,
  user_metadata: { full_name: account.name },
 });
 if (created.data.user) return created.data.user.id;
 if (!created.error || !created.error.message.toLowerCase().includes("already")) {
  throw created.error ?? new Error(`Could not create ${account.email}`);
 }

 const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 });
 if (listed.error) throw listed.error;
 const existing = listed.data.users.find((user) => user.email === account.email);
 if (!existing)
  throw new Error(`Fixture user ${account.email} was not found after create conflict`);
 const updated = await admin.auth.admin.updateUserById(existing.id, {
  password,
  email_confirm: true,
  user_metadata: { full_name: account.name },
 });
 if (updated.error) throw updated.error;
 return existing.id;
}

const userA = await ensureUser(accounts[0]);
const userB = await ensureUser(accounts[1]);

for (const userId of [userA, userB]) {
 const state = await admin
  .from("user_learning_state")
  .upsert(
   { user_id: userId, settings: {}, progress: {}, bookmarks: {}, review_history: [] },
   { onConflict: "user_id" },
  );
 if (state.error) throw state.error;
}

const loopItem = await admin.from("hanzihome_learning_loop_items").upsert(
 {
  user_id: userA,
  id: "e2e-learning-loop-item",
  stable_key: "e2e-learning-loop-item",
  kind: "vocabulary",
  source_id: "e2e-learning-loop-item",
  source_href: "/learning-loop",
  title_zh: "学习",
  title_vi: "học tập",
  prompt_zh: "学习",
  pinyin: "xué xí",
  meaning_vi: "học tập",
  user_answer: "",
  error_key: "",
  state: "learning",
  due_at: new Date(Date.now() - 60_000).toISOString(),
  interval_days: 0,
  correct_streak: 0,
  lapse_count: 0,
  revision: 0,
 },
 { onConflict: "user_id,id" },
);
if (loopItem.error) throw loopItem.error;

console.log(`Seeded HanziHome E2E fixtures: ${accounts.map(({ email }) => email).join(", ")}`);
