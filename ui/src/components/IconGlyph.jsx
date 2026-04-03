import { Text } from "react-native";

const ICONS = {
  archive: "Ar",
  bookmark: "Bk",
  check: "OK",
  close: "X",
  copy: "Cp",
  edit: "Ed",
  map: "Mp",
  menu: "Mn",
  more: "...",
  navigation: "Go",
  new: "+",
  send: ">",
  settings: "St",
  sidebar: "Sb",
  trash: "Tr"
};

function IconGlyph({ name, style }) {
  return <Text style={style}>{ICONS[name] || "?"}</Text>;
}

export default IconGlyph;
