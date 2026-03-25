import { useState } from "react";
import { View } from "react-native";
import ChatPanel from "./components/ChatPanel";
import MapPanel from "./components/MapPanel";
import Sidebar from "./components/Sidebar";
import { styles } from "./styles/appStyles";

const initialAssistant = {
  role: "assistant",
  text: "Hi! I can answer normal questions and find places on map. Try: find coffee shops in Batam."
};

function App() {
  const [messages, setMessages] = useState([initialAssistant]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [browserLocation, setBrowserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(0);

  const addMessage = (message) => {
    setMessages((current) => [...current, message]);
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || loading) return;

    addMessage({ role: "user", text });
    setPrompt("");
    setLoading(true);

    try {
      const body = { prompt: text };
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
        setPlaces([]);
        return;
      }

      if (data.mode === "chat") {
        addMessage({ role: "assistant", text: data.assistantMessage || data.answer || "(No answer)" });
        setPlaces([]);
        return;
      }

      addMessage({
        role: "assistant",
        text: data.assistantMessage || "Here are your recommendations.",
        meta: `provider=${data.provider || "-"}, results=${data.totalResults || 0}`
      });
      setPlaces(data.places || []);
      setSelectedPlaceIndex(0);
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

  return (
    <View style={styles.layout}>
      <Sidebar />
      <ChatPanel
        messages={messages}
        prompt={prompt}
        loading={loading}
        onPromptChange={setPrompt}
        onSend={handleSend}
        onUseLocation={handleUseLocation}
      />
      <MapPanel places={places} selectedIndex={selectedPlaceIndex} onSelect={setSelectedPlaceIndex} />
    </View>
  );
}

export default App;
