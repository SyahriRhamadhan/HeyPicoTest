import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_CALLBACK = "__heypicoGoogleMapsReady";

const loadGoogleMapsScript = (() => {
  let promise;
  return () => {
    if (!GOOGLE_MAPS_KEY) {
      return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
    }

    if (window.google?.maps) {
      return Promise.resolve(window.google.maps);
    }

    if (promise) return promise;

    promise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        const waitUntilReady = () => {
          if (window.google?.maps?.Map) {
            resolve(window.google.maps);
          } else {
            setTimeout(waitUntilReady, 30);
          }
        };
        waitUntilReady();
        return;
      }

      window[GOOGLE_MAPS_CALLBACK] = () => {
        if (window.google?.maps?.Map) {
          resolve(window.google.maps);
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
      script.onerror = () => {
        reject(new Error("Failed to load Google Maps script."));
      };
      document.head.appendChild(script);
    });

    return promise;
  };
})();

function GoogleMapCanvas({ places, selectedIndex }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const selectedCircleRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
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
      })
      .catch((error) => {
        if (active) setMapError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (selectedCircleRef.current) {
      selectedCircleRef.current.setMap(null);
      selectedCircleRef.current = null;
    }

    const valid = (places || [])
      .map((place, index) => ({
        index,
        name: place.name,
        formattedAddress: place.formattedAddress,
        lat: Number(place?.location?.lat),
        lng: Number(place?.location?.lng)
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

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
  }, [places, selectedIndex]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mutedText}>Set VITE_GOOGLE_MAPS_API_KEY in ui/.env to render Google Map.</Text>
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
