"use client";

const OPTIONS = [15, 30, 45, 60] as const;

interface TimeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function TimeSlider({ value, onChange }: TimeSliderProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
        Time limit
      </label>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              value === opt
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            aria-pressed={value === opt}
          >
            {opt}m
          </button>
        ))}
      </div>
    </div>
  );
}
