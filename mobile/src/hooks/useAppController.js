import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import {
  createLocalChatId,
  createRegion,
  formatLogLine,
  initialAssistant,
  normalizePlaces,
  pickHighestModel
} from "../mobileHelpers";
import { buildApiUrl, getApiBaseUrl, isApiConfigured } from "../runtimeConfig";

const createChatSession = (session = {}) => ({
  id: session.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: session.title || "New chat",
  pinned: Boolean(session.pinned),
  archived: Boolean(session.archived),
  messages: session.messages || [initialAssistant],
  places: session.places || [],
  selectedPlaceIndex: Number(session.selectedPlaceIndex || 0),
  loaded: Boolean(session.messages)
});

const toChatTitle = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
};

const normalizeMessageMeta = (meta) => {
  if (!meta) return undefined;

  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return meta;
    }

    return meta;
  }

  if (typeof meta === "number" || typeof meta === "boolean") {
    return String(meta);
  }

  if (typeof meta === "object") {
    return meta;
  }

  return undefined;
};

const extractLatestMapState = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const meta = message?.meta;
    if (!meta || typeof meta !== "object" || meta.type !== "map_result") continue;

    const places = normalizePlaces(Array.isArray(meta.places) ? meta.places : []);
    if (!places.length) continue;

    return {
      places,
      selectedPlaceIndex: Number(meta.selectedPlaceIndex || 0)
    };
  }

  return { places: [], selectedPlaceIndex: 0 };
};

export const useAppController = () => {
  const [chatView, setChatView] = useState("active");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [browserLocation, setBrowserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [inputHint, setInputHint] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const scrollRef = useRef(null);

  const apiBaseUrl = getApiBaseUrl();
  const apiConfigured = isApiConfigured();
  const activeChat = chatSessions.find((session) => session.id === activeChatId) || chatSessions[0] || null;
  const selectedPlace = activeChat?.places?.[activeChat?.selectedPlaceIndex || 0] || null;
  const mapRegion = useMemo(
    () => createRegion(activeChat?.places || [], activeChat?.selectedPlaceIndex || 0),
    [activeChat?.places, activeChat?.selectedPlaceIndex]
  );

  const appendLog = (level, message) => {
    const line = formatLogLine(level, message);
    if (level === "ERROR") console.error(line);
    else if (level === "WARN") console.warn(line);
    else console.log(line);
  };

  const refreshChatSessions = async (preferredChatId = "", view = chatView) => {
    const normalizedView = view === "archived" ? "archived" : "active";
    const response = await fetch(buildApiUrl(`/api/chats?view=${encodeURIComponent(normalizedView)}`));
    const data = await response.json();
    const chats = data?.chats || [];

    if (chats.length > 0) {
      const sessions = chats.map((chat) =>
        createChatSession({
          id: chat.id,
          title: chat.title,
          pinned: chat.pinned,
          archived: chat.archived,
          messages: null
        })
      );

      setChatSessions(sessions);
      const nextActiveId =
        (preferredChatId && chats.some((chat) => chat.id === preferredChatId) && preferredChatId) ||
        chats[0].id;
      setActiveChatId(nextActiveId);
      return;
    }

    setChatSessions([]);
    setActiveChatId("");
  };

  const updateActiveChat = (updater) => {
    if (!activeChat) return;

    setChatSessions((current) =>
      current.map((session) => (session.id === activeChat.id ? updater(session) : session))
    );
  };

  const addMessage = (message) => {
    updateActiveChat((session) => {
      const nextMessages = [...session.messages, message];
      const shouldSetTitle =
        message.role === "user" &&
        (session.title === "New chat" || session.title === initialAssistant.text);

      return {
        ...session,
        title: shouldSetTitle ? toChatTitle(message.text) : session.title,
        messages: nextMessages
      };
    });
  };

  const setActivePlaces = (places, selectedPlaceIndex = 0) => {
    const normalizedPlaces = normalizePlaces(places);
    updateActiveChat((session) => ({
      ...session,
      places: normalizedPlaces,
      selectedPlaceIndex: Number(selectedPlaceIndex || 0)
    }));
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}/messages`));
      const data = await response.json();
      const messages = (data?.messages || []).map((message) => ({
        role: message.role,
        text: message.text,
        meta: normalizeMessageMeta(message.meta)
      }));
      const restoredMapState = extractLatestMapState(messages);

      setChatSessions((current) =>
        current.map((session) =>
          session.id === chatId
            ? {
                ...session,
                messages: messages.length > 0 ? messages : [initialAssistant],
                places: restoredMapState.places,
                selectedPlaceIndex: restoredMapState.selectedPlaceIndex,
                loaded: true
              }
            : session
        )
      );
    } catch {
      setChatSessions((current) =>
        current.map((session) =>
          session.id === chatId
            ? {
                ...session,
                messages: [initialAssistant],
                loaded: true
              }
            : session
        )
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeChat?.messages?.length]);

  useEffect(() => {
    if (!apiConfigured) {
      setStatusMessage("Set EXPO_PUBLIC_API_BASE_URL in mobile/.env before running on Android.");
      appendLog("WARN", "API base URL is missing.");
      return;
    }

    setStatusMessage(`Connected to backend ${apiBaseUrl}`);
    appendLog("INFO", `API configured: ${apiBaseUrl}`);
  }, [apiBaseUrl, apiConfigured]);

  useEffect(() => {
    const initChats = async () => {
      if (!apiConfigured) {
        const fallback = createChatSession({ id: createLocalChatId() });
        setChatSessions([fallback]);
        setActiveChatId(fallback.id);
        return;
      }

      try {
        await refreshChatSessions("", chatView);
        return;
      } catch (error) {
        appendLog("WARN", `Failed to load chat list: ${error.message}`);
      }

      const fallback = createChatSession({ id: createLocalChatId() });
      setChatSessions([fallback]);
      setActiveChatId(fallback.id);
    };

    initChats();
  }, [apiConfigured, chatView]);

  useEffect(() => {
    if (!apiConfigured) return;

    const bootstrap = async () => {
      appendLog("INFO", "Bootstrapping mobile app.");
      try {
        const response = await fetch(buildApiUrl("/api/models"));
        const data = await response.json();
        const availableModels = data?.models || [];
        setModels(availableModels);
        appendLog("INFO", `Loaded ${availableModels.length} models.`);
        if (availableModels.length > 0) {
          setSelectedModel(pickHighestModel(availableModels));
        }
      } catch (error) {
        appendLog("ERROR", `Failed loading models: ${error.message}`);
        setModels([]);
      }
    };

    bootstrap();
  }, [apiConfigured]);

  useEffect(() => {
    if (!activeChat?.id || activeChat.loaded || !apiConfigured) return;
    loadChatMessages(activeChat.id);
  }, [activeChat?.id, activeChat?.loaded, apiConfigured]);

  const handleUseLocation = async () => {
    appendLog("INFO", "Requesting location permission.");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationLabel("Location permission denied.");
      addMessage({ role: "assistant", text: "Location permission denied." });
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    const nextLocation = {
      lat: Number(current.coords.latitude),
      lng: Number(current.coords.longitude)
    };

    setBrowserLocation(nextLocation);
    setLocationLabel(`${nextLocation.lat.toFixed(5)}, ${nextLocation.lng.toFixed(5)}`);
    addMessage({
      role: "assistant",
      text: "Location enabled. I will rank places by nearest when available."
    });
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || loading || !activeChat) return;

    if (!apiConfigured) {
      setInputHint("Set EXPO_PUBLIC_API_BASE_URL first.");
      return;
    }

    if (text.length < 5) {
      setInputHint("Type at least 5 characters.");
      return;
    }

    setInputHint("");
    const lastUserPrompt =
      [...(activeChat.messages || [])].reverse().find((message) => message.role === "user")?.text || "";

    addMessage({ role: "user", text });
    setPrompt("");
    setLoading(true);
    setIsModelMenuOpen(false);

    try {
      const body = { prompt: text };
      if (activeChat.id) body.chatId = activeChat.id;
      if (selectedModel) body.model = selectedModel;
      if (lastUserPrompt) body.context = { lastUserPrompt };
      if (browserLocation) body.browserLocation = browserLocation;

      const response = await fetch(buildApiUrl("/api/assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        addMessage({ role: "assistant", text: `Error: ${data.message || data.error || "Request failed"}` });
        return;
      }

      if (data.needsClarification) {
        addMessage({
          role: "assistant",
          text: data.assistantMessage || data.clarificationQuestion || "Need more context."
        });
        setActivePlaces([]);
        return;
      }

      if (data.mode === "chat") {
        addMessage({ role: "assistant", text: data.assistantMessage || data.answer || "(No answer)" });
        setActivePlaces([]);
        return;
      }

      addMessage({
        role: "assistant",
        text: data.assistantMessage || "Here are your recommendations.",
        meta: {
          type: "map_result",
          provider: data.provider || "-",
          results: Number(data.totalResults || 0),
          totalResults: Number(data.totalResults || 0),
          requestQuery: data.requestQuery || null,
          places: normalizePlaces(data.places || []),
          selectedPlaceIndex: 0
        }
      });

      setActivePlaces(data.places || [], 0);
      if ((data.places || []).length > 0) {
        setIsRecommendationOpen(true);
      }
    } catch (error) {
      addMessage({ role: "assistant", text: `Network error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChange = (value) => {
    setPrompt(value);
    if (value.trim().length >= 5 || value.trim().length === 0) {
      setInputHint("");
    }
  };

  const handleEditLastUserMessage = (text) => {
    setPrompt(String(text || ""));
    setInputHint("");
  };

  const handleShowMapFromMessage = (meta) => {
    if (!meta || typeof meta !== "object") {
      appendLog("WARN", "Show in map ignored: message meta is missing or invalid.");
      return;
    }

    appendLog(
      "INFO",
      `Show in map clicked. provider=${meta.provider || "-"}, results=${Number(meta.totalResults || 0)}`
    );

    const places = normalizePlaces(Array.isArray(meta.places) ? meta.places : []);
    if (places.length === 0) {
      appendLog("WARN", "Show in map failed: no valid coordinates found in message meta.");
      return;
    }

    const selectedIndex = Number(meta.selectedPlaceIndex || 0);
    appendLog("INFO", `Show in map normalized ${places.length} places. selectedIndex=${selectedIndex}`);
    setActivePlaces(places, selectedIndex);
    setIsRecommendationOpen(true);
    appendLog("INFO", "Recommendation panel opened from message action.");
  };

  const handleNewChat = async () => {
    if (!apiConfigured) {
      const newSession = createChatSession({ id: createLocalChatId() });
      setChatSessions((current) => [newSession, ...current]);
      setActiveChatId(newSession.id);
      setPrompt("");
      setIsSidebarOpen(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/chats"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New chat" })
      });
      const chat = await response.json();
      const newSession = createChatSession({
        id: chat.id,
        title: chat.title,
        pinned: chat.pinned,
        archived: chat.archived,
        messages: null
      });

      if (chatView !== "active") {
        setChatView("active");
        await refreshChatSessions(chat.id, "active");
      } else {
        setChatSessions((current) => [newSession, ...current]);
        setActiveChatId(newSession.id);
      }
    } catch (error) {
      appendLog("WARN", `New chat fallback: ${error.message}`);
      const newSession = createChatSession({ id: createLocalChatId() });
      setChatSessions((current) => [newSession, ...current]);
      setActiveChatId(newSession.id);
    }

    setPrompt("");
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
  };

  const handleRenameChat = async (chatId, title) => {
    try {
      await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      await refreshChatSessions(activeChat?.id || chatId, chatView);
    } catch {}
  };

  const handlePinChat = async (chatId, pinned) => {
    try {
      await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned })
      });
      await refreshChatSessions(activeChat?.id || chatId, chatView);
    } catch {}
  };

  const handleArchiveChat = async (chatId, archived = true) => {
    try {
      await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived })
      });
      await refreshChatSessions(activeChat?.id === chatId ? "" : activeChat?.id || "", chatView);
    } catch {}
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
        method: "DELETE"
      });
      await refreshChatSessions(activeChat?.id === chatId ? "" : activeChat?.id || "", chatView);
    } catch {}
  };

  const handleSelectPlace = (index) => {
    updateActiveChat((session) => ({
      ...session,
      selectedPlaceIndex: index
    }));
  };

  const reloadChatsAfterClear = async () => {
    if (!apiConfigured) {
      const fallback = createChatSession({ id: createLocalChatId() });
      setChatSessions([fallback]);
      setActiveChatId(fallback.id);
      return;
    }

    const response = await fetch(buildApiUrl(`/api/chats?view=${encodeURIComponent(chatView)}`));
    const data = await response.json();
    const chats = data?.chats || [];

    if (chats.length > 0) {
      setChatSessions(
        chats.map((chat) =>
          createChatSession({
            id: chat.id,
            title: chat.title,
            pinned: chat.pinned,
            archived: chat.archived,
            messages: null
          })
        )
      );
      setActiveChatId(chats[0].id);
      return;
    }

    if (chatView === "active") {
      await handleNewChat();
    } else {
      setChatSessions([]);
      setActiveChatId("");
    }
  };

  const handleClearCurrentMemory = async () => {
    if (!activeChat?.id || !apiConfigured) return;

    try {
      await fetch(buildApiUrl("/api/memory/clear"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "current",
          chatId: activeChat.id
        })
      });
    } finally {
      setIsSettingsOpen(false);
      await reloadChatsAfterClear();
    }
  };

  const handleClearAllMemory = async () => {
    if (!apiConfigured) return;

    try {
      await fetch(buildApiUrl("/api/memory/clear"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" })
      });
    } finally {
      setIsSettingsOpen(false);
      await handleNewChat();
    }
  };

  const handleCopyMessage = async (text) => {
    await Clipboard.setStringAsync(String(text || ""));
  };

  const handleOpenDirections = async () => {
    const selected = activeChat?.places?.[activeChat?.selectedPlaceIndex || 0] || activeChat?.places?.[0];
    if (!selected?.mapsUrl) return;
    await Linking.openURL(selected.mapsUrl);
  };

  return {
    apiConfigured,
    statusMessage,
    locationLabel,
    models,
    selectedModel,
    setSelectedModel,
    isModelMenuOpen,
    setIsModelMenuOpen,
    chatView,
    setChatView,
    chatSessions,
    activeChat,
    activeChatId,
    prompt,
    loading,
    inputHint,
    isSidebarOpen,
    setIsSidebarOpen,
    isRecommendationOpen,
    setIsRecommendationOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    selectedPlace,
    mapRegion,
    scrollRef,
    handleUseLocation,
    handleSend,
    handlePromptChange,
    handleEditLastUserMessage,
    handleShowMapFromMessage,
    handleNewChat,
    handleSelectChat,
    handleRenameChat,
    handlePinChat,
    handleArchiveChat,
    handleDeleteChat,
    handleSelectPlace,
    handleClearCurrentMemory,
    handleClearAllMemory,
    handleCopyMessage,
    handleOpenDirections
  };
};
