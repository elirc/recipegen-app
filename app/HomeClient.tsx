"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IngredientInput from "@/components/IngredientInput";
import TimeSlider from "@/components/TimeSlider";
import PreferenceChips from "@/components/PreferenceChips";
import { Preferences, Recipe, GenerationResult } from "@/lib/types";
import { saveToHistory } from "@/lib/storage";

const DEFAULT_PREFS: Preferences = {
  dietary: [],
  servings: 2,
  skillLevel: "easy",
  allowMissingOne: false,
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 animate-pulse space-y-3">
      <div className="h-5 bg-stone-200 rounded w-3/4" />
      <div className="h-3 bg-stone-100 rounded w-full" />
      <div className="h-3 bg-stone-100 rounded w-2/3" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 bg-stone-100 rounded-full w-16" />
        <div className="h-6 bg-stone-100 rounded-full w-12" />
      </div>
    </div>
  );
}

const COOKING_MESSAGES = [
  "Checking your fridge...",
  "Consulting Tuesday-night wisdom...",
  "Making something doable...",
  "Figuring out dinner...",
  "Almost there — smells good!",
];

export default function HomeClient() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsg] = useState(() =>
    COOKING_MESSAGES[Math.floor(Math.random() * COOKING_MESSAGES.length)]
  );

  async function handleSubmit() {
    if (ingredients.length < 2) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, timeLimit, preferences }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      const recipes: Recipe[] = data.recipes;

      const result: GenerationResult = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        inputIngredients: ingredients,
        timeLimit,
        preferences,
        recipes,
      };

      saveToHistory(result);

      // Pass data via sessionStorage to avoid giant URL params
      sessionStorage.setItem("currentResult", JSON.stringify(result));
      router.push("/results");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">weeknight</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Tell it what you have. Get dinner on the table.
        </p>
      </div>

      {/* Ingredient Input */}
      <IngredientInput ingredients={ingredients} onChange={setIngredients} />

      {/* Time Limit */}
      <TimeSlider value={timeLimit} onChange={setTimeLimit} />

      {/* Preferences */}
      <PreferenceChips preferences={preferences} onChange={setPreferences} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Submit */}
      {loading ? (
        <div className="space-y-4">
          <p className="text-center text-stone-500 text-sm animate-pulse">{loadingMsg}</p>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={ingredients.length < 2}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-lg rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Cook Something 🍳
        </button>
      )}
    </div>
  );
}
