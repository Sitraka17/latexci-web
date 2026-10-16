"use client";
import { toggleFavourite, type FavouriteSymbol } from "@/lib/favourites";
import { useFavouriteSymbols } from "@/components/useFavouriteSymbols";

/**
 * "Save to favourites" toggle for a symbol page. The page stays static: the
 * server renders the unpressed state and the saved state appears on mount.
 */
export default function FavouriteButton({ symbol }: { symbol: FavouriteSymbol }) {
  const saved = useFavouriteSymbols().some((f) => f.slug === symbol.slug);
  return (
    <button
      type="button"
      className="btn btn-sm fav-btn"
      aria-pressed={saved}
      title={saved ? "Saved in this browser. Click to remove it from your favourites." : "Keep this symbol at the top of the symbol search, in this browser only"}
      onClick={() => toggleFavourite(symbol)}
    >
      <span aria-hidden="true" className="fav-star">{saved ? "★" : "☆"}</span>
      {saved ? "Saved" : "Save to favourites"}
    </button>
  );
}
