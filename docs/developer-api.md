# Developer API v1

`/api/v1` is the server-to-server boundary for applications that use HanziHome
data. It is not a browser-session API and it does not accept a copied Supabase
access token.

## Before calling it

1. Sign in to HanziHome and open **API & tích hợp**.
2. Create an integration key with the smallest scopes needed by the other app.
3. Copy the key when it is revealed. The raw key is shown once only; HanziHome
   stores a SHA-256 hash and never returns the secret again.
4. Put the deployment origin and key in the caller's secret store.

```sh
export HANZIHOME_API_BASE="https://your-hanzihome.example"
export HANZIHOME_INTEGRATION_KEY="hhz_live_replace_me"
```

Do not put the key in frontend JavaScript, a public repository, a URL, or a
client-side mobile build. Browser cross-origin access is intentionally not
enabled; call the API from curl, Postman, a backend, a server action, or a
trusted worker.

## First request

The following call needs the `content:read` scope.

```sh
curl --request GET \
  --url "$HANZIHOME_API_BASE/api/v1/hanzihome/catalog?includeLessons=true" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \
  --header "Accept: application/json"
```

All v1 responses use `Cache-Control: private, no-store`. The server derives the
owner from the integration key, so a request body or query parameter can never
choose another user's data.

## Read an endpoint contract

The **API & tích hợp** page keeps every endpoint collapsed by default. Filter
the page by feature, HTTP method or scope, then use search for a path, summary
or scope. Open an endpoint to see one detail card per HTTP operation. Each card
contains:

- a query example when that operation accepts query parameters;
- an **Expected request body** JSON sample, or an explicit no-body state;
- the expected success status, content type and **Sample response body**;
- a copyable curl command with the same path, query and request JSON.
- a copyable TypeScript operation contract inferred from the registered JSON
  samples. Empty arrays intentionally remain `JsonValue[]` until the server
  contract owns an item schema.

**Chạy demo** only renders that operation's sample success response locally in
the browser. It sends no request, does not use an integration key and is not a
health check for `/api/v1`. Use it to check the contract shape before the
validation branch activates the real API.

The request and response samples describe the planned v1 contract. They are
not executable until the validation branch has applied the integration-key
migration, generated its types, and passed the endpoint contract tests. Do not
point another app at `/api/v1` before that activation is complete.

For example, the catalog operation is expected to return this success shape:

```json
{
 "catalog": {
  "courses": []
 }
}
```

A no-body operation must not receive a JSON payload. The TTS `POST` operation
returns an `audio/mpeg` stream, so it intentionally has no JSON response-body
sample.

## Postman setup

Create an environment with two secret variables:

| Variable                  | Example                          |
| ------------------------- | -------------------------------- |
| `hanziHomeApiBase`        | `https://your-hanzihome.example` |
| `hanziHomeIntegrationKey` | `hhz_live_...`                   |

Add this header to the collection:

```text
Authorization: Bearer {{hanziHomeIntegrationKey}}
```

Then use request URLs such as:

```text
{{hanziHomeApiBase}}/api/v1/hanzihome/catalog
```

Mark the integration-key variable as secret in Postman and never export an
environment containing its current value.

## Common calls

### Read one lesson

```sh
curl --request GET \
  --url "$HANZIHOME_API_BASE/api/v1/hanzihome/lessons/$LESSON_ID" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY"
```

### Search a note library

```sh
curl --request GET \
  --url "$HANZIHOME_API_BASE/api/v1/notes/search?q=jinliang" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY"
```

### List saved SRS vocabulary

This call needs `learning:read`.

```sh
curl --request GET \
  --url "$HANZIHOME_API_BASE/api/v1/vocabulary/progress?limit=50" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY"
```

### Create a note

This call needs `notes:write`.

```sh
curl --request POST \
  --url "$HANZIHOME_API_BASE/api/v1/notes" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Ghi chú từ app ngoài",
    "tags": ["integration"],
    "category": "general"
  }'
```

### Create or update canonical HanziHome content

This call needs `content:write` and the key owner must already have the
HanziHome `editor` or `admin` role. `reason` and `expectedUpdatedAt` retain the
same audit and concurrency protections as the signed-in editor.

```sh
curl --request POST \
  --url "$HANZIHOME_API_BASE/api/v1/hanzihome/content/mutations" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "entityType": "vocab_item",
    "operation": "update",
    "entityId": "VOCAB_ITEM_ID",
    "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",
    "reason": "Đồng bộ từ CMS ngoài",
    "changes": { "meaning": "ý nghĩa mới" }
  }'
```

The external API supports create, update, soft delete, restore and reorder.
Permanent purge is intentionally unavailable.

### Generate TTS

This call needs `tts:generate`. A key is limited atomically to ten TTS requests
per minute. A request beyond that limit receives `429` and `Retry-After`.

```sh
curl --request POST \
  --url "$HANZIHOME_API_BASE/api/v1/tts" \
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \
  --header "Content-Type: application/json" \
  --output hanzi.mp3 \
  --data '{
    "text": "你好，欢迎学习汉语。",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": 1
  }'
```

## Scopes

| Scope                                    | Covers                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `content:read`                           | Catalog, lessons, aggregates, search index and editor-only deleted-content reads.                        |
| `content:write`                          | Canonical content mutations, radicals, listening and vocabulary-child bulk mutations.                    |
| `notes:read` / `notes:write`             | Note library, folders and lesson links.                                                                  |
| `learning:read` / `learning:write`       | Learning state, saved SRS list/progress, annotations and personal memory tips.                           |
| `artifacts:read` / `artifacts:write`     | HTML artifacts, folders and runtime state.                                                               |
| `lookup:read`                            | Basic lookup calls.                                                                                      |
| `ai:generate`                            | Deep lookup, vocabulary generation and editor context; only the key owner's BYOK credential may be used. |
| `ai-settings:read` / `ai-settings:write` | Prompt and model settings only. Provider credentials are never available via v1.                         |
| `tts:generate`                           | Mandarin voice list and audio generation.                                                                |

Use distinct keys for distinct integrations. For example, a reporting service
usually needs `content:read`; it should not be given `content:write` or
`ai:generate`.

## Errors and recovery

| Status        | Meaning                                                                    | Caller action                                                                     |
| ------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `400`         | Invalid path, query, or body.                                              | Correct the request against the endpoint description.                             |
| `401`         | Missing, malformed, revoked, or inactive integration key.                  | Replace the key from the secret store; do not retry with a browser token.         |
| `403`         | Key has no required scope or owner lacks the needed HanziHome editor role. | Create a least-privilege replacement key or adjust the owner's role in HanziHome. |
| `404`         | Resource does not exist for the key owner.                                 | Treat it as absent; do not infer another owner's resource.                        |
| `409`         | A concurrent content update or bulk preview fingerprint is stale.          | Re-read and retry with current `expectedUpdatedAt` or fingerprint.                |
| `429`         | TTS key quota reached.                                                     | Respect `Retry-After`; do not spin-retry.                                         |
| `502` / `503` | Upstream audio/AI or required storage is unavailable.                      | Retry with backoff only when the caller can safely do so.                         |

## Rotate or revoke

Create a replacement key before changing an integration, update its secret,
then revoke the old key in **API & tích hợp**. Revocation immediately makes the
old key return `401`, including for mutation bridges and TTS quota checks.

## Deployment status

This is a future API contract, not an active production surface. Its historical
`integration_api_keys` migration was never applied and is deliberately not part
of the canonical production baseline. Do not point another app at `/api/v1`.

If this API is resumed, create a new migration and server boundary from the
current baseline, apply them first to a non-live Supabase target, regenerate
types, and pass endpoint-contract tests before enabling production traffic.
