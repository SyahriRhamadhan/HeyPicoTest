import { useEffect, useState } from "react";
import { View } from "react-native";
import ChatPanel from "./components/ChatPanel";
import MapPanel from "./components/MapPanel";
import Sidebar from "./components/Sidebar";
import { styles } from "./styles/appStyles";

const initialAssistant = {
  role: "assistant",
  text: "Hi! I can answer normal questions and find places on map. Try: find coffee shops in Batam."
};

const createChatSession = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "New chat",
  messages: [initialAssistant],
  places: [],
  selectedPlaceIndex: 0
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

function App() {
  const [chatSessions, setChatSessions] = useState([createChatSession()]);
  const [activeChatId, setActiveChatId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [browserLocation, setBrowserLocation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [inputHint, setInputHint] = useState("");

  useEffect(() => {
    if (!activeChatId && chatSessions.length > 0) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [activeChatId, chatSessions]);

  const activeChat = chatSessions.find((session) => session.id === activeChatId) || chatSessions[0];

  const updateActiveChat = (updater) => {
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
    addMessage({ role: "user", text });
    setPrompt("");
    setLoading(true);

    try {
      const body = { prompt: text };
      if (selectedModel) body.model = selectedModel;
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

  const shouldShowRecommendations = isRecommendationOpen || (activeChat?.places || []).length > 0;

  const handleNewChat = () => {
    const newSession = createChatSession();
    setChatSessions((current) => [newSession, ...current]);
    setActiveChatId(newSession.id);
    setPrompt("");
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

  return (
    <View style={styles.layout}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
        sessions={chatSessions}
        activeChatId={activeChat?.id}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
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
      />
      {shouldShowRecommendations ? (
        <MapPanel
          places={activeChat?.places || []}
          selectedIndex={activeChat?.selectedPlaceIndex || 0}
          onSelect={handleSelectPlace}
          onClose={() => setIsRecommendationOpen(false)}
        />
      ) : null}
    </View>
  );
}

export default App;
