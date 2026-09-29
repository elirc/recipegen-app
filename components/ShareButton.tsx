"use client";

import { useState } from "react";
import { Recipe } from "@/lib/types";
import { buildShareUrl } from "@/lib/share";

interface ShareButtonProps {
  recipe: Recipe;
}

export default function ShareButton({ recipe }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = buildShareUrl(recipe);
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silent fail
    }
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-600 transition-colors"
      aria-label="Share recipe"
    >
      {copied ? "✓ Link copied!" : "📤 Share"}
    </button>
  );
}
