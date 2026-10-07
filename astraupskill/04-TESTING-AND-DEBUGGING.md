# Test the boundary and debug from observable effects

Run `npm test` from this project with Node 22.16 or the recorded compatible environment. The script uses Node's built-in test runner with TypeScript stripping. The [test file](../tests/boundaries.test.mjs) imports actual production modules, so changing the parser or orchestration changes the tested behavior. No browser, provider account or database is required for these focused checks. Native stripping executes syntax; it does not replace a separate TypeScript type check.

The invalid-request table tests null and array bodies, non-string and duplicate ingredients, unsupported times, fractional or out-of-range servings, invalid dietary choices and wrong boolean or skill types. Every such case asserts status 400 and a provider-call count of zero. The second assertion matters: an implementation that returns the correct error after making a paid request would still violate the intended boundary.

Provider tests use functions that return known values or throw. They check nested recipe shapes, repeated IDs, requested servings and time, missing-ingredient declarations, successful recovery on the second attempt, and a generic failure after two errors. These tests cannot prove network behavior or a real model's output quality. They establish how this application responds to provider outcomes.

Storage tests install a small in-memory localStorage fake and restore the original property after each synchronous scenario. They exercise invalid JSON, valid JSON of the wrong type, mixed valid and invalid entries, fifty-entry history retention, favorite toggling, denied storage and invalid writes. A key debugging observation is that reading a mixed collection must not rewrite the original storage string.

Try a fault-injection lab. Change the input parser to accept string servings, run the suite, and observe which assertion fails. Restore the code, then make the orchestrator return provider data without parsing. Find the test that distinguishes unchecked success from controlled failure. Finally, remove the array guard in storage and store `{}`. Trace the exception to its first consumer rather than adding catches to every component.

## Test inventory (46 cases)

| Block | Lines | Cases | Asserts |
| --- | --- | ---: | --- |
| Invalid requests | `tests/boundaries.test.mjs:20-44` | 18 | status 400 **and** provider calls = 0 |
| Normalisation | `:46-53` | 1 | trimmed ingredients, unknown field dropped, exact input passed to provider |
| Malformed provider recipe | `:55-67` | 9 | `parseRecipe` throws |
| Collection rules | `:68-83` | 4 | duplicate ids, wrong count, time/servings mismatch, missing-ingredient allowance |
| Retry + error hiding | `:84-99` | 3 | 2 calls then 200; 2 failures → 500 without the private message; malformed batch → 500 |
| Corrupt storage | `:113-117` | 5 | `{`, `null`, `{}`, `"text"`, `42` all read as `[]` |
| Storage behaviour | `:118-149` | 5 | partial recovery without rewrite, cap of 50, favourite toggle, invalid writes ignored, storage access throwing |
| Purity | `:150-153` | 1 | parsing does not mutate the caller's object |

The `withStorage` helper (`:101-112`) replaces `globalThis.localStorage` with a `Map`-backed fake and restores the original descriptor in `finally`. It is synchronous, which is why the storage tests do not need `await`.

## Blind spots

| Not tested | Where | A test that would catch a regression |
| --- | --- | --- |
| Route JSON decoding and 429 | `app/api/recipes/route.ts:93-115` | Call `POST` with a `NextRequest` built from a bad body; 11 calls from one IP |
| Share encode/decode round trip | `lib/share.ts` | `decodeRecipe(encodeRecipe(r))` deep-equals `r`, including non-ASCII titles |
| Malformed share link | `lib/share.ts:13-21` | `decodeRecipe(btoa('{"id":1}'))` currently returns a non-null, invalid object |
| Amount formatting | `lib/scaling.ts:17-33` | `formatAmount(0.05)` → `"⅛"` (clamped to 0.1 at `:18`, then 0.1 is within 0.04 of ⅛); `formatAmount(1.5)` → `"1½"` |
| UI ingredient cap | `components/IngredientInput.tsx:47-51` | Adding a 21st chip is blocked |

## Debugging a 500 in development

Because `lib/generation.ts:24-26` discards the error, a missing API key and a malformed model reply look identical from the browser. To debug locally, temporarily bind the error (`catch (error) { console.error(error) }`), reproduce, then remove the log before committing. Do not return the message to the client — the test at `tests/boundaries.test.mjs:89-95` will fail if you do, which is exactly its purpose.

The [verification record](VERIFICATION.md) distinguishes executed evidence from limits. Type checking covers module integration and types when dependencies are available. Neither a passing focused suite nor type checking establishes browser rendering, accessibility, actual API credentials or deployment behavior. Preserve those distinctions in a pull-request description.
