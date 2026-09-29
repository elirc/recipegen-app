"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";
import { isFavorite, toggleFavorite } from "@/lib/storage";
import { formatAmount, scaleAmount } from "@/lib/scaling";
import ServingAdjuster from "./ServingAdjuster";
import GroceryList from "./GroceryList";
import ShareButton from "./ShareButton";

interface RecipeCardProps {
  recipe: Recipe;
  defaultExpanded?: boolean;
}

export default function RecipeCard({ recipe, defaultExpanded = false }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [servings, setServings] = useState(recipe.servings);
  const [favorited, setFavorited] = useState(false);
  const [favToast, setFavToast] = useState("");

  useEffect(() => {
    setFavorited(isFavorite(recipe.id));
  }, [recipe.id]);

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    toggleFavorite(recipe);
    const next = !favorited;
    setFavorited(next);
    setFavToast(next ? "Saved to favorites!" : "Removed from favorites");
    setTimeout(() => setFavToast(""), 2000);
  }

  const difficultyColor =
    recipe.difficulty === "easy"
      ? "bg-green-100 text-green-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all">
      {/* Toast */}
      {favToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-sm px-4 py-2 rounded-full z-50 pointer-events-none">
          {favToast}
        </div>
      )}

      {/* Header — always visible */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-stone-800 text-lg leading-snug">{recipe.title}</h2>
            <p className="text-stone-500 text-sm mt-1 leading-relaxed">{recipe.description}</p>
          </div>

          <button
            onClick={handleFavorite}
            className="flex-shrink-0 text-2xl mt-0.5 transition-transform active:scale-110"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {favorited ? "⭐" : "☆"}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-stone-600 font-medium">
            ⏱ {recipe.totalMinutes} min
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${difficultyColor}`}>
            {recipe.difficulty}
          </span>
          {recipe.missingIngredient && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              Needs: {recipe.missingIngredient.name} → sub: {recipe.missingIngredient.substitute}
            </span>
          )}
          <span className="ml-auto text-stone-400 text-sm">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-4">
          {/* Serving adjuster */}
          <ServingAdjuster
            base={recipe.servings}
            current={servings}
            onChange={setServings}
          />

          {/* Ingredients */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              Ingredients
            </h3>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, idx) => {
                const scaled = scaleAmount(ing.amount, recipe.servings, servings);
                const display = `${formatAmount(scaled)} ${ing.unit} ${ing.name}`;
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ing.isFromUser ? "bg-orange-400" : "bg-blue-400"}`} />
                    <span className={ing.isFromUser ? "text-stone-700" : "text-stone-500"}>
                      {display}
                    </span>
                    {!ing.isFromUser && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                        extra
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {recipe.ingredients.some((i) => !i.isFromUser) && (
              <p className="text-xs text-stone-400 mt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1" />
                yours
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mx-1 ml-3" />
                extra needed
              </p>
            )}
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              Instructions
            </h3>
            <ol className="space-y-3">
              {recipe.steps
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <li key={step.order} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {step.order}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-stone-700 leading-relaxed">{step.instruction}</p>
                      {step.durationMinutes && (
                        <p className="text-xs text-stone-400 mt-0.5">⏱ {step.durationMinutes} min</p>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-stone-100">
            <GroceryList
              ingredients={recipe.ingredients}
              baseServings={recipe.servings}
              currentServings={servings}
            />
            <ShareButton recipe={recipe} />
          </div>
        </div>
      )}
    </div>
  );
}
