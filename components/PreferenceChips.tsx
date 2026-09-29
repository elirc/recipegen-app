"use client";

import { Preferences } from "@/lib/types";

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"];

interface PreferenceChipsProps {
  preferences: Preferences;
  onChange: (prefs: Preferences) => void;
}

export default function PreferenceChips({ preferences, onChange }: PreferenceChipsProps) {
  function toggleDietary(item: string) {
    const lower = item.toLowerCase();
    const current = preferences.dietary;
    const updated = current.includes(lower)
      ? current.filter((d) => d !== lower)
      : [...current, lower];
    onChange({ ...preferences, dietary: updated });
  }

  function setServings(n: number) {
    onChange({ ...preferences, servings: Math.min(6, Math.max(1, n)) });
  }

  function setSkill(level: "easy" | "intermediate") {
    onChange({ ...preferences, skillLevel: level });
  }

  function toggleMissingOne() {
    onChange({ ...preferences, allowMissingOne: !preferences.allowMissingOne });
  }

  return (
    <div className="space-y-5">
      {/* Dietary */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Dietary
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => {
            const active = preferences.dietary.includes(opt.toLowerCase());
            return (
              <button
                key={opt}
                onClick={() => toggleDietary(opt)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  active
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Servings + Skill */}
      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
            Servings
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings(preferences.servings - 1)}
              disabled={preferences.servings <= 1}
              className="w-9 h-9 rounded-full border-2 border-stone-200 text-stone-600 font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:border-orange-300 transition-colors"
              aria-label="Decrease servings"
            >
              −
            </button>
            <span className="text-lg font-bold text-stone-800 w-6 text-center">
              {preferences.servings}
            </span>
            <button
              onClick={() => setServings(preferences.servings + 1)}
              disabled={preferences.servings >= 6}
              className="w-9 h-9 rounded-full border-2 border-stone-200 text-stone-600 font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:border-orange-300 transition-colors"
              aria-label="Increase servings"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
            Skill
          </label>
          <div className="flex gap-1.5">
            {(["easy", "intermediate"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSkill(level)}
                aria-pressed={preferences.skillLevel === level}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  preferences.skillLevel === level
                    ? "bg-orange-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Allow missing one */}
      <div
        onClick={toggleMissingOne}
        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
          preferences.allowMissingOne
            ? "border-orange-300 bg-orange-50"
            : "border-stone-200 bg-white hover:border-stone-300"
        }`}
        role="checkbox"
        aria-checked={preferences.allowMissingOne}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleMissingOne()}
      >
        <div
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            preferences.allowMissingOne
              ? "border-orange-500 bg-orange-500"
              : "border-stone-300"
          }`}
        >
          {preferences.allowMissingOne && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-700">Allow recipes missing 1 ingredient</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Get more ideas — recipes can need 1 extra item with a substitution
          </p>
        </div>
      </div>
    </div>
  );
}
