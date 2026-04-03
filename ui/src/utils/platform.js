import { Dimensions, Linking, Platform } from "react-native";

const LAST_ACTIVE_CHAT_MEMORY = { value: "" };

export const isWeb = Platform.OS === "web";

export const getIsCompactLayout = () => {
  if (isWeb && typeof window !== "undefined") {
    return window.innerWidth <= 940;
  }

  return Dimensions.get("window").width <= 940;
};

export const subscribeToViewportChange = (callback) => {
  if (typeof callback !== "function") {
    return () => {};
  }

  if (isWeb && typeof window !== "undefined") {
    const handler = () => callback(getIsCompactLayout());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }

  const subscription = Dimensions.addEventListener("change", ({ window: nextWindow }) => {
    callback(nextWindow.width <= 940);
  });

  return () => subscription?.remove?.();
};

export const getStoredLastActiveChatId = () => {
  if (isWeb && typeof localStorage !== "undefined") {
    return localStorage.getItem("mapai_last_active_chat_id") || "";
  }

  return LAST_ACTIVE_CHAT_MEMORY.value;
};

export const setStoredLastActiveChatId = (value) => {
  const nextValue = String(value || "");

  if (isWeb && typeof localStorage !== "undefined") {
    localStorage.setItem("mapai_last_active_chat_id", nextValue);
    return;
  }

  LAST_ACTIVE_CHAT_MEMORY.value = nextValue;
};

export const requestCurrentLocation = () =>
  new Promise((resolve, reject) => {
    const geolocation = typeof navigator !== "undefined" ? navigator.geolocation : undefined;
    if (!geolocation?.getCurrentPosition) {
      reject(new Error("Location is not available on this platform."));
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        });
      },
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

export const copyText = async (value) => {
  const text = String(value || "");
  if (!text) return false;

  const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  if (!clipboard?.writeText) {
    return false;
  }

  await clipboard.writeText(text);
  return true;
};

export const openExternalUrl = async (url) => {
  const href = String(url || "").trim();
  if (!href) return false;

  try {
    await Linking.openURL(href);
    return true;
  } catch {
    return false;
  }
};
