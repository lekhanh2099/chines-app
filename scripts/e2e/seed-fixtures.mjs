import { createClient } from "@supabase/supabase-js";

const required = (name) => {
 const value = process.env[name];
 if (!value) throw new Error(`Missing ${name}`);
 return value;
};

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(supabaseUrl).hostname)) {
 throw new Error("E2E fixtures require a local Supabase target");
}
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

// The real Search repository requires a non-empty seed radical catalog.
const radicals = await admin
 .from("hanzihome_radicals")
 .select("id")
 .eq("source", "seed")
 .is("deleted_at", null)
 .limit(1);
if (radicals.error) throw radicals.error;
if (radicals.data.length === 0) {
 const radical = await admin.from("hanzihome_radicals").insert({
  id: "e2e-search-radical",
  source: "seed",
  radical_index: 1,
  radical: "一",
  name_vi: "Nhất",
  strokes: 1,
  core_meaning: { modern: "một" },
 });
 if (radical.error) throw radical.error;
}

// A private normalized lesson exercises the real API/cache/Reader cold-boot path.
const offlineCourse = await admin.from("hanzihome_courses").upsert({
 id: "e2e-offline-course",
 slug: "e2e-offline-course",
 title: "Offline fixture course A",
 source: "custom",
 user_id: userA,
});
if (offlineCourse.error) throw offlineCourse.error;
const offlineBook = await admin.from("hanzihome_course_books").upsert({
 id: "e2e-offline-book",
 course_id: "e2e-offline-course",
 title: "Offline fixture book A",
 source: "custom",
 user_id: userA,
});
if (offlineBook.error) throw offlineBook.error;
const offlineLesson = await admin.from("hanzihome_lessons").upsert({
 id: "e2e-offline-lesson",
 course_id: "e2e-offline-course",
 book_id: "e2e-offline-book",
 lesson_number: 1,
 lesson_order: 1,
 title_zh: "离线学习",
 title_vi: "Offline fixture lesson A",
 source: "custom",
 owner_id: userA,
});
if (offlineLesson.error) throw offlineLesson.error;
const offlineText = await admin.from("hanzihome_lesson_sections").upsert({
 id: "00000000-0000-4000-8000-000000006051",
 lesson_id: "e2e-offline-lesson",
 source_section_id: "e2e-offline-section",
 section_key: "text",
 section_type: "text",
 section_order: 1,
 title: "课文",
 title_vi: "Bài khóa",
 payload: {
  type: "text",
  blocks: [
   {
    id: "e2e-offline-block",
    type: "text_narrative",
    order: 1,
    title: "离线学习",
    paragraphs: [
     { id: "e2e-offline-paragraph-zh", order: 1, zh: "你好，离线学习。" },
     { id: "e2e-offline-paragraph-a", order: 2, zh: "Offline fixture paragraph A." },
    ],
   },
  ],
 },
 source: "custom",
 owner_id: userA,
});
if (offlineText.error) throw offlineText.error;

console.log(`Seeded HanziHome E2E fixtures: ${accounts.map(({ email }) => email).join(", ")}`);
