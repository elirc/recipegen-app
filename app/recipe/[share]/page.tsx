import { decodeRecipe } from "@/lib/share";
import Link from "next/link";
import SharedRecipeClient from "./SharedRecipeClient";

interface PageProps {
  params: Promise<{ share: string }>;
}

export default async function SharedRecipePage({ params }: PageProps) {
  const { share } = await params;
  const recipe = decodeRecipe(share);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
        <div className="text-5xl">🤔</div>
        <h2 className="text-xl font-bold text-stone-700">Recipe not found</h2>
        <p className="text-stone-500 text-sm">
          This link looks broken or expired. Sorry about that.
        </p>
        <Link
          href="/"
          className="mt-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          Cook something new
        </Link>
      </div>
    );
  }

  return <SharedRecipeClient recipe={recipe} />;
}
