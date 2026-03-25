import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import GoogleMapCanvas from "./GoogleMapCanvas";

function MapPanel({ places, selectedIndex, onSelect }) {
  const selectedPlace = places[selectedIndex] || null;

  return (
    <View style={[styles.panel, styles.mapPanel]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelHeaderText}>Recommendations</Text>
      </View>

      <View style={styles.panelBody}>
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

        <View style={styles.mapFrame}>
          <GoogleMapCanvas places={places} selectedIndex={selectedIndex} />
        </View>
      </View>
    </View>
  );
}

export default MapPanel;
