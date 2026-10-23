export const PLACES = [
  { id: "campus", label: "VIT-AP Campus" },
  { id: "bus-stand", label: "Vijayawada Bus Stand" },
  { id: "railway", label: "Vijayawada Railway Station" },
  { id: "airport", label: "Gannavaram Airport" },
  { id: "pvp", label: "PVP Square" },
  { id: "trendset", label: "Trendset Mall" },
];

export const PLACE_IDS = PLACES.map((p) => p.id);

export function placeLabel(id) {
  return PLACES.find((p) => p.id === id)?.label ?? id;
}
