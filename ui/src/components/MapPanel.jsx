import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import ExternalLink from "./ExternalLink";
import GoogleMapCanvas from "./GoogleMapCanvas";
import IconGlyph from "./IconGlyph";
import OptionPicker from "./OptionPicker";

function MapPanel({ isMobile = false, places, selectedIndex, onSelect, onClose }) {
  const selectedPlace = places[selectedIndex] || null;
  const placeOptions = places.map((place, index) => ({
    label: `${index + 1}. ${place.name}`,
    value: String(index)
  }));

  return (
    <View style={[styles.panel, styles.mapPanel, isMobile && styles.mapPanelMobile]}>
      <View style={styles.mapHeaderRow}>
        <Text style={styles.panelHeaderText}>Recommendations</Text>
        <Pressable style={styles.iconButton} onPress={onClose} title="Hide recommendations" accessibilityLabel="Hide recommendations">
          <IconGlyph name="close" style={styles.iconGlyph} />
        </Pressable>
      </View>

      <ScrollView style={[styles.panelBody, isMobile && styles.mapPanelBodyMobile]} contentContainerStyle={styles.panelBodyContent}>
        <OptionPicker
          value={places.length ? String(selectedIndex) : ""}
          onChange={(value) => onSelect(Number(value))}
          options={placeOptions}
          placeholder="No places found"
          disabled={!places.length}
        />

        <View style={styles.placeCard}>
          {selectedPlace ? (
            <>
              <Text style={styles.placeTitle}>{selectedPlace.name}</Text>
              <Text style={styles.placeAddress}>{selectedPlace.formattedAddress || "-"}</Text>
              <ExternalLink href={selectedPlace.mapsUrl}>Open direction</ExternalLink>
            </>
          ) : (
            <Text style={styles.mutedText}>Send a place query to see details.</Text>
          )}
        </View>

        <View style={[styles.mapFrame, isMobile && styles.mapFrameMobile]}>
          <GoogleMapCanvas places={places} selectedIndex={selectedIndex} />
        </View>
      </ScrollView>
    </View>
  );
}

export default MapPanel;
