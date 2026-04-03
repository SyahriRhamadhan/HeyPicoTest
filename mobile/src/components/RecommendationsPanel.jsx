import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";
import { Pressable, Text, View } from "react-native";
import { styles } from "../appStyles";

function RecommendationsPanel({
  places,
  selectedPlace,
  selectedPlaceIndex,
  onSelectPlace,
  showInlineMap,
  onToggleInlineMap,
  onOpenDirections,
  mapRegion
}) {
  if (!places.length) return null;

  return (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationTitle}>Recommendations</Text>
        <View style={styles.mapActions}>
          <Pressable style={styles.secondaryButton} onPress={onToggleInlineMap}>
            <Text style={styles.secondaryButtonText}>
              {showInlineMap ? "Hide Map" : "Show Map"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onOpenDirections}>
            <Text style={styles.secondaryButtonText}>Open Maps</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={String(selectedPlaceIndex)}
          onValueChange={(value) => onSelectPlace(Number(value))}
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
        <Text style={styles.placeTitle}>{selectedPlace?.name}</Text>
        <Text style={styles.subtleText}>{selectedPlace?.formattedAddress}</Text>
      </View>

      {showInlineMap ? (
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
      ) : (
        <View style={styles.inlineMapDisabled}>
          <Text style={styles.subtleText}>
            Inline native map is hidden by default. Tap Show Map if you want to test it.
          </Text>
        </View>
      )}
    </View>
  );
}

export default RecommendationsPanel;
