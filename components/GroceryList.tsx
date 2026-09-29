"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import { formatAmount, scaleAmount } from "@/lib/scaling";

interface GroceryListProps {
  ingredients: Ingredient[];
  baseServings: number;
  currentServings: number;
}

export default function GroceryList({ ingredients, baseServings, currentServings }: GroceryListProps) {
  const [copied, setCopied] = useState(false);

  const missing = ingredients.filter((i) => !i.isFromUser);

  if (missing.length === 0) return null;

  async function copyToClipboard() {
    const lines = missing.map((i) => {
      const scaled = scaleAmount(i.amount, baseServings, currentServings);
      return `- ${formatAmount(scaled)} ${i.unit} ${i.name}`;
    });
    const text = `Grocery list:\n${lines.join("\n")}`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback silent fail
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-600 transition-colors"
      aria-label="Copy grocery list"
    >
      <span>{copied ? "✓ Copied!" : "🛒 Grocery list"}</span>
      <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-1.5 py-0.5">
        {missing.length}
      </span>
    </button>
  );
}
