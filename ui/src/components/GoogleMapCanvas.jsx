import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import { openExternalUrl } from "../utils/platform";
import { getRuntimeConfig } from "../utils/runtimeConfig";

const GOOGLE_MAPS_CALLBACK = "__heypicoGoogleMapsReady";
const isWeb = Platform.OS === "web";
const GOOGLE_MAPS_KEY = getRuntimeConfig().googleMapsApiKey || "";

const getGoogleMaps = () => globalThis.google?.maps;

const loadGoogleMapsScript = (() => {
  let promise;

  return () => {
    if (!isWeb) {
      return Promise.reject(new Error("Google Maps JS is only available on web."));
    }

    if (!GOOGLE_MAPS_KEY) {
      return Promise.reject(new Error("Missing Google Maps API key."));
    }

    if (getGoogleMaps()) {
      return Promise.resolve(getGoogleMaps());
    }

    if (promise) return promise;

    promise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        const waitUntilReady = () => {
          if (getGoogleMaps()?.Map) {
            resolve(getGoogleMaps());
          } else {
            setTimeout(waitUntilReady, 30);
          }
        };

        waitUntilReady();
        return;
      }

      globalThis[GOOGLE_MAPS_CALLBACK] = () => {
        if (getGoogleMaps()?.Map) {
          resolve(getGoogleMaps());
        } else {
          reject(new Error("Google Maps loaded but Map constructor is unavailable."));
        }
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        GOOGLE_MAPS_KEY
      )}&loading=async&v=weekly&callback=${GOOGLE_MAPS_CALLBACK}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Failed to load Google Maps script."));
      document.head.appendChild(script);
    });

    return promise;
  };
})();

const parseLatLng = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const extractLatLngFromMapsUrl = (mapsUrl) => {
  const raw = String(mapsUrl || "");
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const query = url.searchParams.get("query") || "";
    if (query.includes(",")) {
      const [lat, lng] = query.split(",").map((part) => parseLatLng(part));
      if (lat !== null && lng !== null) {
        return { lat, lng };
      }
    }
  } catch {
    // Ignore URL parse errors.
  }

  const match = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = parseLatLng(match[1]);
    const lng = parseLatLng(match[2]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
};

const getSelectedPlace = (places, selectedIndex) => {
  const selected = places[selectedIndex] || places[0] || null;
  if (!selected) return null;

  const fromLocation = {
    lat: parseLatLng(selected?.location?.lat),
    lng: parseLatLng(selected?.location?.lng)
  };
  const fromUrl = extractLatLngFromMapsUrl(selected?.mapsUrl);

  return {
    ...selected,
    lat: fromLocation.lat ?? fromUrl?.lat ?? null,
    lng: fromLocation.lng ?? fromUrl?.lng ?? null
  };
};

function NativeMapFallback({ places, selectedIndex }) {
  const selectedPlace = getSelectedPlace(places, selectedIndex);

  if (!selectedPlace) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mutedText}>Send a place query to see the map preview.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapFallback}>
      <Text style={styles.placeTitle}>{selectedPlace.name}</Text>
      <Text style={styles.placeAddress}>{selectedPlace.formattedAddress || "-"}</Text>
      <Text style={styles.mutedText}>
        Native map adapter is not installed yet. Open the selected place in Google Maps from here.
      </Text>
      <Pressable style={styles.nativeMapButton} onPress={() => openExternalUrl(selectedPlace.mapsUrl)}>
        <Text style={styles.nativeMapButtonText}>Open in Google Maps</Text>
      </Pressable>
    </View>
  );
}

function GoogleMapCanvas({ places, selectedIndex }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const selectedCircleRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!isWeb) return undefined;

    let active = true;

    loadGoogleMapsScript()
      .then((maps) => {
        if (!active) return;

        if (!mapRef.current && containerRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: { lat: 1.1, lng: 104.0 },
            zoom: 11,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            scaleControl: true,
            rotateControl: true,
            gestureHandling: "greedy"
          });
        }

        setMapReady(true);
      })
      .catch((error) => {
        if (active) setMapError(error.message);
      });

    return () => {
      active = false;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isWeb) return undefined;

    const maps = getGoogleMaps();
    const map = mapRef.current;
    if (!maps || !map || !mapReady) return undefined;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (selectedCircleRef.current) {
      selectedCircleRef.current.setMap(null);
      selectedCircleRef.current = null;
    }

    let cancelled = false;

    const base = (places || []).map((place, index) => {
      const fromLocation = {
        lat: parseLatLng(place?.location?.lat),
        lng: parseLatLng(place?.location?.lng)
      };
      const fromUrl = extractLatLngFromMapsUrl(place?.mapsUrl);

      return {
        index,
        name: place.name,
        formattedAddress: place.formattedAddress,
        mapsUrl: place.mapsUrl,
        lat: fromLocation.lat ?? fromUrl?.lat ?? null,
        lng: fromLocation.lng ?? fromUrl?.lng ?? null
      };
    });

    const renderMarkers = (valid) => {
      if (!valid.length) return;

      const bounds = new maps.LatLngBounds();
      if (!infoWindowRef.current) {
        infoWindowRef.current = new maps.InfoWindow();
      }

      const infoWindow = infoWindowRef.current;

      valid.forEach((item, markerIndex) => {
        const position = { lat: item.lat, lng: item.lng };
        bounds.extend(position);

        const marker = new maps.Marker({
          map,
          position,
          label: {
            text: `${markerIndex + 1}`,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700"
          },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
          },
          title: item.name,
          animation: markerIndex === 0 ? maps.Animation.DROP : undefined
        });

        marker.addListener("click", () => {
          infoWindow.setContent(
            `<div style="color:#111827;font-family:Segoe UI,Arial,sans-serif;line-height:1.4;">
               <strong>${item.name}</strong><br/>${item.formattedAddress || ""}
             </div>`
          );
          infoWindow.open({ anchor: marker, map });
        });

        markersRef.current.push(marker);
      });

      const selected = valid.find((item) => item.index === selectedIndex);
      const focusTarget = selected || valid[0];

      if (focusTarget) {
        map.setCenter({ lat: focusTarget.lat, lng: focusTarget.lng });
        map.setZoom(valid.length === 1 ? 15 : 13);
        maps.event.trigger(map, "resize");
        map.panTo({ lat: focusTarget.lat, lng: focusTarget.lng });
      } else if (valid.length === 1) {
        map.setCenter({ lat: valid[0].lat, lng: valid[0].lng });
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 40);
      }

      if (focusTarget) {
        selectedCircleRef.current = new maps.Circle({
          map,
          center: { lat: focusTarget.lat, lng: focusTarget.lng },
          radius: 150,
          strokeColor: "#1d4ed8",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: "#60a5fa",
          fillOpacity: 0.2
        });

        const selectedMarker = markersRef.current.find(
          (marker, markerIndex) => valid[markerIndex]?.index === focusTarget.index
        );

        if (selectedMarker) {
          infoWindow.setContent(
            `<div style="color:#111827;font-family:Segoe UI,Arial,sans-serif;line-height:1.4;">
               <strong>${focusTarget.name}</strong><br/>${focusTarget.formattedAddress || ""}
             </div>`
          );
          infoWindow.open({ anchor: selectedMarker, map });
        }
      }

      if (mapError) {
        setMapError("");
      }
    };

    const withCoordinates = base.filter(
      (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)
    );

    if (withCoordinates.length > 0) {
      renderMarkers(withCoordinates);
      return () => {
        cancelled = true;
      };
    }

    const geocoder = new maps.Geocoder();
    Promise.all(
      base.map(
        (item) =>
          new Promise((resolve) => {
            const address = String(item.formattedAddress || item.name || "").trim();
            if (!address) {
              resolve(item);
              return;
            }

            geocoder.geocode({ address }, (results, status) => {
              if (status === "OK" && results?.[0]?.geometry?.location) {
                const location = results[0].geometry.location;
                resolve({
                  ...item,
                  lat: Number(location.lat()),
                  lng: Number(location.lng())
                });
                return;
              }

              resolve(item);
            });
          })
      )
    )
      .then((resolved) => {
        if (cancelled) return;

        const valid = resolved.filter(
          (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)
        );

        if (!valid.length) {
          setMapError("No valid coordinates available for this recommendation.");
          return;
        }

        renderMarkers(valid);
      })
      .catch(() => {
        if (!cancelled) setMapError("Failed to resolve map coordinates.");
      });

    return () => {
      cancelled = true;
    };
  }, [mapReady, mapError, places, selectedIndex]);

  if (!isWeb) {
    return <NativeMapFallback places={places} selectedIndex={selectedIndex} />;
  }

  if (!GOOGLE_MAPS_KEY) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mutedText}>Set a Google Maps API key to render the web map.</Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mutedText}>Map error: {mapError}</Text>
      </View>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: 10 }} />;
}

export default GoogleMapCanvas;
