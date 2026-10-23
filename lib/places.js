// `short` fits route lines on a 390px card.
export const PLACES = [
  { id: "campus", label: "VIT-AP Campus", short: "Campus" },
  { id: "bus-stand", label: "Vijayawada Bus Stand", short: "Bus Stand" },
  { id: "railway", label: "Vijayawada Railway Station", short: "Railway Stn" },
  { id: "airport", label: "Gannavaram Airport", short: "Airport" },
  { id: "pvp", label: "PVP Square", short: "PVP Square" },
  { id: "trendset", label: "Trendset Mall", short: "Trendset" },
];

export const PLACE_IDS = PLACES.map((p) => p.id);

export function placeLabel(id) {
  return PLACES.find((p) => p.id === id)?.label ?? id;
}

export function placeShort(id) {
  return PLACES.find((p) => p.id === id)?.short ?? id;
}
