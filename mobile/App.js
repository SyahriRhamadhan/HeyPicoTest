import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { buildApiUrl, getApiBaseUrl, isApiConfigured } from "./src/runtimeConfig";

const initialAssistant = {
  role: "assistant",
  text: "Hi! I can answer general questions and search places on the map. Try: find coffee shops in Batam."
};

const createLocalChatId = () => `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

const normalizePlaces = (places = []) =>
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

const createRegion = (places, selectedIndex) => {
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

const formatMeta = (message) => {
  const meta = message?.meta;
  if (!meta || typeof meta !== "object") return "";

  const parts = [];
  if (meta.provider) parts.push(`provider=${meta.provider}`);
  if (meta.totalResults !== undefined) parts.push(`results=${meta.totalResults}`);
  return parts.join(", ");
};

export default function App() {
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState([initialAssistant]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputHint, setInputHint] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [places, setPlaces] = useState([]);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(0);
  const [locationLabel, setLocationLabel] = useState("");
  const [browserLocation, setBrowserLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const scrollRef = useRef(null);

  const apiBaseUrl = getApiBaseUrl();
  const apiConfigured = isApiConfigured();
  const mapRegion = useMemo(
    () => createRegion(places, selectedPlaceIndex),
    [places, selectedPlaceIndex]
  );

  const appendMessage = (message) => {
    setMessages((current) => [...current, message]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (!apiConfigured) {
      setStatusMessage("Set EXPO_PUBLIC_API_BASE_URL in mobile/.env before running on Android.");
      return;
    }

    setStatusMessage(`Connected to backend ${apiBaseUrl}`);
  }, [apiBaseUrl, apiConfigured]);

  useEffect(() => {
    if (!apiConfigured) return;

    const bootstrap = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/models"));
        const data = await response.json();
        const availableModels = data?.models || [];
        setModels(availableModels);
        if (availableModels.length > 0) {
          setSelectedModel(pickHighestModel(availableModels));
        }
      } catch {
        setModels([]);
      }

      try {
        const response = await fetch(buildApiUrl("/api/chats"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Android chat" })
        });
        const data = await response.json();
        if (data?.id) {
          setChatId(data.id);
          return;
        }
      } catch {
        // Fall through to local chat id.
      }

      setChatId(createLocalChatId());
    };

    bootstrap();
  }, [apiConfigured]);

  const handleUseLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationLabel("Location permission denied.");
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
    appendMessage({
      role: "assistant",
      text: "Location enabled. I will rank places by nearest when available."
    });
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || loading) return;

    if (!apiConfigured) {
      setInputHint("Set EXPO_PUBLIC_API_BASE_URL first.");
      return;
    }

    if (text.length < 5) {
      setInputHint("Type at least 5 characters.");
      return;
    }

    setInputHint("");
    appendMessage({ role: "user", text });
    setPrompt("");
    setLoading(true);

    try {
      const body = { prompt: text };
      if (chatId) body.chatId = chatId;
      if (selectedModel) body.model = selectedModel;
      if (browserLocation) body.browserLocation = browserLocation;

      const response = await fetch(buildApiUrl("/api/assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        appendMessage({
          role: "assistant",
          text: `Error: ${data.message || data.error || "Request failed"}`
        });
        return;
      }

      if (data.needsClarification) {
        appendMessage({
          role: "assistant",
          text: data.assistantMessage || data.clarificationQuestion || "Need more context."
        });
        return;
      }

      if (data.mode === "chat") {
        appendMessage({
          role: "assistant",
          text: data.assistantMessage || data.answer || "(No answer)"
        });
        setPlaces([]);
        setSelectedPlaceIndex(0);
        return;
      }

      const nextPlaces = normalizePlaces(data.places || []);
      setPlaces(nextPlaces);
      setSelectedPlaceIndex(0);
      appendMessage({
        role: "assistant",
        text: data.assistantMessage || "Here are your recommendations.",
        meta: {
          provider: data.provider || "-",
          totalResults: Number(data.totalResults || nextPlaces.length)
        }
      });
    } catch (error) {
      appendMessage({
        role: "assistant",
        text: `Network error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (text) => {
    await Clipboard.setStringAsync(String(text || ""));
  };

  const handleOpenDirections = async () => {
    const selected = places[selectedPlaceIndex] || places[0];
    if (!selected?.mapsUrl) return;
    await Linking.openURL(selected.mapsUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>MapAi Android</Text>
            <Text style={styles.subtleText}>
              Native Android shell for the local backend
            </Text>
          </View>
          <Pressable style={styles.locationButton} onPress={handleUseLocation}>
            <Text style={styles.locationButtonText}>Use location</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Backend</Text>
          <Text style={styles.statusValue}>{statusMessage || "Not configured"}</Text>
          {locationLabel ? <Text style={styles.statusValue}>Location: {locationLabel}</Text> : null}
        </View>

        <View style={styles.modelCard}>
          <Text style={styles.sectionTitle}>Model</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedModel}
              onValueChange={(value) => setSelectedModel(value)}
              enabled={models.length > 0 && !loading}
              dropdownIconColor="#d7deea"
              style={styles.picker}
            >
              {!models.length ? <Picker.Item label="No model" value="" /> : null}
              {models.map((model) => (
                <Picker.Item key={model} label={model} value={model} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.chatCard}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          <ScrollView ref={scrollRef} style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
            {messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[
                  styles.messageRow,
                  message.role === "user" ? styles.messageRowUser : styles.messageRowAssistant
                ]}
              >
                <Pressable
                  onLongPress={() => handleCopyMessage(message.text)}
                  style={[
                    styles.messageBubble,
                    message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                  {formatMeta(message) ? <Text style={styles.metaText}>{formatMeta(message)}</Text> : null}
                </Pressable>
              </View>
            ))}
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#7fc7ff" />
              </View>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.composerCard}>
          {inputHint ? <Text style={styles.inputHint}>{inputHint}</Text> : null}
          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              value={prompt}
              onChangeText={(value) => {
                setPrompt(value);
                if (!value.trim() || value.trim().length >= 5) {
                  setInputHint("");
                }
              }}
              placeholder="Ask anything or search places..."
              placeholderTextColor="#8c99b8"
              multiline
            />
            <Pressable style={styles.sendButton} onPress={handleSend} disabled={loading}>
              <Text style={styles.sendButtonText}>{loading ? "..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {places.length ? (
              <Pressable style={styles.secondaryButton} onPress={handleOpenDirections}>
                <Text style={styles.secondaryButtonText}>Open Maps</Text>
              </Pressable>
            ) : null}
          </View>

          {places.length ? (
            <>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={String(selectedPlaceIndex)}
                  onValueChange={(value) => setSelectedPlaceIndex(Number(value))}
                  dropdownIconColor="#d7deea"
                  style={styles.picker}
                >
                  {places.map((place, index) => (
                    <Picker.Item
                      key={place.id}
                      label={`${index + 1}. ${place.name}`}
                      value={String(index)}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.placeCard}>
                <Text style={styles.placeTitle}>{places[selectedPlaceIndex]?.name}</Text>
                <Text style={styles.subtleText}>{places[selectedPlaceIndex]?.formattedAddress}</Text>
              </View>

              <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
                {places.map((place, index) => (
                  <Marker
                    key={place.id}
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude
                    }}
                    title={`${index + 1}. ${place.name}`}
                    description={place.formattedAddress}
                    pinColor={index === selectedPlaceIndex ? "#ef4444" : "#f59e0b"}
                  />
                ))}
              </MapView>
            </>
          ) : (
            <View style={styles.emptyMapState}>
              <Text style={styles.subtleText}>
                Send a place query to see native map markers here.
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212"
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: "#121212"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6
  },
  brand: {
    color: "#f7f7f7",
    fontSize: 24,
    fontWeight: "700"
  },
  sectionTitle: {
    color: "#f1f1f1",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8
  },
  subtleText: {
    color: "#a9b2c0",
    fontSize: 13
  },
  statusCard: {
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 16,
    backgroundColor: "#1a1f26",
    padding: 12,
    gap: 4
  },
  statusLabel: {
    color: "#7fc7ff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  statusValue: {
    color: "#dbe4f0",
    fontSize: 13
  },
  modelCard: {
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 16,
    backgroundColor: "#171b21",
    padding: 12
  },
  chatCard: {
    flex: 1,
    minHeight: 220,
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 16,
    backgroundColor: "#171b21",
    padding: 12
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    gap: 10,
    paddingBottom: 8
  },
  messageRow: {
    width: "100%"
  },
  messageRowUser: {
    alignItems: "flex-end"
  },
  messageRowAssistant: {
    alignItems: "flex-start"
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  messageBubbleUser: {
    backgroundColor: "#244160"
  },
  messageBubbleAssistant: {
    backgroundColor: "#222933"
  },
  messageText: {
    color: "#f1f5f9",
    fontSize: 15,
    lineHeight: 21
  },
  metaText: {
    color: "#9ab1ca",
    fontSize: 11,
    marginTop: 6
  },
  loadingRow: {
    paddingVertical: 8
  },
  composerCard: {
    gap: 8
  },
  inputHint: {
    color: "#f59e0b",
    fontSize: 12
  },
  composerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end"
  },
  input: {
    flex: 1,
    minHeight: 54,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 18,
    backgroundColor: "#171b21",
    color: "#ecf4ff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  sendButton: {
    minWidth: 78,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#7fc7ff",
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonText: {
    color: "#10202d",
    fontWeight: "700",
    fontSize: 15
  },
  locationButton: {
    borderRadius: 999,
    backgroundColor: "#10a37f",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  locationButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  mapCard: {
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 16,
    backgroundColor: "#171b21",
    padding: 12,
    gap: 10
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2f6ea5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  secondaryButtonText: {
    color: "#8ed1ff",
    fontWeight: "700"
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#2c3440",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#10151b"
  },
  picker: {
    color: "#e6edf6"
  },
  placeCard: {
    borderWidth: 1,
    borderColor: "#29313d",
    borderRadius: 14,
    backgroundColor: "#10151b",
    padding: 12,
    gap: 4
  },
  placeTitle: {
    color: "#eef6ff",
    fontWeight: "700",
    fontSize: 15
  },
  map: {
    width: "100%",
    height: 260,
    borderRadius: 14
  },
  emptyMapState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  }
});
