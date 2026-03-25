import { config } from "../config.js";

export const isMapIntentPrompt = (prompt) => {
  const text = prompt.toLowerCase();

  return /(find|search|where|lokasi|cari|maps|map|near|dekat|restaurant|cafe|coffee|hotel|beach|pantai|direction|rute|route)/.test(
    text
  );
};

export const hasExplicitLocationInPrompt = (prompt) => /\b(in|di)\s+[a-zA-Z\s]+$/i.test(prompt.trim());

export const needsClarification = ({ prompt, query, browserLocation }) => {
  if (browserLocation) {
    return false;
  }

  const normalizedQuery = String(query || "")
    .toLowerCase()
    .trim();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const genericTerms = new Set([
    "tempat",
    "place",
    "lokasi",
    "location",
    "makan",
    "eat",
    "food",
    "restaurant",
    "coffee",
    "cafe",
    "hotel",
    "wisata",
    "tourist",
    "attraction"
  ]);

  const isTooGeneric = tokens.length <= 2 && tokens.some((token) => genericTerms.has(token));
  const hasExplicitLocation = hasExplicitLocationInPrompt(prompt);

  return isTooGeneric && !hasExplicitLocation;
};

export const resolveLocationForSearch = ({ intentLocation, browserLocation }) => {
  if (intentLocation) {
    return intentLocation || config.defaultLocation;
  }

  if (browserLocation?.lat && browserLocation?.lng) {
    return `${browserLocation.lat},${browserLocation.lng}`;
  }

  return config.defaultLocation;
};

export const toMapsSearchUrlFromLatLng = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;

export const toEmbedUrlFromLatLng = (lat, lng) =>
  `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(config.googleMapsApiKey || "")}&q=${encodeURIComponent(
    `${lat},${lng}`
  )}`;

export const buildMapAssistantMessage = ({ totalResults, location, query, usedBrowserLocation }) => {
  if (!totalResults) {
    return `I couldn't find matching places for "${query}" in ${location}. Please try another keyword or nearby area.`;
  }

  if (usedBrowserLocation) {
    return `Hello! I found ${totalResults} recommendations for "${query}" near your current location. I sorted them by nearest first.`;
  }

  return `Hello! I found ${totalResults} recommendations for "${query}" in ${location}. If you want, I can re-rank them by closest to your current location.`;
};

const deg2rad = (deg) => (deg * Math.PI) / 180;

const haversineKm = (a, b) => {
  const earthRadiusKm = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const p1 = deg2rad(a.lat);
  const p2 = deg2rad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(p1) * Math.cos(p2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadiusKm * c;
};

export const sortPlacesByBrowserLocation = (places, browserLocation) => {
  if (!browserLocation) {
    return places;
  }

  const withDistance = places.map((place) => {
    const lat = place?.location?.lat;
    const lng = place?.location?.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return {
        ...place,
        distanceKm: null
      };
    }

    return {
      ...place,
      distanceKm: Number(
        haversineKm(browserLocation, {
          lat,
          lng
        }).toFixed(2)
      )
    };
  });

  return withDistance.sort((a, b) => {
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });
};

export const limitRecommendations = (places) => {
  const safeMax =
    Number.isFinite(config.maxRecommendations) && config.maxRecommendations > 0
      ? config.maxRecommendations
      : 1;
  return (places ?? []).slice(0, safeMax);
};

