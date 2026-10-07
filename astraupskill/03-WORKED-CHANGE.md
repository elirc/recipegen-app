# Worked change: validate before invoking the provider

Read the exact [original route](snapshots/app__api__recipes__route.ts.original.txt) before reading the revised [route](../app/api/recipes/route.ts). The original code caught invalid JSON syntax, then destructured the decoded value. That leaves a gap: `null` is valid JSON but is not a destructurable request object. The same file's old recipe validator checked a few truthy fields and two arrays, then returned a type assertion.

The revised design separates decoding from policy. The route still owns `request.json()` and `NextResponse`. A new [orchestrator](../lib/generation.ts) owns the order of operations. It first calls `parseGenerationInput`. Any failure returns status 400 without invoking the injected provider. Only a valid normalized input reaches the bounded two-attempt loop. Each result must pass `parseRecipes` before status 200 is possible.

Before, a type assertion left the null case unchecked:

```ts
const { ingredients, timeLimit, preferences } = body as {
  ingredients: unknown; timeLimit: unknown; preferences: unknown;
};
```

After, the production orchestration establishes the runtime contract first:

```ts
let input: GenerationInput;
try {
  input = parseGenerationInput(body);
} catch (error) {
  return { status: 400, body: { error: error instanceof Error ? error.message : "Invalid request." } };
}
```

Notice that the second snippet changes control flow. It is not simply a more elaborate type annotation. The provider loop appears after this early return, which is the property tested by the zero-call assertions.

Consider this trace. A request contains two valid ingredients but `servings: "2"`. The UI usually produces a number, yet an external caller can produce the string. Parsing rejects it instead of coercing it. The response describes invalid input, the provider-call counter remains zero, and the retry loop is never entered. That is a clearer contract than silently correcting arbitrary input and hoping later code agrees.

Now consider valid input followed by an invalid provider result. The first attempt returns three objects, one with a negative ingredient amount. Collection parsing rejects the result. A second valid result can succeed; a second failure produces a generic error without unchecked recipes. This preserves the original maximum of two application-level attempts while making the success condition explicit. SDK-internal retry behavior remains a separate concern.

The storage change follows the same trust-boundary principle but uses partial recovery. Compare the [original storage module](snapshots/lib__storage.ts.original.txt) with [the revised module](../lib/storage.ts). A syntactically valid object stored under the history key no longer escapes as an array. Individual bad entries are skipped while valid entries remain available. Reads do not mutate persistence, and invalid writes leave existing data untouched.

## The orchestrator, line by line (`lib/generation.ts`)

```ts
// lib/generation.ts:9-29
export async function generateRecipeResponse(
  body: unknown,
  generate: (input: GenerationInput) => Promise<unknown>,
): Promise<GenerationResponse> {
  let input: GenerationInput;
  try {
    input = parseGenerationInput(body);
  } catch (error) {
    return { status: 400, body: { error: error instanceof Error ? error.message : "Invalid request." } };
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const recipes = parseRecipes(await generate(input), input);
      return { status: 200, body: { recipes } };
    } catch {
      // Provider error details must not be exposed to the browser.
    }
  }
  return { status: 500, body: { error: "Couldn't generate recipes right now. Please try again later." } };
}
```

- `generate` is a **parameter**, not an import. The route passes `callClaude` (`app/api/recipes/route.ts:113`); tests pass a counter function. That single design choice is what makes the "zero provider calls" assertion possible without mocking a module.
- The return type is a discriminated union on `status` (`:5-6`): a 200 always carries `recipes`, a 400/500 always carries `error`. The route does not need to know which (`route.ts:114`).
- 400 messages come from the parser and **are** shown to the user (e.g. `Ingredients must contain 2 to 20 items.`), because they describe the user's own input. 500 messages are fixed, because they would otherwise describe the provider.
- `parseRecipes(await generate(input), input)` is inside the `try`: a transport error and a malformed reply both consume an attempt. The `catch` has no binding and no logging — the price of not leaking details is that an operator also sees nothing.

## How the route changed

Diff the snapshot against the current route yourself (`git diff --no-index astraupskill/snapshots/app__api__recipes__route.ts.original.txt app/api/recipes/route.ts`). The things to notice:

1. The original's own validator and retry loop moved out; `callClaude` (`route.ts:74-91`) now only talks to the SDK and returns `unknown`.
2. `request.json()` failure handling stayed in the route (`:106-111`) — it is transport, not policy.
3. The rate limiter (`:10-22`) is unchanged and still runs **before** validation, so an invalid request still consumes one of the caller's ten per-minute slots.

## Exercises

**Goal:** prove the injection seam. **Check:** write a three-line script (or test) that calls `generateRecipeResponse({ingredients:["a","b"],timeLimit:30,preferences:{dietary:[],servings:2,skillLevel:"easy",allowMissingOne:false}}, async () => { throw new Error("x") })` and observe `{ status: 500 }` with no `recipes` key — matching `tests/boundaries.test.mjs:89-95`.

**Goal:** see the retry count. **Check:** with a fake that returns `[{}]` first and a valid batch second, the call counter is 2 and the status 200 (`tests/boundaries.test.mjs:84-88`). Change the loop bound at `lib/generation.ts:20` to `1` and observe that exact test fail.

For review practice, explain why moving every check into HomeClient would not fix the route, and why adding a compiler interface alone would not fix saved JSON. Then identify the smallest regression that distinguishes the original behavior from the revised boundary. Avoid refactoring unrelated components while investigating that regression.
