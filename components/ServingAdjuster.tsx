"use client";

interface ServingAdjusterProps {
  base: number;
  current: number;
  onChange: (n: number) => void;
}

export default function ServingAdjuster({ base, current, onChange }: ServingAdjusterProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Servings</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current <= 1}
          className="w-7 h-7 rounded-full border border-stone-300 text-stone-600 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:border-orange-400 transition-colors"
          aria-label="Decrease servings"
        >
          −
        </button>
        <span className="text-sm font-bold text-stone-800 w-5 text-center">{current}</span>
        <button
          onClick={() => onChange(Math.min(12, current + 1))}
          disabled={current >= 12}
          className="w-7 h-7 rounded-full border border-stone-300 text-stone-600 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:border-orange-400 transition-colors"
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
      {current !== base && (
        <button
          onClick={() => onChange(base)}
          className="text-xs text-stone-400 hover:text-orange-500 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}
