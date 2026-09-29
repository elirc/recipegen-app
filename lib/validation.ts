import type { GenerationResult, Preferences, Recipe } from "./types";

type RecordValue = Record<string, unknown>;
export interface GenerationInput {
  ingredients: string[];
  timeLimit: number;
  preferences: Preferences;
}

function record(value: unknown, name: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as RecordValue;
}

function text(value: unknown, name: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) {
    throw new Error(`${name} must be non-empty text of at most ${maximum} characters.`);
  }
  return value.trim();
}

function number(value: unknown, name: string, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max ||
      (integer && !Number.isInteger(value))) {
    throw new Error(`${name} must be ${integer ? "an integer" : "a finite number"} from ${min} to ${max}.`);
  }
  return value;
}

function list(value: unknown, name: string, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`${name} must contain ${min} to ${max} items.`);
  }
  return value;
}

export function parseGenerationInput(value: unknown): GenerationInput {
  const input = record(value, "Request");
  const ingredients = list(input.ingredients, "Ingredients", 2, 20)
    .map((item) => text(item, "Ingredient", 100));
  if (new Set(ingredients.map((item) => item.toLowerCase())).size !== ingredients.length) {
    throw new Error("Ingredients must be distinct.");
  }
  const timeLimit = number(input.timeLimit, "Time limit", 15, 60, true);
  if (![15, 30, 45, 60].includes(timeLimit)) throw new Error("Choose a supported time limit.");
  const prefs = record(input.preferences, "Preferences");
  const allowedDietary = new Set(["vegetarian", "vegan", "dairy-free", "gluten-free"]);
  const dietary = list(prefs.dietary, "Dietary preferences", 0, 4).map((item) => {
    const name = text(item, "Dietary preference", 20);
    if (!allowedDietary.has(name)) throw new Error("Unknown dietary preference.");
    return name;
  });
  if (new Set(dietary).size !== dietary.length) throw new Error("Dietary preferences must be distinct.");
  if (prefs.skillLevel !== "easy" && prefs.skillLevel !== "intermediate") throw new Error("Invalid skill level.");
  if (typeof prefs.allowMissingOne !== "boolean") throw new Error("Invalid missing-ingredient preference.");
  return {
    ingredients, timeLimit,
    preferences: {
      dietary,
      servings: number(prefs.servings, "Servings", 1, 6, true),
      skillLevel: prefs.skillLevel,
      allowMissingOne: prefs.allowMissingOne,
    },
  };
}

export function parseRecipe(value: unknown): Recipe {
  const recipe = record(value, "Recipe");
  if (recipe.difficulty !== "easy" && recipe.difficulty !== "medium") throw new Error("Invalid recipe difficulty.");
  const ingredients = list(recipe.ingredients, "Recipe ingredients", 1, 30).map((value) => {
    const item = record(value, "Recipe ingredient");
    if (typeof item.isFromUser !== "boolean") throw new Error("Invalid ingredient origin.");
    return {
      name: text(item.name, "Ingredient name", 100),
      amount: number(item.amount, "Ingredient amount", Number.MIN_VALUE, 10_000),
      unit: text(item.unit, "Ingredient unit", 40),
      isFromUser: item.isFromUser,
    };
  });
  const steps = list(recipe.steps, "Steps", 1, 30).map((value, index) => {
    const step = record(value, "Step");
    if (step.order !== index + 1) throw new Error("Steps must have consecutive order values starting at 1.");
    return {
      order: index + 1,
      instruction: text(step.instruction, "Step instruction", 2_000),
      durationMinutes: step.durationMinutes == null ? null : number(step.durationMinutes, "Step duration", 0, 180),
    };
  });
  const missing = recipe.missingIngredient == null ? null : record(recipe.missingIngredient, "Missing ingredient");
  return {
    id: text(recipe.id, "Recipe ID", 100),
    title: text(recipe.title, "Recipe title", 200),
    description: text(recipe.description, "Recipe description", 1_000),
    totalMinutes: number(recipe.totalMinutes, "Total minutes", 1, 180, true),
    difficulty: recipe.difficulty,
    servings: number(recipe.servings, "Recipe servings", 1, 6, true),
    ingredients, steps,
    missingIngredient: missing ? {
      name: text(missing.name, "Missing ingredient name", 100),
      substitute: text(missing.substitute, "Substitution", 500),
    } : null,
  };
}

export function parseRecipes(value: unknown, input?: GenerationInput): Recipe[] {
  const recipes = list(value, "Recipes", 3, 3).map(parseRecipe);
  if (new Set(recipes.map((recipe) => recipe.id)).size !== 3) throw new Error("Recipe IDs must be distinct.");
  if (input) {
    if (recipes.some((recipe) => recipe.totalMinutes > input.timeLimit || recipe.servings !== input.preferences.servings)) {
      throw new Error("Recipes must respect the requested time and servings.");
    }
    const missingCount = recipes.filter((recipe) => recipe.missingIngredient !== null).length;
    if (missingCount > (input.preferences.allowMissingOne ? 1 : 0)) throw new Error("Too many recipes with a missing ingredient.");
  }
  return recipes;
}

export function parseGenerationResult(value: unknown): GenerationResult {
  const result = record(value, "Saved result");
  const input = parseGenerationInput({ ingredients: result.inputIngredients, timeLimit: result.timeLimit, preferences: result.preferences });
  const timestamp = text(result.timestamp, "Timestamp", 40);
  if (!Number.isFinite(Date.parse(timestamp))) throw new Error("Invalid saved timestamp.");
  return {
    id: text(result.id, "Saved result ID", 100), timestamp,
    inputIngredients: input.ingredients, timeLimit: input.timeLimit, preferences: input.preferences,
    recipes: parseRecipes(result.recipes, input),
  };
}
