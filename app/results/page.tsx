"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { GenerationResult, Recipe, Preferences } from "@/lib/types";
import { saveToHistory } from "@/lib/storage";

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

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("currentResult");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.replace("/");
    }
  }, [router]);

  async function getMore() {
    if (!result) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: result.inputIngredients,
          timeLimit: result.timeLimit,
          preferences: result.preferences,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't get more recipes. Try again.");
        return;
      }

      const recipes: Recipe[] = data.recipes;
      const newResult: GenerationResult = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        inputIngredients: result.inputIngredients,
        timeLimit: result.timeLimit,
        preferences: result.preferences as Preferences,
        recipes,
      };

      saveToHistory(newResult);
      sessionStorage.setItem("currentResult", JSON.stringify(newResult));
      setResult(newResult);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!result) return null;

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Your recipes</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {result.inputIngredients.slice(0, 3).join(", ")}
            {result.inputIngredients.length > 3 ? ` +${result.inputIngredients.length - 3} more` : ""}
            {" · "}
            {result.timeLimit} min
          </p>
        </div>
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
          ← Start over
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Recipe Cards */}
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <div className="space-y-3">
          {result.recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Get more */}
      {!loading && (
        <button
          onClick={getMore}
          className="w-full py-3.5 border-2 border-orange-300 text-orange-600 font-semibold rounded-2xl hover:bg-orange-50 transition-colors"
        >
          Give Me 3 More 🔄
        </button>
      )}
    </div>
  );
}
