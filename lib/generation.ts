import { parseGenerationInput, parseRecipes } from "./validation.ts";
import type { GenerationInput } from "./validation.ts";
import type { Recipe } from "./types";

type GenerationResponse = { status: 200; body: { recipes: Recipe[] } } |
  { status: 400 | 500; body: { error: string } };

/** Validate before crossing the paid provider boundary; never return unchecked output. */
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
  // Preserve the previous maximum of two attempts, including malformed provider output.
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
