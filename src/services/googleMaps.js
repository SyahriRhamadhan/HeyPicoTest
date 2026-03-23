import axios from "axios";
import { config } from "../config.js";

const toMapsSearchUrl = (name, address) => {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

const toEmbedUrl = (name, address) => {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps?q=${query}&output=embed`;
};

export const searchPlaces = async ({ query, location }) => {
  if (!config.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const requestQuery = `${query} in ${location}`;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/textsearch/json",
    {
      params: {
        query: requestQuery,
        key: config.googleMapsApiKey
      },
      timeout: 20_000
    }
  );

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const places = (data.results ?? []).slice(0, 5).map((place) => ({
    name: place.name,
    formattedAddress: place.formatted_address,
    rating: place.rating ?? null,
    location: {
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null
    },
    mapsUrl: toMapsSearchUrl(place.name, place.formatted_address),
    embedUrl: toEmbedUrl(place.name, place.formatted_address)
  }));

  return {
    provider: "google",
    requestQuery,
    totalResults: places.length,
    places
  };
};
