"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { formatAmount, scaleAmount } from "@/lib/scaling";
import { isFavorite, toggleFavorite } from "@/lib/storage";
import ServingAdjuster from "@/components/ServingAdjuster";

interface SharedRecipeClientProps {
  recipe: Recipe;
}

export default function SharedRecipeClient({ recipe }: SharedRecipeClientProps) {
  const [servings, setServings] = useState(recipe.servings);
  const [favorited, setFavorited] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setFavorited(isFavorite(recipe.id));
  }, [recipe.id]);

  function handleFavorite() {
    toggleFavorite(recipe);
    const next = !favorited;
    setFavorited(next);
    setToast(next ? "Saved to favorites!" : "Removed from favorites");
    setTimeout(() => setToast(""), 2000);
  }

  const difficultyColor =
    recipe.difficulty === "easy"
      ? "bg-green-100 text-green-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-6 pt-2">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-sm px-4 py-2 rounded-full z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-black text-stone-800 leading-tight">{recipe.title}</h1>
          <button
            onClick={handleFavorite}
            className="text-2xl flex-shrink-0 mt-0.5"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {favorited ? "⭐" : "☆"}
          </button>
        </div>
        <p className="text-stone-500 leading-relaxed">{recipe.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-stone-600 font-medium">⏱ {recipe.totalMinutes} min</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${difficultyColor}`}>
            {recipe.difficulty}
          </span>
          {recipe.missingIngredient && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Needs: {recipe.missingIngredient.name} → sub: {recipe.missingIngredient.substitute}
            </span>
          )}
        </div>
      </div>

      {/* Serving adjuster */}
      <ServingAdjuster base={recipe.servings} current={servings} onChange={setServings} />

      {/* Ingredients */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Ingredients
        </h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, idx) => {
            const scaled = scaleAmount(ing.amount, recipe.servings, servings);
            return (
              <li key={idx} className="flex items-center gap-2 text-sm text-stone-700">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ing.isFromUser ? "bg-orange-400" : "bg-blue-400"}`} />
                {formatAmount(scaled)} {ing.unit} {ing.name}
                {!ing.isFromUser && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full ml-auto">
                    extra
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Instructions
        </h2>
        <ol className="space-y-4">
          {recipe.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.order} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">
                  {step.order}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-stone-700 leading-relaxed">{step.instruction}</p>
                  {step.durationMinutes && (
                    <p className="text-xs text-stone-400 mt-1">⏱ {step.durationMinutes} min</p>
                  )}
                </div>
              </li>
            ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="pt-4 border-t border-stone-200">
        <p className="text-sm text-stone-500 mb-3 text-center">
          Want recipes from your own ingredients?
        </p>
        <Link
          href="/"
          className="block w-full text-center py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors"
        >
          Try it yourself 🍳
        </Link>
      </div>
    </div>
  );
}
