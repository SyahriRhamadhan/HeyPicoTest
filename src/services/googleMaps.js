import axios from "axios";
import { config } from "../config.js";

const toMapsSearchUrl = ({ lat, lng, placeId }) => {
  const query = encodeURIComponent(`${lat},${lng}`);
  const placeIdParam = placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : "";
  return `https://www.google.com/maps/search/?api=1&query=${query}${placeIdParam}`;
};

const toEmbedUrl = ({ lat, lng, placeId }) => {
  if (placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(config.googleMapsApiKey)}&q=place_id:${encodeURIComponent(placeId)}`;
  }

  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(config.googleMapsApiKey)}&q=${encodeURIComponent(`${lat},${lng}`)}`;
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

  const places = (data.results ?? []).slice(0, 5).map((place) => {
    const lat = place.geometry?.location?.lat ?? null;
    const lng = place.geometry?.location?.lng ?? null;
    const placeId = place.place_id ?? null;

    return {
      name: place.name,
      formattedAddress: place.formatted_address,
      rating: place.rating ?? null,
      location: { lat, lng },
      mapsUrl: toMapsSearchUrl({ lat, lng, placeId }),
      embedUrl: toEmbedUrl({ lat, lng, placeId })
    };
  });

  return {
    provider: "google",
    requestQuery,
    totalResults: places.length,
    places
  };
};

export const searchEntityOnGoogleMap = async ({ query }) => {
  if (!config.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const requestQuery = query;

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

  const first = (data.results ?? [])[0];
  const places = first
    ? [
        {
          name: first.name,
          formattedAddress: first.formatted_address,
          rating: first.rating ?? null,
          location: {
            lat: first.geometry?.location?.lat ?? null,
            lng: first.geometry?.location?.lng ?? null
          },
          mapsUrl: toMapsSearchUrl({
            lat: first.geometry?.location?.lat ?? null,
            lng: first.geometry?.location?.lng ?? null,
            placeId: first.place_id ?? null
          }),
          embedUrl: toEmbedUrl({
            lat: first.geometry?.location?.lat ?? null,
            lng: first.geometry?.location?.lng ?? null,
            placeId: first.place_id ?? null
          })
        }
      ]
    : [];

  return {
    provider: "google",
    requestQuery,
    totalResults: places.length,
    places
  };
};

export const reverseGeocodeGoogle = async ({ lat, lng }) => {
  if (!config.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const { data } = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
    params: {
      latlng: `${lat},${lng}`,
      key: config.googleMapsApiKey
    },
    timeout: 20_000
  });

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Geocode API error: ${data.status}`);
  }

  const first = (data.results ?? [])[0];
  return {
    provider: "google",
    address: first?.formatted_address || "",
    placeId: first?.place_id || null
  };
};
