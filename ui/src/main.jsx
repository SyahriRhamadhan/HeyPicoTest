import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

globalThis.__MAPAI_WEB_CONFIG__ = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "",
  VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
