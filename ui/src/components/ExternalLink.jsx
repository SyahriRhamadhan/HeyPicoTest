import { Pressable, Text } from "react-native";
import { openExternalUrl } from "../utils/platform";
import { styles } from "../styles/appStyles";

function ExternalLink({ href, children, style, textStyle }) {
  return (
    <Pressable style={[styles.linkButton, style]} onPress={() => openExternalUrl(href)}>
      <Text style={[styles.linkInline, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export default ExternalLink;
