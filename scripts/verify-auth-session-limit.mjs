import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Explicit opt-in: this probe creates and deletes only its own disposable user.
const projectRef = process.env.SUPABASE_PROJECT_REF;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey =
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (
 !projectRef ||
 supabaseUrl !== `https://${projectRef}.supabase.co` ||
 !publicKey ||
 !secretKey
) {
 throw new Error(
  "Explicit matching SUPABASE_PROJECT_REF, URL and public/secret keys are required.",
 );
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, secretKey, options);
const email = `session-limit-${randomUUID()}@example.test`;
const password = `Session-limit!${randomUUID()}`;
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) throw created.error;
const userId = created.data.user.id;

try {
 const clients = Array.from({ length: 4 }, () => createClient(supabaseUrl, publicKey, options));
 const admissions = await Promise.all(
  clients.map(async (client) => ({
   client,
   result: await client.auth.signInWithPassword({ email, password }),
  })),
 );
 const admitted = admissions.filter(({ result }) => result.error === null);
 const rejected = admissions.filter(({ result }) => result.error !== null);
 assert.equal(admitted.length, 3, "Exactly three concurrent sign-ins must succeed");
 assert.equal(rejected.length, 1, "The fourth concurrent sign-in must fail");
 const denied = rejected[0];
 assert.equal(denied.result.error.status, 403);
 assert.match(denied.result.error.message, /HANZIHOME_SESSION_LIMIT_REACHED/);
 assert.equal(denied.result.data.session, null, "Rejected login must not receive a session");

 for (const { client } of admitted) {
  const refreshed = await client.auth.refreshSession();
  assert.equal(refreshed.error, null, "Each admitted session must refresh at the cap");
  assert.equal(refreshed.data.user.id, userId);
 }

 const forbidden = await admitted[0].client.rpc("hanzihome_limit_auth_sessions", { event: {} });
 assert.ok(forbidden.error, "Authenticated clients must not invoke the Auth hook directly");

 const signedOut = await admitted[0].client.auth.signOut({ scope: "local" });
 assert.equal(signedOut.error, null);
 for (const { client } of admitted.slice(1)) {
  const refreshed = await client.auth.refreshSession();
  assert.equal(refreshed.error, null, "Local logout must preserve the other sessions");
 }
 const replacement = await denied.client.auth.signInWithPassword({ email, password });
 assert.equal(replacement.error, null, "Local logout must free a slot for another browser");
 assert.equal(replacement.data.user.id, userId);
 console.log(
  "PASS: concurrent 3/4 admission, denied session, refresh, RPC permissions and local logout.",
 );
} finally {
 const deleted = await admin.auth.admin.deleteUser(userId);
 if (deleted.error) throw new Error(`Disposable session-limit user cleanup failed: ${userId}`);
 const remaining = await admin.auth.admin.getUserById(userId);
 assert.equal(remaining.data.user, null, "Disposable user must be removed");
 console.log("Disposable probe user and its sessions removed; existing users were untouched.");
}
