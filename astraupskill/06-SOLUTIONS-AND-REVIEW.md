# Worked answers and a review rubric

For the classification exercise, null and array requests fail the object guard. Numeric ingredients fail text validation. String servings fail the numeric guard rather than being coerced. All four should produce status 400 with zero provider calls. A valid request with surrounding ingredient whitespace succeeds and passes trimmed strings to the provider. The existing [test helpers](../tests/boundaries.test.mjs) make it easy to add the duplicate-dietary case by changing only `preferences.dietary`; assert both response status and absence of the side effect.

For mixed history, only the two valid records should be returned. The invalid timestamp and string entry are rejected independently. The stored string should remain byte-for-byte unchanged during the read. A recovery notice could use a new storage result type containing accepted records and a rejected-entry count, but changing every consumer immediately is unnecessary for the present fix. Discuss a compatible wrapper or a separate diagnostic function before widening the public interface.

For internal error events, a useful shape contains a generated correlation identifier, attempt number and a bounded category such as parse_failure or transport_failure. Do not put the original exception message directly into the public response. A test should inject a distinctive private message and assert that it is absent from the response. The delivered suite already demonstrates that assertion for the generic provider failure. Adding observability would be a separate reviewed change, not an undocumented claim about current behavior.

For the asynchronous extension, candidate states include queued, running, succeeded, failed and cancelled. A cancellation request should not merely set a UI flag while a late worker can overwrite the stored state with success. One possible invariant is a version-qualified update: completion succeeds only if the job is still running with the claim version held by that worker. A unique idempotency key can prevent duplicate creates, but its scope and expiration need explicit product decisions. Test transaction conflicts with the actual database before claiming race safety.

## Solutions for the added tasks

**Share links.** Wrap the parse: `return parseRecipe(JSON.parse(json));` inside the existing `try` in `decodeRecipe` (`lib/share.ts:14-20`). The catch already returns `null`. Importing `parseRecipe` into `share.ts` is safe because `validation.ts` has no browser-only dependencies. Review point: `page.tsx` is a server component, so this validation runs on the server before any client code sees the object.

**Results page.** Replace `setResult(JSON.parse(raw))` with `setResult(parseGenerationResult(JSON.parse(raw)))` inside the same `try`. The `catch` already redirects. Review point: this re-checks cross-field rules, so an entry written by an older version with, say, 7 servings would now redirect — decide whether that is desired.

**Favourite ids.** The cleanest place is the server, right after `parseRecipes` succeeds in `lib/generation.ts:22`: map each recipe to `{ ...r, id: crypto.randomUUID() }`. Then every consumer (history, favourites, share) sees a globally unique id. Review point: existing favourites keep their old ids; reading them still works because `parseRecipe` only requires non-empty text.

**Ingredient cap.** Add `if (ingredients.length >= 20) return;` (plus a hint) in `addIngredient`. Keep the server rule as the authority — the cap must not move only to the client.

## Senior review findings

| # | Finding | Where | Severity |
| --- | --- | --- | --- |
| 1 | Share links bypass validation: `decodeRecipe` returns `JSON.parse(...) as Recipe`; a crafted link crashes the shared-recipe render at `recipe.ingredients.map`. | `lib/share.ts:17`, `app/recipe/[share]/SharedRecipeClient.tsx:79` | Medium |
| 2 | `sessionStorage.currentResult` is parsed without the validator that guards `localStorage`. | `app/results/page.tsx:37` | Low |
| 3 | Model-generated recipe ids are only unique per batch, but favourites are keyed by id globally → toggling one recipe can un-favourite a different one. | `app/api/recipes/route.ts:46`, `lib/validation.ts:109`, `lib/storage.ts:40-47` | Medium |
| 4 | Rate limit keyed on client-controlled `x-forwarded-for`; `Map` never evicts; per-instance on serverless. It limits honest users, not attackers. | `app/api/recipes/route.ts:10-22`, `:94-97` | Medium (cost exposure on a paid API) |
| 5 | All provider/parse errors are swallowed without logging; a missing API key is indistinguishable from bad output. | `lib/generation.ts:24-26` | Medium (operability) |
| 6 | No request timeout or `AbortSignal` on the SDK call; a slow provider holds the request for both attempts. | `app/api/recipes/route.ts:77-87` | Low |
| 7 | Bare `JSON.parse` of the model's text; any prose or code fence burns an attempt. | `app/api/recipes/route.ts:89-90` | Low |
| 8 | A history entry that fails `parseGenerationResult` is silently not saved. | `lib/storage.ts:8-16` | Low |
| 9 | UI permits >20 ingredients; server rejects with 400. | `components/IngredientInput.tsx:47-51`, `lib/validation.ts:41` | Low (UX) |
| 10 | User ingredient text is interpolated into the prompt unescaped (`route.ts:66`). Output is shape-validated, which limits damage, but a prompt-injected ingredient can still steer content. | `app/api/recipes/route.ts:61-72` | Info |
| 11 | Tests cover parsers and orchestration only; route, share, scaling and components are untested. | `tests/boundaries.test.mjs` | Medium |

Use this rubric when reviewing another learner. A junior answer identifies the exact boundary and supplies a reproducible example. A mid-level answer keeps responsibility in one layer and tests prohibited side effects. A senior-level answer separates deterministic local guarantees from operational assumptions, identifies migration costs, and narrows claims to evidence. Reject solutions that silently discard all history, retry invalid input, duplicate parser logic in tests, or claim dietary correctness from shape validation alone.
