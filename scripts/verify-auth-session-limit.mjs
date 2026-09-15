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
 // 1. Sign in 5 clients sequentially (all should succeed under 5-session cap)
 const clients = Array.from({ length: 5 }, () => createClient(supabaseUrl, publicKey, options));
 for (const client of clients) {
  const res = await client.auth.signInWithPassword({ email, password });
  assert.equal(res.error, null, "Concurrent sign-in up to cap of 5 must succeed");
 }

 // 2. Sign in a 6th client: should succeed and auto-evict the 1st client's session
 const sixthClient = createClient(supabaseUrl, publicKey, options);
 const sixthRes = await sixthClient.auth.signInWithPassword({ email, password });
 assert.equal(
  sixthRes.error,
  null,
  "6th sign-in must succeed via auto-evicting the oldest session",
 );
 assert.equal(sixthRes.data.user?.id, userId);

 // 3. Verify that client 0 (the oldest) was evicted and its refresh fails
 const evictedRefresh = await clients[0].auth.refreshSession();
 assert.notEqual(evictedRefresh.error, null, "Oldest session must have been evicted");

 // 4. Verify clients 1..4 + sixthClient remain valid and can refresh
 for (const client of [...clients.slice(1), sixthClient]) {
  const refreshed = await client.auth.refreshSession();
  assert.equal(refreshed.error, null, "Surviving sessions must refresh successfully");
  assert.equal(refreshed.data.user?.id, userId);
 }

 // 5. Auth hook direct invocation forbidden
 const forbidden = await sixthClient.rpc("hanzihome_limit_auth_sessions", { event: {} });
 assert.ok(forbidden.error, "Authenticated clients must not invoke the Auth hook directly");

 // 6. Sign out locally
 const signedOut = await sixthClient.auth.signOut({ scope: "local" });
 assert.equal(signedOut.error, null);

 console.log(
  "PASS: 5-session cap, 6th session auto-eviction of oldest, refresh resilience, and RPC permissions.",
 );
} finally {
 const deleted = await admin.auth.admin.deleteUser(userId);
 if (deleted.error) throw new Error(`Disposable session-limit user cleanup failed: ${userId}`);
 const remaining = await admin.auth.admin.getUserById(userId);
 assert.equal(remaining.data.user, null, "Disposable user must be removed");
 console.log("Disposable probe user and its sessions removed; existing users were untouched.");
}
