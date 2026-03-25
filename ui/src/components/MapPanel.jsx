import { Pressable, Text, View } from "react-native";
import { FiX } from "react-icons/fi";
import { styles } from "../styles/appStyles";
import GoogleMapCanvas from "./GoogleMapCanvas";

function MapPanel({ isMobile = false, places, selectedIndex, onSelect, onClose }) {
  const selectedPlace = places[selectedIndex] || null;

  return (
    <View
      style={[styles.panel, styles.mapPanel, isMobile && styles.mapPanelMobile]}
      className="map-panel"
    >
      <View style={styles.mapHeaderRow}>
        <Text style={styles.panelHeaderText}>Recommendations</Text>
        <Pressable style={styles.iconButton} onPress={onClose} title="Hide recommendations" accessibilityLabel="Hide recommendations">
          <FiX size={14} color="#d6d6d6" />
        </Pressable>
      </View>

      <View style={[styles.panelBody, isMobile && styles.mapPanelBodyMobile]} className="map-panel-body">
        <select
          className="rn-select"
          value={places.length ? String(selectedIndex) : ""}
          onChange={(event) => onSelect(Number(event.target.value))}
          disabled={!places.length}
        >
          {!places.length ? <option value="">No places found</option> : null}
          {places.map((place, index) => (
            <option key={`${place.name}-${index}`} value={index}>
              {index + 1}. {place.name}
            </option>
          ))}
        </select>

        <View style={styles.placeCard}>
          {selectedPlace ? (
            <>
              <Text style={styles.placeTitle}>{selectedPlace.name}</Text>
              <Text style={styles.placeAddress}>{selectedPlace.formattedAddress || "-"}</Text>
              <a href={selectedPlace.mapsUrl} target="_blank" rel="noreferrer" style={styles.linkInline}>
                Open direction
              </a>
            </>
          ) : (
            <Text style={styles.mutedText}>Send a place query to see details.</Text>
          )}
        </View>

        <View style={[styles.mapFrame, isMobile && styles.mapFrameMobile]} className="map-frame">
          <GoogleMapCanvas places={places} selectedIndex={selectedIndex} />
        </View>
      </View>
    </View>
  );
}

export default MapPanel;
