import { useEffect, useState } from "react";
import { View } from "react-native";
import ChatPanel from "./components/ChatPanel";
import MapPanel from "./components/MapPanel";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import { styles } from "./styles/appStyles";

const initialAssistant = {
  role: "assistant",
  text: "Hi! I can answer normal questions and find places on map. Try: find coffee shops in Batam."
};
const LAST_ACTIVE_CHAT_KEY = "mapai_last_active_chat_id";

const createChatSession = (session = {}) => ({
  id: session.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: session.title || "New chat",
  pinned: Boolean(session.pinned),
  archived: Boolean(session.archived),
  messages: session.messages || [initialAssistant],
  places: [],
  selectedPlaceIndex: 0,
  loaded: Boolean(session.messages)
});

const toChatTitle = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
};

const modelRank = (name) => {
  const value = String(name || "").toLowerCase();
  const versionMatch = value.match(/(\d+(?:\.\d+)+)/);
  const sizeMatch = value.match(/:(\d+(?:\.\d+)?)([bm])/);

  const versionScore = versionMatch ? Number(versionMatch[1].replace(/\./g, "")) : 0;
  const sizeValue = sizeMatch ? Number(sizeMatch[1]) : 0;
  const sizeUnit = sizeMatch?.[2] === "b" ? 1 : 0;

  return versionScore * 10_000 + sizeValue * 10 + sizeUnit;
};

const pickHighestModel = (models) => {
  if (!models.length) return "";
  return [...models].sort((a, b) => modelRank(b) - modelRank(a))[0];
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
  if (typeof meta === "number" || typeof meta === "boolean") return String(meta);

  if (typeof meta === "object") {
    return meta;
  }

  return undefined;
};

const extractLatestMapState = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const meta = message?.meta;
    if (!meta || typeof meta !== "object") continue;
    if (meta.type !== "map_result") continue;
    const places = Array.isArray(meta.places) ? meta.places : [];
    if (places.length === 0) continue;
    const selectedPlaceIndex = Number(meta.selectedPlaceIndex || 0);
    return { places, selectedPlaceIndex };
  }
  return { places: [], selectedPlaceIndex: 0 };
};

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [chatView, setChatView] = useState("active");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [browserLocation, setBrowserLocation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [inputHint, setInputHint] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refreshChatSessions = async (preferredChatId = "", view = chatView) => {
    const normalizedView = view === "archived" ? "archived" : "active";
    const response = await fetch(`/api/chats?view=${encodeURIComponent(normalizedView)}`);
    const data = await response.json();
    const chats = data?.chats || [];
    if (chats.length > 0) {
      setChatSessions(chats.map((chat) => createChatSession({ id: chat.id, title: chat.title, pinned: chat.pinned, archived: chat.archived, messages: null })));
      const savedLastActiveId = localStorage.getItem(LAST_ACTIVE_CHAT_KEY) || "";
      const nextActiveId =
        (preferredChatId && chats.some((chat) => chat.id === preferredChatId) && preferredChatId) ||
        (savedLastActiveId && chats.some((chat) => chat.id === savedLastActiveId) && savedLastActiveId) ||
        chats[0].id;
      setActiveChatId(nextActiveId);
      return;
    }

    setChatSessions([]);
    setActiveChatId("");
  };

  useEffect(() => {
    if (!activeChatId && chatSessions.length > 0) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [activeChatId, chatSessions]);

  useEffect(() => {
    if (!activeChatId) return;
    localStorage.setItem(LAST_ACTIVE_CHAT_KEY, activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    const initChats = async () => {
      try {
        await refreshChatSessions("", chatView);
        return;
      } catch {
        // Fallback to local ephemeral chat if backend list fails.
      }

      if (chatView === "active") {
        const fallback = createChatSession();
        setChatSessions([fallback]);
        setActiveChatId(fallback.id);
      } else {
        setChatSessions([]);
        setActiveChatId("");
      }
    };

    initChats();
  }, [chatView]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 940;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeChat = chatSessions.find((session) => session.id === activeChatId) || chatSessions[0];

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
    updateActiveChat((session) => ({
      ...session,
      places,
      selectedPlaceIndex
    }));
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`);
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
    if (!activeChat?.id) return;
    if (activeChat.loaded) return;
    loadChatMessages(activeChat.id);
  }, [activeChat?.id, activeChat?.loaded]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        const availableModels = data?.models || [];
        setModels(availableModels);
        if (availableModels.length > 0) {
          setSelectedModel(pickHighestModel(availableModels));
        }
      } catch {
        setModels([]);
      }
    };

    loadModels();
  }, []);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    if (text.length < 5) {
      setInputHint("Type at least 5 characters.");
      return;
    }

    setInputHint("");
    const lastUserPrompt =
      [...(activeChat?.messages || [])].reverse().find((message) => message.role === "user")?.text || "";
    addMessage({ role: "user", text });
    setPrompt("");
    setLoading(true);

    try {
      const body = { prompt: text };
      if (activeChat?.id) body.chatId = activeChat.id;
      if (selectedModel) body.model = selectedModel;
      if (lastUserPrompt) {
        body.context = {
          lastUserPrompt
        };
      }
      if (browserLocation) body.browserLocation = browserLocation;

      const response = await fetch("/api/assistant", {
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
          places: data.places || [],
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

  const handleUseLocation = () => {
    if (browserLocation) {
      addMessage({ role: "assistant", text: "Location is already enabled." });
      return;
    }

    if (!navigator.geolocation) {
      addMessage({ role: "assistant", text: "Browser geolocation is not supported." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserLocation({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        });
        addMessage({ role: "assistant", text: "Location enabled. I will rank places by nearest when available." });
      },
      (error) => {
        addMessage({ role: "assistant", text: `Unable to get location: ${error.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    if (!meta || typeof meta !== "object") return;
    const places = Array.isArray(meta.places) ? meta.places : [];
    if (places.length === 0) return;
    const selectedIndex = Number(meta.selectedPlaceIndex || 0);
    setActivePlaces(places, selectedIndex);
    setIsRecommendationOpen(true);
  };

  const shouldShowRecommendations = isRecommendationOpen;

  const handleNewChat = () => {
    const createRemoteChat = async () => {
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat" })
        });
        const chat = await response.json();
        const newSession = createChatSession({ id: chat.id, title: chat.title, pinned: chat.pinned, archived: chat.archived, messages: null });
        if (chatView !== "active") {
          setChatView("active");
          await refreshChatSessions(chat.id, "active");
        } else {
          setChatSessions((current) => [newSession, ...current]);
          setActiveChatId(newSession.id);
        }
        setPrompt("");
        if (isMobile) setIsSidebarOpen(false);
      } catch {
        const newSession = createChatSession();
        if (chatView !== "active") {
          setChatView("active");
        }
        setChatSessions((current) => [newSession, ...current]);
        setActiveChatId(newSession.id);
        setPrompt("");
        if (isMobile) setIsSidebarOpen(false);
      }
    };

    createRemoteChat();
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleRenameChat = async (chatId, title) => {
    try {
      await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      await refreshChatSessions(activeChat?.id || chatId, chatView);
    } catch {
      // no-op
    }
  };

  const handlePinChat = async (chatId, pinned) => {
    try {
      await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned })
      });
      await refreshChatSessions(activeChat?.id || chatId, chatView);
    } catch {
      // no-op
    }
  };

  const handleArchiveChat = async (chatId, archived = true) => {
    try {
      await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived })
      });
      await refreshChatSessions(activeChat?.id === chatId ? "" : activeChat?.id || "", chatView);
    } catch {
      // no-op
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "DELETE"
      });
      await refreshChatSessions(activeChat?.id === chatId ? "" : activeChat?.id || "", chatView);
    } catch {
      // no-op
    }
  };

  const handleSelectPlace = (index) => {
    updateActiveChat((session) => ({
      ...session,
      selectedPlaceIndex: index
    }));
  };

  const handleClearCurrentMemory = async () => {
    if (!activeChat?.id) return;
    try {
      await fetch("/api/memory/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "current",
          chatId: activeChat.id
        })
      });
    } finally {
      setIsSettingsOpen(false);
      const response = await fetch(`/api/chats?view=${encodeURIComponent(chatView)}`);
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
      } else {
        if (chatView === "active") {
          handleNewChat();
        } else {
          setChatSessions([]);
          setActiveChatId("");
        }
      }
    }
  };

  const handleClearAllMemory = async () => {
    try {
      await fetch("/api/memory/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" })
      });
    } finally {
      setIsSettingsOpen(false);
      handleNewChat();
    }
  };

  return (
    <View style={styles.layout} className="app-layout">
      {(!isMobile || isSidebarOpen) ? (
        <Sidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onToggle={() => setIsSidebarOpen((current) => !current)}
          chatView={chatView}
          onChangeChatView={setChatView}
          sessions={chatSessions}
          activeChatId={activeChat?.id}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRenameChat={handleRenameChat}
          onPinChat={handlePinChat}
          onArchiveChat={(chatId) => handleArchiveChat(chatId, true)}
          onUnarchiveChat={(chatId) => handleArchiveChat(chatId, false)}
          onDeleteChat={handleDeleteChat}
        />
      ) : null}
      <ChatPanel
        messages={activeChat?.messages || [initialAssistant]}
        prompt={prompt}
        loading={loading}
        isMobile={isMobile}
        onPromptChange={handlePromptChange}
        onSend={handleSend}
        onUseLocation={handleUseLocation}
        inputHint={inputHint}
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        isRecommendationOpen={shouldShowRecommendations}
        onToggleRecommendations={() => setIsRecommendationOpen((current) => !current)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onEditLastUserMessage={handleEditLastUserMessage}
        onShowMapFromMessage={handleShowMapFromMessage}
      />
      {shouldShowRecommendations ? (
        <MapPanel
          isMobile={isMobile}
          places={activeChat?.places || []}
          selectedIndex={activeChat?.selectedPlaceIndex || 0}
          onSelect={handleSelectPlace}
          onClose={() => setIsRecommendationOpen(false)}
        />
      ) : null}
      {isSettingsOpen ? (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onClearCurrent={handleClearCurrentMemory}
          onClearAll={handleClearAllMemory}
          canClearCurrent={Boolean(activeChat?.id)}
        />
      ) : null}
    </View>
  );
}

export default App;
