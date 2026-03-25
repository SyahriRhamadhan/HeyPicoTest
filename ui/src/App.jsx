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

const createChatSession = (session = {}) => ({
  id: session.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: session.title || "New chat",
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
  if (typeof meta === "string") return meta;
  if (typeof meta === "number" || typeof meta === "boolean") return String(meta);

  if (typeof meta === "object") {
    const parts = [];

    if (meta.provider) {
      parts.push(`provider=${meta.provider}`);
    }

    if (meta.results !== undefined) {
      parts.push(`results=${meta.results}`);
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  return undefined;
};

function App() {
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

  useEffect(() => {
    if (!activeChatId && chatSessions.length > 0) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [activeChatId, chatSessions]);

  useEffect(() => {
    const initChats = async () => {
      try {
        const response = await fetch("/api/chats");
        const data = await response.json();
        const chats = data?.chats || [];
        if (chats.length > 0) {
          setChatSessions(chats.map((chat) => createChatSession({ id: chat.id, title: chat.title, messages: null })));
          setActiveChatId(chats[0].id);
          return;
        }
      } catch {
        // Fallback to local ephemeral chat if backend list fails.
      }

      const fallback = createChatSession();
      setChatSessions([fallback]);
      setActiveChatId(fallback.id);
    };

    initChats();
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
      setChatSessions((current) =>
        current.map((session) =>
          session.id === chatId
            ? {
                ...session,
                messages: messages.length > 0 ? messages : [initialAssistant],
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
        meta: `provider=${data.provider || "-"}, results=${data.totalResults || 0}`
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

  const shouldShowRecommendations = isRecommendationOpen || (activeChat?.places || []).length > 0;

  const handleNewChat = () => {
    const createRemoteChat = async () => {
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat" })
        });
        const chat = await response.json();
        const newSession = createChatSession({ id: chat.id, title: chat.title, messages: null });
        setChatSessions((current) => [newSession, ...current]);
        setActiveChatId(newSession.id);
        setPrompt("");
      } catch {
        const newSession = createChatSession();
        setChatSessions((current) => [newSession, ...current]);
        setActiveChatId(newSession.id);
        setPrompt("");
      }
    };

    createRemoteChat();
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
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
      const response = await fetch("/api/chats");
      const data = await response.json();
      const chats = data?.chats || [];
      if (chats.length > 0) {
        setChatSessions(chats.map((chat) => createChatSession({ id: chat.id, title: chat.title, messages: null })));
        setActiveChatId(chats[0].id);
      } else {
        handleNewChat();
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
    <View style={styles.layout}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
        sessions={chatSessions}
        activeChatId={activeChat?.id}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <ChatPanel
        messages={activeChat?.messages || [initialAssistant]}
        prompt={prompt}
        loading={loading}
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
        onEditLastUserMessage={handleEditLastUserMessage}
      />
      {shouldShowRecommendations ? (
        <MapPanel
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
