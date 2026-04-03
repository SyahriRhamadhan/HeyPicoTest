const readWebConfig = () => {
  const config = globalThis.__MAPAI_WEB_CONFIG__;
  return config && typeof config === "object" ? config : {};
};

const readProcessEnv = () => {
  const env = typeof process !== "undefined" ? process.env : undefined;
  return env && typeof env === "object" ? env : {};
};

const readValue = (...keys) => {
  const webConfig = readWebConfig();
  const processEnv = readProcessEnv();

  for (const key of keys) {
    const fromWebConfig = webConfig[key];
    if (typeof fromWebConfig === "string" && fromWebConfig.trim()) {
      return fromWebConfig.trim();
    }

    const fromProcess = processEnv[key];
    if (typeof fromProcess === "string" && fromProcess.trim()) {
      return fromProcess.trim();
    }
  }

  return "";
};

export const getRuntimeConfig = () => ({
  apiBaseUrl: readValue("VITE_API_BASE_URL", "EXPO_PUBLIC_API_BASE_URL"),
  googleMapsApiKey: readValue("VITE_GOOGLE_MAPS_API_KEY", "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY")
});

export const buildApiUrl = (path) => {
  const rawPath = String(path || "");
  if (!rawPath) return rawPath;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const { apiBaseUrl } = getRuntimeConfig();
  if (!apiBaseUrl) {
    return rawPath;
  }

  const normalizedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const normalizedPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  return new URL(normalizedPath, normalizedBase).toString();
};
