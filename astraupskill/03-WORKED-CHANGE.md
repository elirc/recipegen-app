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

For review practice, explain why moving every check into HomeClient would not fix the route, and why adding a compiler interface alone would not fix saved JSON. Then identify the smallest regression that distinguishes the original behavior from the revised boundary. Avoid refactoring unrelated components while investigating that regression.
