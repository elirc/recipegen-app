import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Preferences } from "@/lib/types";
import type { GenerationInput } from "@/lib/validation";
import { generateRecipeResponse } from "@/lib/generation";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a practical weeknight dinner recipe generator. You receive a list of ingredients someone has on hand, a time limit, and their preferences. You return exactly 3 realistic, genuinely doable dinner recipes.

RULES:
1. Every recipe MUST be completable within the given time limit (including prep and cook time).
2. Use common, everyday ingredients. Never suggest obscure or hard-to-find items.
3. Steps must be concise, specific, and actionable. Include actual temperatures, actual times, actual quantities. No vague instructions like "season to taste" or "cook until done."
4. Assume a standard home kitchen: stovetop, oven, microwave, basic pots/pans/knives.
5. Each ingredient must have a numeric amount and a unit (use "whole" for items like "1 whole onion").
6. Mark each ingredient isFromUser: true if it matches (or is a clear variant of) something in the user's ingredient list, false otherwise.
7. Keep it real — these are Tuesday night dinners, not restaurant dishes.

If allowMissingOne is true:
- Exactly 1 of the 3 recipes MAY include 1 ingredient the user didn't list.
- That recipe MUST include a missingIngredient object with the missing item's name and a practical substitution.
- The other 2 recipes must use ONLY the user's ingredients (plus assumed pantry staples: salt, pepper, oil, water).

ASSUMED PANTRY STAPLES (don't list these as extra ingredients): salt, black pepper, cooking oil, water.

Respond with ONLY a valid JSON array of 3 recipe objects. No markdown, no backticks, no explanation. The response must parse directly as JSON.

Each recipe object must match this exact schema:
{
  "id": "unique-string",
  "title": "string",
  "description": "One sentence pitch",
  "totalMinutes": number,
  "difficulty": "easy" | "medium",
  "servings": number,
  "ingredients": [
    { "name": "string", "amount": number, "unit": "string", "isFromUser": boolean }
  ],
  "steps": [
    { "order": number, "instruction": "string", "durationMinutes": number | null }
  ],
  "missingIngredient": { "name": "string", "substitute": "string" } | null
}`;

function buildUserMessage(
  ingredients: string[],
  timeLimit: number,
  preferences: Preferences
): string {
  return `Ingredients: ${ingredients.join(", ")}
Time limit: ${timeLimit} minutes
Servings: ${preferences.servings}
Skill level: ${preferences.skillLevel}
Dietary: ${preferences.dietary.length > 0 ? preferences.dietary.join(", ") : "none"}
Allow missing one ingredient: ${preferences.allowMissingOne ? "yes" : "no"}`;
}

async function callClaude(
  { ingredients, timeLimit, preferences }: GenerationInput
): Promise<unknown> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(ingredients, timeLimit, preferences),
      },
    ],
  });

  const block = message.content.find((item) => item.type === "text");
  return JSON.parse(block?.type === "text" ? block.text : "");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const response = await generateRecipeResponse(body, callClaude);
  return NextResponse.json(response.body, { status: response.status });
}
