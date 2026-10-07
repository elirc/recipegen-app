# Map the real request and persistence paths

Begin at [HomeClient](../app/HomeClient.tsx). Its state contains ingredients, a time limit and preferences. Submitting serializes those values to `/api/recipes`. The UI disables the visible submit control for too few ingredients, but that check cannot establish a server invariant: a caller can send HTTP directly, a saved client can be old, and browser state can be malformed.

The [route adapter](../app/api/recipes/route.ts) retains the existing process-local rate limiter and JSON decoding. It delegates domain-shaped input and provider results to [generation orchestration](../lib/generation.ts). The orchestration calls [validation](../lib/validation.ts), invokes the supplied provider function only after the request is accepted, and validates its output before returning a success body. The actual SDK adapter stays in the route; tests inject a deterministic function at this boundary.

```mermaid
flowchart LR
  Form[HomeClient form] --> Route[POST route / JSON decoding]
  Route --> Policy[generateRecipeResponse]
  Policy --> Input[parseGenerationInput]
  Policy --> Provider[provider adapter]
  Provider --> Output[parseRecipes]
  Output --> Browser[results and browser storage]
```

Follow the successful browser path separately. HomeClient builds a generation-result record, calls [saveToHistory](../lib/storage.ts), writes the current result to session storage, and navigates to the results page. History and favorites use different local-storage keys. They are local CRUD collections, not server-authoritative resources. Parsing saved records is still important because local storage persists across software versions and can contain values this version did not write.

The [type declarations](../lib/types.ts) describe trusted objects inside the program. They do not validate JSON. The new parsing functions turn unknown values into that trusted representation while dropping unrelated fields. Read each returned object literal and identify which fields are normalized, constrained or defaulted.

For a code-reading exercise, draw two columns labeled transport and policy. Place request JSON decoding, HTTP status creation, provider retry count, ingredient bounds and storage recovery in one column each. Explain any choice that could reasonably belong in both. Then locate the [tests](../tests/boundaries.test.mjs) that prove invalid requests do not cross the provider boundary. There is no database transaction to trace here; a later SQL exercise should explicitly add that new responsibility instead of pretending it already exists.

## Line-by-line route map

| Step | Code | What happens |
| --- | --- | --- |
| 1 | `app/HomeClient.tsx:52` | Client guard: fewer than 2 ingredients → return without a request |
| 2 | `app/HomeClient.tsx:57-61` | `fetch("/api/recipes")` with `{ ingredients, timeLimit, preferences }` |
| 3 | `app/api/recipes/route.ts:94-104` | IP from `x-forwarded-for` / `x-real-ip`; over 10/min → 429 |
| 4 | `app/api/recipes/route.ts:106-111` | `request.json()`; a syntax error → 400 `Invalid request body.` |
| 5 | `lib/generation.ts:14-18` | `parseGenerationInput(body)`; any throw → 400 with the parser's message |
| 6 | `lib/generation.ts:20-27` | Up to two attempts: `generate(input)` then `parseRecipes(output, input)`; first success → 200 |
| 7 | `lib/generation.ts:28` | Both attempts failed → 500 with a fixed message |
| 8 | `app/api/recipes/route.ts:114` | `NextResponse.json(response.body, { status: response.status })` |
| 9 | `app/HomeClient.tsx:72-85` | Build a `GenerationResult` with a fresh `crypto.randomUUID()`, `saveToHistory`, write `sessionStorage.currentResult`, navigate |
| 10 | `app/results/page.tsx:30-41` | Read `currentResult` back with a bare `JSON.parse` |

Step 10 is worth noticing: the browser-storage hardening in `lib/storage.ts` covers `localStorage` history and favourites, but the results page reads `sessionStorage` without any parser. That asymmetry is one of the practice tasks in chapter 5.

## Where each type is trusted

| Value | Arrives as | Becomes trusted at |
| --- | --- | --- |
| HTTP body | `unknown` (`route.ts:106`) | `parseGenerationInput` returns (`lib/validation.ts:58-66`) |
| Provider output | `unknown` (`route.ts:74-76`, return type `Promise<unknown>`) | `parseRecipes` returns (`lib/validation.ts:117`) |
| `localStorage` history | string → `unknown` (`lib/storage.ts:74`) | per item, `parseGenerationResult` (`:76-78`) |
| Share-link path segment | string | **never** — `decodeRecipe` casts (`lib/share.ts:17`) |
| `sessionStorage.currentResult` | string | **never** — `JSON.parse` only (`app/results/page.tsx:37`) |

## Exercises

**Goal:** find the line that guarantees an invalid request is free. **Check:** you cite `lib/generation.ts:14-18` and explain that the `for` loop at `:20` is unreachable after the `return` at `:17`; the test at `tests/boundaries.test.mjs:38-43` asserts `calls === 0` for 18 bodies.

**Goal:** locate every place a recipe can enter the UI. **Check:** your list has exactly four: the API response (`HomeClient.tsx:70`, `results/page.tsx:66`), `sessionStorage` (`results/page.tsx:37`), `localStorage` (`lib/storage.ts:22`, `:57`), and the share URL (`app/recipe/[share]/page.tsx:11`) — and you mark which two are validated.
