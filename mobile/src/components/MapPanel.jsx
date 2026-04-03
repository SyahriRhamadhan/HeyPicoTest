import { useState } from "react";
import RecommendationsPanel from "./RecommendationsPanel";

function MapPanel(props) {
  const [showInlineMap, setShowInlineMap] = useState(false);

  return (
    <RecommendationsPanel
      {...props}
      showInlineMap={showInlineMap}
      onToggleInlineMap={() => setShowInlineMap((current) => !current)}
    />
  );
}

export default MapPanel;
