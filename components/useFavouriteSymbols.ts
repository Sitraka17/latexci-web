"use client";
import { useSyncExternalStore } from "react";
import { getFavourites, getServerFavourites, subscribeFavourites, type FavouriteSymbol } from "@/lib/favourites";

/**
 * The saved symbols. The server snapshot is empty, so the first client render
 * matches the static HTML and the real list appears right after hydration.
 */
export function useFavouriteSymbols(): FavouriteSymbol[] {
  return useSyncExternalStore(subscribeFavourites, getFavourites, getServerFavourites);
}
