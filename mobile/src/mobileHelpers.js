export const initialAssistant = {
  role: "assistant",
  text: "Hi! I can answer general questions and search places on the map. Try: find coffee shops in Batam."
};

export const createLocalChatId = () =>
  `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const modelRank = (name) => {
  const value = String(name || "").toLowerCase();
  const versionMatch = value.match(/(\d+(?:\.\d+)+)/);
  const sizeMatch = value.match(/:(\d+(?:\.\d+)?)([bm])/);

  const versionScore = versionMatch ? Number(versionMatch[1].replace(/\./g, "")) : 0;
  const sizeValue = sizeMatch ? Number(sizeMatch[1]) : 0;
  const sizeUnit = sizeMatch?.[2] === "b" ? 1 : 0;

  return versionScore * 10_000 + sizeValue * 10 + sizeUnit;
};

export const pickHighestModel = (models) => {
  if (!models.length) return "";
  return [...models].sort((a, b) => modelRank(b) - modelRank(a))[0];
};

export const normalizePlaces = (places = []) =>
  places
    .map((place, index) => ({
      id: `${place.placeId || place.name || "place"}-${index}`,
      name: place.name || `Place ${index + 1}`,
      formattedAddress: place.formattedAddress || "",
      rating: place.rating ?? null,
      mapsUrl: place.mapsUrl || "",
      latitude: Number(place?.location?.lat),
      longitude: Number(place?.location?.lng)
    }))
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));

export const createRegion = (places, selectedIndex) => {
  const selected = places[selectedIndex] || places[0];
  if (!selected) {
    return {
      latitude: 1.1,
      longitude: 104.0,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15
    };
  }

  return {
    latitude: selected.latitude,
    longitude: selected.longitude,
    latitudeDelta: places.length > 1 ? 0.08 : 0.02,
    longitudeDelta: places.length > 1 ? 0.08 : 0.02
  };
};

export const formatMeta = (message) => {
  const meta = message?.meta;
  if (!meta || typeof meta !== "object") return "";

  const parts = [];
  if (meta.provider) parts.push(`provider=${meta.provider}`);
  if (meta.totalResults !== undefined) parts.push(`results=${meta.totalResults}`);
  return parts.join(", ");
};

export const formatLogLine = (level, message) => {
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  return `${time} [${level}] ${message}`;
};
