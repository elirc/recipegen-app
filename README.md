# weeknight — recipe generator

A small Next.js 16 / React 19 app: type the ingredients you have, pick a time limit (15/30/45/60 min) and a few preferences, and a server route asks Claude for **three** weeknight dinner recipes. Results can be scaled by servings, shared by link, favourited, and revisited from a local history. There is no database and no account system: history and favourites live in the browser's `localStorage`.

This repository is the hardened variant of the project. It adds runtime validation (`lib/validation.ts`), a testable generation orchestrator (`lib/generation.ts`), validated storage reads (`lib/storage.ts`) and a Node test suite (`tests/boundaries.test.mjs`). A step-by-step course on those changes lives in [`astraupskill/`](astraupskill/README.md). The sibling repository `recipegen` is the pre-hardening baseline: its `app/api/recipes/route.ts` and `lib/storage.ts` are byte-identical (ignoring line endings) to the snapshots kept in `astraupskill/snapshots/`.

## Getting started

```bash
npm install
cp .env.example .env.local      # then put a real key in ANTHROPIC_API_KEY
npm run dev                     # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run lint` | ESLint (`eslint.config.mjs`) |
| `npm test` | `node --experimental-strip-types --test tests/*.test.mjs` — 46 cases, no network, no API key needed |
| `npm run typecheck` | `tsc --noEmit` |

`tsconfig.json` enables `allowImportingTsExtensions` so `lib/generation.ts` and `lib/storage.ts` can import `./validation.ts` with an explicit extension; that is what lets Node's type-stripping test runner load the production modules directly.

Without `ANTHROPIC_API_KEY`, the UI still loads, but every generation attempt fails and the route returns the generic 500 message after two attempts (`lib/generation.ts:20-28`). Nothing is logged server-side when that happens (see *Known issues*).

## How it fits together

```
app/HomeClient.tsx ──POST /api/recipes──▶ app/api/recipes/route.ts
   │                                         │ rate limit (in-memory, per IP)
   │                                         │ request.json()
   │                                         ▼
   │                                lib/generation.ts  generateRecipeResponse()
   │                                         │ parseGenerationInput()   → 400, provider never called
   │                                         │ up to 2 × callClaude() + parseRecipes()
   │                                         ▼
   │◀──── { recipes } | { error } ───────────┘
   ├─ saveToHistory()  → localStorage "weeknight-history" (cap 50)
   ├─ sessionStorage "currentResult"
   └─ router.push("/results")
```

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx` → `app/HomeClient.tsx` | Ingredient chips, time options, preference chips, submit |
| `/results` | `app/results/page.tsx` | Reads `sessionStorage.currentResult`, renders 3 `RecipeCard`s, "Give Me 3 More" |
| `/history` | `app/history/page.tsx` | Past generations from `localStorage` |
| `/favorites` | `app/favorites/page.tsx` | Favourited recipes from `localStorage` |
| `/recipe/[share]` | `app/recipe/[share]/page.tsx` | Decodes a base64 recipe from the URL (`lib/share.ts`) |
| `POST /api/recipes` | `app/api/recipes/route.ts` | The only server code |

### The API route (`app/api/recipes/route.ts`)

- `checkRateLimit` (`:12-22`): 10 requests per minute per IP, in a module-level `Map` (`:10`).
- IP is taken from `x-forwarded-for`, then `x-real-ip`, else `"unknown"` (`:94-97`).
- Malformed JSON → 400 `Invalid request body.` (`:106-111`).
- Everything else is delegated to `generateRecipeResponse(body, callClaude)` (`:113-114`).
- `callClaude` (`:74-91`) sends `SYSTEM_PROMPT` (`:24-59`) and a plain-text user message (`:61-72`) to model `claude-sonnet-4-20250514` with `max_tokens: 4096`, then `JSON.parse`s the first text block (`:89-90`).

### Validation (`lib/validation.ts`)

| Contract | Rules | Lines |
| --- | --- | --- |
| Request | 2–20 distinct (case-insensitive) ingredient strings ≤ 100 chars; `timeLimit` ∈ {15,30,45,60}; dietary ⊆ {vegetarian, vegan, dairy-free, gluten-free}, distinct; `skillLevel` easy\|intermediate; `allowMissingOne` boolean; servings integer 1–6 | `:39-67` |
| One recipe | difficulty easy\|medium; 1–30 ingredients with positive finite `amount`, text `unit`, boolean `isFromUser`; 1–30 steps numbered 1..n; duration 0–180 or null; `totalMinutes` integer 1–180; servings 1–6 | `:69-105` |
| Collection | exactly 3; distinct ids; every `totalMinutes ≤ timeLimit`; every `servings` equal to requested; at most one `missingIngredient` and only if allowed | `:107-118` |
| Saved history entry | the request contract plus the collection contract plus a parseable `timestamp` | `:120-130` |

### Scaling and sharing

- `lib/scaling.ts`: `scaleAmount` is a straight ratio (`:35-42`); `formatAmount` clamps anything below 0.1 up to 0.1 (`:18`) and snaps to ⅛ ¼ ⅓ ½ ⅔ ¾ within ±0.04 (`:1-15`). The serving adjuster allows 1–12 (`components/ServingAdjuster.tsx:15`, `:24`).
- `lib/share.ts`: the whole recipe is JSON → UTF-8 → base64 → URL-encoded into the path (`:3-11`). No server storage is involved, so share links never expire but can be long.

## Testing

`tests/boundaries.test.mjs` imports the production modules and injects a fake provider, so it never calls Anthropic. It covers 18 invalid-request shapes (each asserting **zero** provider calls), 9 malformed provider recipes, collection rules, the two-attempt retry, generic error hiding, and `localStorage` recovery with an in-memory fake. It does **not** exercise `route.ts` (rate limiting, JSON decoding), `lib/share.ts`, `lib/scaling.ts`, or any React component.

## Known issues

Found while reading the code; none are fixed in this repository.

- **Share links are not validated.** `decodeRecipe` casts parsed JSON straight to `Recipe` (`lib/share.ts:17`); a crafted link with no `ingredients` array makes `SharedRecipeClient` throw on `recipe.ingredients.map` (`app/recipe/[share]/SharedRecipeClient.tsx:79`). `parseRecipe` already exists and is not used here.
- **Results page trusts sessionStorage.** `app/results/page.tsx:37` uses `JSON.parse` with no `parseGenerationResult`.
- **Recipe ids come from the model** (`"id": "unique-string"` in the prompt, `route.ts:46`). Uniqueness is enforced only within one batch (`lib/validation.ts:109`), but favourites are keyed by id across all batches (`lib/storage.ts:40`), so two generations that both return `"recipe-1"` collide.
- **Rate limiting is weak.** `x-forwarded-for` is client-controlled unless a proxy overwrites it, so a caller can rotate it for a fresh quota; the `Map` is never pruned; and on serverless hosts each instance has its own map.
- **Silent failures.** Provider and parse errors are swallowed with no server log (`lib/generation.ts:24-26`); a history entry that fails validation is dropped silently (`lib/storage.ts:13-15`).
- **UI allows more than 20 ingredients** (`components/IngredientInput.tsx:47-51` has no cap); the 21st makes the server answer 400.
- **Strict output contract.** One recipe 5 minutes over the limit rejects the whole batch (`lib/validation.ts:111-113`) and costs a second paid call.
- `callClaude` has no timeout and expects bare JSON; a fenced (```` ``` ````) reply fails `JSON.parse` and consumes an attempt.
