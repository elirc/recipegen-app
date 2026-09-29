import { Recipe } from "./types";

export function encodeRecipe(recipe: Recipe): string {
  try {
    const json = JSON.stringify(recipe);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return encodeURIComponent(encoded);
  } catch {
    return "";
  }
}

export function decodeRecipe(param: string): Recipe | null {
  try {
    const decoded = decodeURIComponent(param);
    const json = decodeURIComponent(escape(atob(decoded)));
    return JSON.parse(json) as Recipe;
  } catch {
    return null;
  }
}

export function buildShareUrl(recipe: Recipe): string {
  const encoded = encodeRecipe(recipe);
  if (typeof window !== "undefined") {
    return `${window.location.origin}/recipe/${encoded}`;
  }
  return `/recipe/${encoded}`;
}
