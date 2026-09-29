import type { GenerationResult, Recipe } from "./types";
import { parseGenerationResult, parseRecipe } from "./validation.ts";

const HISTORY_KEY = "weeknight-history";
const FAVORITES_KEY = "weeknight-favorites";
const MAX_HISTORY = 50;

export function saveToHistory(result: GenerationResult): void {
  try {
    const history = getHistory();
    const updated = [parseGenerationResult(result), ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export function getHistory(): GenerationResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return readValidItems(raw, parseGenerationResult).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function toggleFavorite(recipe: Recipe): void {
  try {
    recipe = parseRecipe(recipe);
    const favorites = getFavorites();
    const exists = favorites.some((r) => r.id === recipe.id);
    if (exists) {
      const updated = favorites.filter((r) => r.id !== recipe.id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } else {
      const updated = [recipe, ...favorites];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  } catch {
    // localStorage unavailable
  }
}

export function getFavorites(): Recipe[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return readValidItems(raw, parseRecipe);
  } catch {
    return [];
  }
}

export function isFavorite(recipeId: string): boolean {
  try {
    const favorites = getFavorites();
    return favorites.some((r) => r.id === recipeId);
  } catch {
    return false;
  }
}

/** A corrupt entry must not hide unrelated valid learning history. */
function readValidItems<T>(raw: string, parse: (value: unknown) => T): T[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    try { return [parse(item)]; } catch { return []; }
  });
}
