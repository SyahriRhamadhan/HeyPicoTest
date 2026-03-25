import { config } from "../config.js";
import { searchPlaces as searchPlacesGoogle } from "./googleMaps.js";
import { searchPlacesOsm } from "./openStreetMap.js";

const knownProviders = new Set(["auto", "google", "osm"]);

const normalizeProvider = () => {
  const mode = String(config.mapProvider || "auto").toLowerCase();
  return knownProviders.has(mode) ? mode : "auto";
};

export const searchPlaces = async ({ query, location, placeType }) => {
  const mode = normalizeProvider();

  if (mode === "google") {
    return searchPlacesGoogle({ query, location });
  }

  if (mode === "osm") {
    return searchPlacesOsm({ query, location, placeType });
  }

  try {
    return await searchPlacesGoogle({ query, location });
  } catch (error) {
    const result = await searchPlacesOsm({ query, location, placeType });
    return {
      ...result,
      fallbackUsed: true,
      fallbackReason: error?.message || "Google provider failed."
    };
  }
};
