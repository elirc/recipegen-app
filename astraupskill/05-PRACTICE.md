# Practice before opening the solutions

Work in a separate branch or copy. Read the [map](01-CODEBASE-MAP.md), then close the worked-change chapter. Keep your answers beside test output so you can distinguish a prediction from something you learned after running the program. The tasks below increase in scope; finishing the first task carefully is more useful than sketching every advanced extension.

## Junior: classify incoming values

Create a table for `null`, an array, a request with a numeric ingredient, a request with string servings, and a valid request containing surrounding ingredient whitespace. Predict the parser result and provider-call count for each. Add one genuinely new boundary case, such as a duplicate dietary option, to the existing test table. Explain why a TypeScript interface would not make that test unnecessary.

## Mid: preserve useful history

Construct a stored history array with two valid results, one result with an invalid timestamp, and one plain string. Predict the returned records and whether localStorage changes during the read. Then design a recovery notice that can report ignored entries without overwriting them. Decide whether the notice belongs in parsing, a storage result type, or the UI. Preserve the current public interface until you can explain the migration cost.

## Mid: make errors useful without leaking internals

The generation response intentionally hides provider exception details. Design an internal structured event containing an attempt number, error category and a correlation identifier. Keep ingredient text, credentials and raw provider messages out of the proposed event. Write tests for the event shape and prove the browser still receives only the generic error. Do not send telemetry to an external service for this exercise.

## Senior: design an asynchronous extension

Suppose generation becomes a background job stored in SQL. Define create, inspect, retry and cancel operations. Specify who owns each record, what prevents duplicate jobs, how status transitions are validated and what happens when a worker finishes after cancellation. Draw a state table before choosing a queue library. Propose one invariant that requires a real database integration test rather than an in-memory fake.

## Checks for the tasks above

- **Junior — Goal:** extend the invalid-request table. **Check:** a new row `["duplicate dietary", (v) => ({ ...v, preferences: { ...v.preferences, dietary: ["vegan", "vegan"] } })]` in `tests/boundaries.test.mjs:20-37` passes, and temporarily deleting `lib/validation.ts:55` makes exactly that row fail.
- **Mid (history) — Goal:** predict partial recovery. **Check:** with the four-entry array stored under `weeknight-history`, `getHistory()` returns 2 records and `values.get("weeknight-history")` is unchanged — the same shape as `tests/boundaries.test.mjs:118-124`.
- **Mid (errors) — Goal:** structured internal event. **Check:** your test injects `new Error("private provider detail")` and asserts the event has `attempt`, `category` and `correlationId` but `JSON.stringify(event)` does not contain the private text; the HTTP body still equals the fixed message at `lib/generation.ts:28`.
- **Senior — Goal:** async job design. **Check:** your state table has one row per (state, event) pair and names the single SQL statement that makes "complete after cancel" a no-op.

## More tasks grounded in the current code

### Validate share links
`decodeRecipe` casts (`lib/share.ts:17`).
**Goal:** return `null` for any decoded value that `parseRecipe` rejects, so the page shows its existing "Recipe not found" branch (`app/recipe/[share]/page.tsx:13-29`).
**Check:** a test asserts `decodeRecipe(encodeURIComponent(btoa('{"id":"x"}')))` is `null`, and a round trip of a valid recipe still deep-equals the original. Visiting `/recipe/eyJpZCI6IngifQ%3D%3D` shows "Recipe not found" instead of an error overlay.

### Validate the results page
**Goal:** `app/results/page.tsx:36-40` uses `parseGenerationResult` and redirects home on failure.
**Check:** in DevTools, `sessionStorage.setItem("currentResult", '{"recipes":[{}]}')` then load `/results`: you land on `/` with no console error.

### Stop favourite-id collisions
**Goal:** favourites are unique across generations even when the model reuses ids such as `"recipe-1"`.
**Check:** two batches whose first recipe both have id `"recipe-1"` but different titles can both be favourited, and `getFavorites()` returns 2 items. Explain where the new id is minted (server after `parseRecipes`, or client in `HomeClient.tsx:72-79`) and why.

### Cap ingredients in the UI
**Goal:** `addIngredient` (`components/IngredientInput.tsx:47-51`) refuses a 21st ingredient with a visible hint.
**Check:** after 20 chips, pressing Enter on a new value adds nothing and shows a message; the request body never has more than 20 items.

## Review deliverable

Write a short change description containing the concrete trigger, previous behavior, new behavior, executed tests and limits. Include one rejected alternative and its tradeoff. Open [the solutions and rubric](06-SOLUTIONS-AND-REVIEW.md) only after your first attempt. An acceptable answer acknowledges uncertainty instead of treating a mock as evidence of distributed correctness.
