# Runtime contracts, side effects and recoverable local data

A TypeScript assertion says how the compiler should treat an expression. It does not inspect the expression at runtime. In the original route, `body as { ingredients: unknown; ... }` did not prevent `body` from being `null`. Likewise, asserting provider JSON as `Recipe[]` did not prove ingredient amounts were finite numbers or that step order was meaningful. The revised [parser](../lib/validation.ts) accepts `unknown` and establishes these properties before returning typed values.

Distinguish three contracts. The request contract follows the existing controls: two to twenty distinct ingredient strings, one of four time limits, one to six whole servings, supported dietary options, a skill choice and a real boolean. The recipe contract checks nested objects, positive amounts, finite numeric values, bounded text and consecutive step order. The collection contract checks exactly three distinct recipe IDs and compares time, servings and missing-ingredient declarations with the accepted request.

Those checks establish structural and some cross-field consistency. They do not establish nutritional suitability, culinary quality, factual ingredient provenance or whether the recipe truly satisfies a dietary preference. Do not turn a successful parser result into a stronger product claim than its code supports.

The side-effect boundary is equally important. A malformed request should result in zero provider calls. That is both a correctness property and a useful cost-control property. The [orchestrator](../lib/generation.ts) places parsing before its retry loop, so retrying cannot turn invalid input into a paid request. Two failed provider attempts return a generic error; private provider details are not copied into the response.

Local-storage recovery uses a different policy. Reading a collection with one malformed entry should not hide unrelated valid entries. [Storage parsing](../lib/storage.ts) validates entries individually and returns only accepted records, without rewriting the stored string during a read. This avoids destructive cleanup as an accidental side effect of rendering. Explicit writes retain the existing history cap and favorite-toggle semantics.

Compare fail-fast and recover-partially behavior. A provider response is one new generated collection and must satisfy the complete contract. Existing history is a collection of independent records, so partial recovery is useful. The policy difference comes from ownership and user expectations, not from an arbitrary preference for throwing errors or catching exceptions.

## The four parser primitives

Every rule in `lib/validation.ts` is built from four small functions. Learn them and the rest of the file reads quickly.

| Helper | Lines | Accepts | Rejects |
| --- | --- | --- | --- |
| `record` | `:10-15` | plain objects | `null`, arrays, primitives |
| `text` | `:17-22` | non-blank strings up to a trimmed `maximum`; returns the **trimmed** value | numbers, blank strings, oversize strings |
| `number` | `:24-30` | finite numbers within `[min, max]`, optionally integers | strings such as `"2"`, `NaN`, `Infinity` |
| `list` | `:32-37` | arrays with length in `[min, max]` | non-arrays, too short/long |

Two consequences:

- **Normalisation is limited to trimming.** `text` trims, nothing else coerces. `"2"` for servings is rejected rather than converted (`:24-29`).
- **Unknown fields are dropped.** `parseGenerationInput` builds a new object from named fields (`:58-66`), so `injected: "ignored"` never reaches the provider — the test at `tests/boundaries.test.mjs:46-53` asserts `deepEqual(seen, input())`.

## Cross-field rules

Single-field checks cannot express "the recipe must fit the request". Those live in `parseRecipes` (`:107-118`) and only run when the caller passes the accepted `input`:

- every `totalMinutes ≤ timeLimit` and every `servings` equals the requested servings (`:111-113`);
- at most one recipe may carry `missingIngredient`, and none unless `allowMissingOne` is true (`:114-115`);
- ids are distinct within the batch (`:109`).

Notice what is **not** checked: that `isFromUser: true` ingredients actually appear in the user's list, or that a "vegan" request produced vegan recipes. The parser verifies shape and arithmetic, not truth.

## Fail-fast vs. retry vs. recover

| Source | Policy | Why | Code |
| --- | --- | --- | --- |
| HTTP request | fail fast (400), never retry | the caller sent it; retrying cannot fix it | `lib/generation.ts:14-18` |
| Provider output | retry once, then generic 500 | model output is nondeterministic; a second attempt may parse | `:20-28` |
| Stored history | drop bad entries, keep good ones | entries are independent records the user cares about | `lib/storage.ts:73-79` |

## Exercises

**Goal:** predict trimming and case rules. **Check:** for ingredients `[" Rice", "rice "]` you predict 400 `Ingredients must be distinct.` because `text` trims and the distinctness check lowercases (`lib/validation.ts:41-45`); the existing "duplicate ingredient" test (`tests/boundaries.test.mjs:25`) is the same case.

**Goal:** find a cross-field gap. **Check:** you write a provider fixture where `allowMissingOne` is false, no recipe has `missingIngredient`, yet one ingredient has `isFromUser: false` and is not a pantry staple — and you observe that `parseRecipes(output, input())` accepts it. Explain whether that should be a parser rule or a product decision.
