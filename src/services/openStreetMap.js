import axios from "axios";
import { config } from "../config.js";

const toMapsSearchUrl = (name, address) => {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.openstreetmap.org/search?query=${query}`;
};

const toEmbedUrl = (lat, lng) =>
  `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${lat}%2C${lng}`;

const inferAmenities = (query, placeType = "") => {
  const text = `${query} ${placeType}`.toLowerCase();

  if (/(coffee|cafe|kopi)/.test(text)) {
    return ["cafe"];
  }

  if (/(restaurant|eat|food|dinner|lunch)/.test(text)) {
    return ["restaurant", "fast_food", "food_court"];
  }

  if (/(hotel|stay|accommodation|inn)/.test(text)) {
    return ["hotel", "guest_house"];
  }

  if (/(bar|pub)/.test(text)) {
    return ["bar", "pub"];
  }

  if (/(hospital|clinic|doctor)/.test(text)) {
    return ["hospital", "clinic", "doctors"];
  }

  if (/(atm|bank)/.test(text)) {
    return ["atm", "bank"];
  }

  if (/(pharmacy|apotek)/.test(text)) {
    return ["pharmacy"];
  }

  // For non-amenity POIs (beach, landmarks, tourist spots), we avoid forcing amenity filters.
  if (/(beach|pantai|landmark|tourist|attraction|museum|park|nature)/.test(text)) {
    return [];
  }

  return ["restaurant", "cafe"];
};

const geocodeLocation = async (location) => {
  const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: location,
      format: "jsonv2",
      limit: 1
    },
    headers: {
      "User-Agent": config.osmUserAgent
    },
    timeout: 20_000
  });

  if (!data?.length) {
    throw new Error("OSM geocoding returned no result for the given location.");
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name
  };
};

const searchNominatimText = async (searchText, limit = 5) => {
  const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: searchText,
      format: "jsonv2",
      addressdetails: 1,
      limit
    },
    headers: {
      "User-Agent": config.osmUserAgent
    },
    timeout: 25_000
  });

  return data ?? [];
};

const buildOverpassQuery = (amenities, lat, lng, radius = 10000) => {
  if (!amenities.length) {
    return "";
  }

  const clauses = amenities
    .flatMap((amenity) => [
      `node(around:${radius},${lat},${lng})[amenity=${amenity}];`,
      `way(around:${radius},${lat},${lng})[amenity=${amenity}];`,
      `relation(around:${radius},${lat},${lng})[amenity=${amenity}];`
    ])
    .join("");

  return `[out:json][timeout:40];(${clauses});out center 20;`;
};

const overpassEndpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

const queryOverpass = async (overpassQuery) => {
  let lastError;

  for (const endpoint of overpassEndpoints) {
    try {
      const { data } = await axios.post(
        endpoint,
        new URLSearchParams({ data: overpassQuery }),
        {
          headers: {
            "User-Agent": config.osmUserAgent,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          timeout: 70_000
        }
      );

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const searchPlacesOsm = async ({ query, location, placeType }) => {
  const requestQuery = `${query} in ${location}`;
  const amenities = inferAmenities(query, placeType);
  const geo = await geocodeLocation(location);
  let places = [];

  if (amenities.length > 0) {
    try {
      const overpassQuery = buildOverpassQuery(amenities, geo.lat, geo.lng);
      const data = await queryOverpass(overpassQuery);

      places = (data?.elements ?? []).slice(0, 5).map((place) => {
        const lat = Number(place.lat ?? place.center?.lat);
        const lng = Number(place.lon ?? place.center?.lon);
        const name = place.tags?.name || place.tags?.brand || "Unnamed place";
        const formattedAddress = place.tags?.["addr:full"] || geo.displayName;

        return {
          name,
          formattedAddress,
          rating: null,
          location: { lat, lng },
          mapsUrl: toMapsSearchUrl(name, formattedAddress),
          embedUrl: toEmbedUrl(lat, lng)
        };
      });
    } catch {
      // Overpass is public and can be unstable/time out; continue to text-search fallback.
      places = [];
    }
  }

  // Secondary fallback for unstable Overpass responses:
  // run plain Nominatim text search using keyword + location.
  if (places.length === 0) {
    const fallbackTerms = [
      `${query} ${location}`,
      `${placeType || "place"} ${location}`,
      `tourist attraction ${location}`,
      `cafe ${location}`
    ];

    for (const term of fallbackTerms) {
      let fallbackData = [];

      try {
        fallbackData = await searchNominatimText(term, 5);
      } catch {
        fallbackData = [];
      }

      places = fallbackData.slice(0, 5).map((place) => {
        const lat = Number(place.lat);
        const lng = Number(place.lon);
        const name = place.name || place.display_name?.split(",")?.[0] || "Unknown place";
        const formattedAddress = place.display_name || location;

        return {
          name,
          formattedAddress,
          rating: null,
          location: { lat, lng },
          mapsUrl: toMapsSearchUrl(name, formattedAddress),
          embedUrl: toEmbedUrl(lat, lng)
        };
      });

      if (places.length > 0) {
        break;
      }
    }
  }

  return {
    provider: "openstreetmap",
    requestQuery,
    totalResults: places.length,
    places
  };
};
