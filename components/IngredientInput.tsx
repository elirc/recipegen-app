"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

const COMMON_INGREDIENTS = [
  "chicken breast", "chicken thighs", "ground beef", "ground turkey", "salmon", "shrimp",
  "eggs", "bacon", "sausage", "tofu", "chickpeas", "lentils", "black beans", "kidney beans",
  "rice", "pasta", "spaghetti", "penne", "quinoa", "bread", "tortillas", "noodles",
  "onion", "garlic", "tomatoes", "bell pepper", "broccoli", "spinach", "kale", "zucchini",
  "mushrooms", "carrots", "potatoes", "sweet potatoes", "cucumber", "celery", "corn",
  "green beans", "asparagus", "cauliflower", "cabbage", "peas", "avocado", "lemon", "lime",
  "milk", "butter", "cheddar cheese", "mozzarella", "parmesan", "cream cheese", "yogurt",
  "heavy cream", "sour cream", "olive oil", "vegetable oil", "sesame oil",
  "soy sauce", "hot sauce", "worcestershire sauce", "fish sauce", "balsamic vinegar",
  "tomato paste", "canned tomatoes", "coconut milk", "chicken broth", "beef broth",
  "flour", "cornstarch", "breadcrumbs", "panko",
  "ginger", "chili flakes", "cumin", "paprika", "turmeric", "oregano", "thyme", "basil",
  "rosemary", "cilantro", "parsley", "green onions", "jalapeño", "sriracha",
  "honey", "maple syrup", "sugar", "brown sugar", "dijon mustard", "mayonnaise",
  "peanut butter", "tahini", "canned tuna", "frozen shrimp",
];

interface IngredientInputProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
}

export default function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const lower = input.toLowerCase();
    const matches = COMMON_INGREDIENTS.filter(
      (i) => i.includes(lower) && !ingredients.includes(i)
    ).slice(0, 6);
    setSuggestions(matches);
    setActiveSuggestion(-1);
  }, [input, ingredients]);

  function addIngredient(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || ingredients.includes(trimmed)) return;
    onChange([...ingredients, trimmed]);
    setInput("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function removeIngredient(ing: string) {
    onChange(ingredients.filter((i) => i !== ing));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        addIngredient(suggestions[activeSuggestion]);
      } else {
        addIngredient(input);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
    } else if (e.key === "Backspace" && input === "" && ingredients.length > 0) {
      removeIngredient(ingredients[ingredients.length - 1]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Ingredients you have
        </label>
        {ingredients.length >= 2 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-stone-400 hover:text-orange-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        className="min-h-[52px] w-full rounded-2xl border-2 border-stone-200 bg-white px-3 py-2 flex flex-wrap gap-2 items-center cursor-text focus-within:border-orange-400 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {ingredients.map((ing) => (
          <span
            key={ing}
            className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full"
          >
            {ing}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeIngredient(ing);
              }}
              className="ml-0.5 hover:text-orange-600 text-orange-400 leading-none"
              aria-label={`Remove ${ing}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder={ingredients.length === 0 ? "Type an ingredient, press Enter…" : "Add more…"}
          className="flex-1 min-w-[140px] outline-none text-sm text-stone-800 placeholder-stone-400 bg-transparent"
          aria-label="Add ingredient"
          aria-autocomplete="list"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden z-10 relative">
          {suggestions.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => addIngredient(s)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === activeSuggestion
                  ? "bg-orange-50 text-orange-700"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {ingredients.length > 0 && ingredients.length < 2 && (
        <p className="text-xs text-stone-400">Add at least one more ingredient to get started</p>
      )}
    </div>
  );
}
