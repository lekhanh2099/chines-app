# HanziHome BYOK encryption runbook

## Scope and ownership

This runbook covers the server encryption material for user-owned provider API
keys in `user_api_keys`. It does not change provider credentials, database
ownership, or runtime selection. The deploy owner provisions and rotates cloud
secrets; application code never logs, returns, or stores plaintext provider
keys outside the transient authenticated server request.

New BYOK values require `BYOK_ENCRYPTION_SECRET`. Supabase server credentials
are a decrypt-only fallback for values encrypted before the dedicated secret
was introduced. They must not be treated as the normal BYOK encryption key.

## Provision a dedicated secret

1. Generate an independent, high-entropy value in the team's approved secret
   manager. Do not reuse a Supabase, provider, or application authentication
   secret. The value must contain at least 32 characters.
2. Set `BYOK_ENCRYPTION_SECRET` in every server runtime that can save or use a
   BYOK credential. Keep it server-only; never prefix it with `NEXT_PUBLIC_`.
3. Retain the existing Supabase server secret during the legacy recovery window
   so encrypted values written before this change can still be decrypted.
4. Deploy or restart the affected server runtime.
5. In a non-production account, save a disposable provider key through
   Settings → AI, then perform one authenticated provider action. Verify only
   the masked metadata and successful action; do not expose the raw key or
   ciphertext in logs, screenshots, browser tools, or support tickets.

If `BYOK_ENCRYPTION_SECRET` is absent, saving a new provider key fails closed.
Existing legacy values can still be read only if the appropriate Supabase
server secret remains available.

## Recovery and rotation

The current code supports one active dedicated encryption secret and the
legacy Supabase-derived decrypt fallback. It does not support two dedicated
secret generations concurrently. Therefore, do not overwrite an active
`BYOK_ENCRYPTION_SECRET` in place: it would make existing dedicated-encrypted
values unreadable.

Before a planned dedicated-secret rotation, first ship and verify a controlled
reencryption procedure that can decrypt every existing credential with the old
dedicated secret and re-encrypt it with the new secret. Take an encrypted-data
backup and prove restore/decrypt in a non-production environment before the
production cutover. Keep the old secret in the approved secret manager until
the re-encryption postflight proves there are no values encrypted with it.

For a suspected secret exposure, revoke or rotate the affected provider keys
separately, preserve the evidence required for recovery, and follow the same
controlled re-encryption path. Do not attempt a blind environment replacement.

## Release evidence

- `BYOK_ENCRYPTION_SECRET` is configured in each server environment.
- New credentials fail to save when it is intentionally absent.
- A new credential can be saved and used without returning plaintext to the
  browser.
- A pre-cutover, Supabase-fallback-encrypted fixture remains decryptable while
  its old Supabase server secret is present.
- Secret values, ciphertext, and raw provider keys do not appear in release
  logs, test output, screenshots, or documentation.
