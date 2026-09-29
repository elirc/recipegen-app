export interface Recipe {
  id: string;
  title: string;
  description: string;
  totalMinutes: number;
  difficulty: "easy" | "medium";
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  missingIngredient?: {
    name: string;
    substitute: string;
  } | null;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  isFromUser: boolean;
}

export interface Step {
  order: number;
  instruction: string;
  durationMinutes?: number | null;
}

export interface GenerationResult {
  id: string;
  timestamp: string;
  inputIngredients: string[];
  timeLimit: number;
  preferences: Preferences;
  recipes: Recipe[];
}

export interface Preferences {
  dietary: string[];
  servings: number;
  skillLevel: "easy" | "intermediate";
  allowMissingOne: boolean;
}
