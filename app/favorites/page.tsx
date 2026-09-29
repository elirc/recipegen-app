"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";
import { getFavorites, toggleFavorite } from "@/lib/storage";
import RecipeCard from "@/components/RecipeCard";

function formatDate(iso: string) {
  // favorites don't have a timestamp, but we can show nothing
  return "";
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Re-load after unfavoriting
  function handleUnfavorite() {
    setFavorites(getFavorites());
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center space-y-3">
        <div className="text-5xl">⭐</div>
        <h2 className="text-lg font-bold text-stone-700">No favorites yet</h2>
        <p className="text-stone-500 text-sm">
          Tap the ☆ on any recipe to save it here for later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-xl font-bold text-stone-800">Favorites</h1>
      <div className="space-y-3">
        {favorites.map((recipe) => (
          <div key={recipe.id} onClick={handleUnfavorite}>
            <RecipeCard recipe={recipe} />
          </div>
        ))}
      </div>
    </div>
  );
}
