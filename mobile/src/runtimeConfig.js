const readValue = (...keys) => {
  const env = typeof process !== "undefined" ? process.env : undefined;
  if (!env || typeof env !== "object") {
    return "";
  }

  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const getApiBaseUrl = () => readValue("EXPO_PUBLIC_API_BASE_URL");

export const isApiConfigured = () => Boolean(getApiBaseUrl());

export const buildApiUrl = (path) => {
  const rawPath = String(path || "");
  if (!rawPath) return rawPath;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return rawPath;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  return new URL(normalizedPath, normalizedBase).toString();
};
