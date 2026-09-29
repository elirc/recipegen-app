"use client";

import { useState, useEffect } from "react";
import { GenerationResult } from "@/lib/types";
import { getHistory, clearHistory } from "@/lib/storage";
import RecipeCard from "@/components/RecipeCard";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center space-y-3">
        <div className="text-5xl">🍳</div>
        <h2 className="text-lg font-bold text-stone-700">Nothing here yet</h2>
        <p className="text-stone-500 text-sm">Go cook something and your results will show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">History</h1>
        <button
          onClick={handleClear}
          className={`text-sm font-medium transition-colors ${
            confirmClear ? "text-red-600" : "text-stone-400 hover:text-red-500"
          }`}
        >
          {confirmClear ? "Tap again to confirm" : "Clear history"}
        </button>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    {entry.inputIngredients.slice(0, 3).join(", ")}
                    {entry.inputIngredients.length > 3
                      ? ` +${entry.inputIngredients.length - 3} more`
                      : ""}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatDate(entry.timestamp)} · {entry.timeLimit} min
                  </p>
                </div>
                <span className="text-stone-400 text-sm">{expanded === entry.id ? "▲" : "▼"}</span>
              </div>
            </button>

            {expanded === entry.id && (
              <div className="border-t border-stone-100 px-3 pb-3 pt-2 space-y-3">
                {entry.recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
