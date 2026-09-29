import test from "node:test";
import assert from "node:assert/strict";
import { parseGenerationInput, parseRecipe, parseRecipes } from "../lib/validation.ts";
import { generateRecipeResponse } from "../lib/generation.ts";
import { getHistory, getFavorites, saveToHistory, toggleFavorite, isFavorite, clearHistory } from "../lib/storage.ts";

const input = () => ({ ingredients: ["rice", "beans"], timeLimit: 30, preferences: {
  dietary: [], servings: 2, skillLevel: "easy", allowMissingOne: false,
} });
const recipe = (id = "one") => ({ id, title: "Rice bowl", description: "A simple bowl", totalMinutes: 20,
  difficulty: "easy", servings: 2,
  ingredients: [{ name: "rice", amount: 1, unit: "cup", isFromUser: true }],
  steps: [{ order: 1, instruction: "Simmer the rice.", durationMinutes: 15 }], missingIngredient: null,
});
const recipes = () => [recipe("one"), recipe("two"), recipe("three")];
const result = (id = "saved") => ({ id, timestamp: "2026-09-21T00:00:00.000Z", inputIngredients: ["rice", "beans"],
  timeLimit: 30, preferences: input().preferences, recipes: recipes(),
});

for (const [name, mutate] of [
  ["null body", () => null], ["array body", () => []], ["string body", () => "request"],
  ["missing preferences", (v) => ({ ...v, preferences: null })],
  ["non-string ingredient", (v) => ({ ...v, ingredients: ["rice", 7] })],
  ["empty ingredient", (v) => ({ ...v, ingredients: ["rice", " "] })],
  ["duplicate ingredient", (v) => ({ ...v, ingredients: ["rice", " RICE "] })],
  ["oversized ingredient", (v) => ({ ...v, ingredients: ["rice", "x".repeat(101)] })],
  ["too many ingredients", (v) => ({ ...v, ingredients: Array.from({length: 21}, (_, i) => `food${i}`) })],
  ["unsupported time", (v) => ({ ...v, timeLimit: 25 })],
  ["string time", (v) => ({ ...v, timeLimit: "30" })],
  ["fractional servings", (v) => ({ ...v, preferences: { ...v.preferences, servings: 1.5 } })],
  ["zero servings", (v) => ({ ...v, preferences: { ...v.preferences, servings: 0 } })],
  ["large servings", (v) => ({ ...v, preferences: { ...v.preferences, servings: 7 } })],
  ["infinite servings", (v) => ({ ...v, preferences: { ...v.preferences, servings: Infinity } })],
  ["unknown dietary choice", (v) => ({ ...v, preferences: { ...v.preferences, dietary: ["other"] } })],
  ["wrong skill", (v) => ({ ...v, preferences: { ...v.preferences, skillLevel: "expert" } })],
  ["string boolean", (v) => ({ ...v, preferences: { ...v.preferences, allowMissingOne: "false" } })],
]) {
  test(`invalid request: ${name} never calls provider`, async () => {
    let calls = 0;
    const response = await generateRecipeResponse(mutate(input()), async () => { calls++; return recipes(); });
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  });
}

test("valid request is normalized without retaining unknown fields", async () => {
  const request = { ...input(), ingredients: [" rice ", "beans"], injected: "ignored" };
  let seen;
  const response = await generateRecipeResponse(request, async (value) => { seen = value; return recipes(); });
  assert.equal(response.status, 200);
  assert.deepEqual(seen, input());
  assert.deepEqual(response.body.recipes, recipes());
});

for (const [name, mutate] of [
  ["null recipe", () => null],
  ["wrong title type", (r) => ({ ...r, title: 2 })],
  ["zero amount", (r) => ({ ...r, ingredients: [{ ...r.ingredients[0], amount: 0 }] })],
  ["nonfinite amount", (r) => ({ ...r, ingredients: [{ ...r.ingredients[0], amount: NaN }] })],
  ["string origin", (r) => ({ ...r, ingredients: [{ ...r.ingredients[0], isFromUser: "true" }] })],
  ["empty steps", (r) => ({ ...r, steps: [] })],
  ["nonconsecutive steps", (r) => ({ ...r, steps: [{ ...r.steps[0], order: 2 }] })],
  ["negative duration", (r) => ({ ...r, steps: [{ ...r.steps[0], durationMinutes: -1 }] })],
  ["bad substitution", (r) => ({ ...r, missingIngredient: { name: "onion", substitute: [] } })],
]) {
  test(`invalid provider recipe: ${name}`, () => assert.throws(() => parseRecipe(mutate(recipe()))));
}
test("recipe collection rejects repeated IDs", () => assert.throws(() => parseRecipes([recipe(), recipe(), recipe()])));
test("recipe collection rejects wrong count", () => assert.throws(() => parseRecipes([recipe()])));
test("provider output must fit requested time and servings", () => {
  const output = recipes(); output[0].totalMinutes = 45;
  assert.throws(() => parseRecipes(output, input()));
  output[0].totalMinutes = 20; output[0].servings = 3;
  assert.throws(() => parseRecipes(output, input()));
});
test("missing-ingredient allowance is enforced across all three recipes", () => {
  const output = recipes(); output[0].missingIngredient = { name: "onion", substitute: "scallion" };
  assert.throws(() => parseRecipes(output, input()));
  const request = input(); request.preferences.allowMissingOne = true;
  assert.equal(parseRecipes(output, request).length, 3);
  output[1].missingIngredient = output[0].missingIngredient;
  assert.throws(() => parseRecipes(output, request));
});
test("invalid provider output retries once and can recover", async () => {
  let calls = 0;
  const response = await generateRecipeResponse(input(), async () => ++calls === 1 ? [{}] : recipes());
  assert.equal(calls, 2); assert.equal(response.status, 200);
});
test("two provider failures return a generic error with no unchecked data", async () => {
  let calls = 0;
  const response = await generateRecipeResponse(input(), async () => { calls++; throw new Error("private provider detail"); });
  assert.equal(calls, 2); assert.equal(response.status, 500);
  assert.equal(JSON.stringify(response).includes("private provider detail"), false);
  assert.equal("recipes" in response.body, false);
});
test("malformed provider output cannot become a successful response", async () => {
  const response = await generateRecipeResponse(input(), async () => [recipe(), {}, null]);
  assert.equal(response.status, 500);
});

function withStorage(initial, work) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map(Object.entries(initial));
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key),
  } });
  try { work(values); } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
}
for (const raw of ["{", "null", "{}", '"text"', "42"]) {
  test(`invalid stored collection ${raw} returns empty safely`, () => withStorage({
    "weeknight-history": raw, "weeknight-favorites": raw,
  }, () => { assert.deepEqual(getHistory(), []); assert.deepEqual(getFavorites(), []); }));
}
test("corrupt saved entries do not hide valid entries or rewrite storage on read", () => {
  const raw = JSON.stringify([null, result(), { id: "bad" }]);
  withStorage({ "weeknight-history": raw, "weeknight-favorites": JSON.stringify([{}, recipe()]) }, (values) => {
    assert.deepEqual(getHistory(), [result()]); assert.deepEqual(getFavorites(), [recipe()]);
    assert.equal(values.get("weeknight-history"), raw);
  });
});
test("history stays capped at fifty valid entries and supports clear", () => withStorage({}, () => {
  for (let i = 0; i < 55; i++) saveToHistory(result(`result-${i}`));
  assert.equal(getHistory().length, 50); assert.equal(getHistory()[0].id, "result-54");
  clearHistory(); assert.deepEqual(getHistory(), []);
}));
test("favorite toggle preserves unrelated valid favorites", () => withStorage({}, () => {
  toggleFavorite(recipe("one")); toggleFavorite(recipe("two")); toggleFavorite(recipe("one"));
  assert.deepEqual(getFavorites(), [recipe("two")]); assert.equal(isFavorite("two"), true);
}));
test("invalid writes preserve previous storage", () => withStorage({}, (values) => {
  saveToHistory(result()); toggleFavorite(recipe());
  const before = [...values]; saveToHistory(null); toggleFavorite({});
  assert.deepEqual([...values], before);
}));
test("missing browser storage does not crash reads or writes", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("denied"); } });
  try {
    assert.deepEqual(getHistory(), []); assert.deepEqual(getFavorites(), []);
    assert.doesNotThrow(() => saveToHistory(result())); assert.doesNotThrow(() => toggleFavorite(recipe()));
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});
test("input parsing does not mutate caller data", () => {
  const value = input(); const copy = structuredClone(value);
  parseGenerationInput(value); assert.deepEqual(value, copy);
});
