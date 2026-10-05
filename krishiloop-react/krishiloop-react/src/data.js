/* ---------- DATA LAYER ----------
   Everything here is demo data for the hackathon prototype.
   Swap any of these exports for a fetch() to your FastAPI backend
   once the real endpoints exist — the components don't need to change,
   they just need the same shape back.
------------------------------------ */

export const stages = [
  { label: "Listed by farmers", tonnes: 186 },
  { label: "Matched", tonnes: 142 },
  { label: "Collection planned", tonnes: 118 },
  { label: "Collected", tonnes: 96 },
  { label: "Processed", tonnes: 64 },
  { label: "Paid to farmers", tonnes: null, value: "\u20B91.4L" }
];

export const kpis = [
  { label: "Active farmers", value: "38", note: "12 repeat users" },
  { label: "Collection completion", value: "81%", note: "planned pickups done" },
  { label: "Processor fill rate", value: "57%", note: "of 240 t requested" },
  { label: "Avg. pickup distance", value: "14 km", note: "per cluster" }
];

export const districts = [
  { name: "Sangrur", supply: 74, demand: 60 },
  { name: "Patiala", supply: 52, demand: 90 },
  { name: "Malerkotla", supply: 38, demand: 45 },
  { name: "Barnala", supply: 22, demand: 0 }
];

export const processors = [
  { id: "P1", name: "Sangrur Biomass Pellets", district: "Sangrur", need: 120 },
  { id: "P2", name: "Malerkotla Bio-CNG Unit", district: "Malerkotla", need: 80 },
  { id: "P3", name: "Patiala Paper Board Mill", district: "Patiala", need: 40 }
];

export const weights = {
  compat: 0.25,
  distance: 0.2,
  quantity: 0.15,
  timing: 0.15,
  capacity: 0.15,
  quality: 0.1
};

export const factorNames = {
  compat: "Residue compatibility",
  distance: "Distance",
  quantity: "Quantity fit",
  timing: "Timing fit",
  capacity: "Capacity",
  quality: "Quality spec"
};

// Factor scores (0-1) for lot L-104 against each processor.
export const matchFactors = {
  P1: { compat: 1, distance: 0.9, quantity: 0.8, timing: 0.9, capacity: 0.85, quality: 0.8 },
  P2: { compat: 1, distance: 0.7, quantity: 0.9, timing: 0.75, capacity: 0.7, quality: 0.9 },
  P3: { compat: 0.7, distance: 0.4, quantity: 0.6, timing: 0.8, capacity: 0.9, quality: 0.6 }
};

export const lots = [
  { id: "L-101", farmer: "Gurpreet Singh", village: "Longowal", est: 4.0, act: 3.8, from: "12 Oct", status: "Processed" },
  { id: "L-102", farmer: "Harjinder Kaur", village: "Sunam", est: 6.5, act: 6.1, from: "14 Oct", status: "Collected" },
  { id: "L-103", farmer: "Balwinder Singh", village: "Bhawanigarh", est: 3.2, act: null, from: "15 Oct", status: "Collection planned" },
  { id: "L-104", farmer: "Jasmeet Kaur", village: "Dhuri", est: 5.0, act: null, from: "16 Oct", status: "Matched" },
  { id: "L-105", farmer: "Amarjit Singh", village: "Lehragaga", est: 2.8, act: null, from: "18 Oct", status: "Listed" },
  { id: "L-106", farmer: "Sukhdev Singh", village: "Malerkotla", est: 7.4, act: null, from: "18 Oct", status: "Listed" }
];

export const route = {
  points: [
    { n: "Dhuri", x: 60, y: 170, t: 5.0 },
    { n: "Sunam", x: 130, y: 100, t: 6.5 },
    { n: "Bhawanigarh", x: 230, y: 130, t: 3.2 },
    { n: "Lehragaga", x: 300, y: 60, t: 2.8 }
  ],
  depot: { n: "Sangrur Pellets", x: 360, y: 150 },
  km: 46
};

// Weighted-score helper used by the matching panel (Section 10.1 of the report).
export function score(factorSet) {
  return Object.keys(weights).reduce((sum, k) => sum + weights[k] * factorSet[k], 0);
}

// Lat/Lon lookup for the pilot villages. Used by kmBetween() and the Google
// map so they stay aligned. Coordinates are illustrative for the demo.
export const VILLAGE_COORDS = {
  Sangrur: [30.24, 75.84],
  Dhuri: [30.37, 75.87],
  Sunam: [30.13, 75.8],
  Longowal: [30.21, 75.68],
  Bhawanigarh: [30.27, 76.04],
  Lehragaga: [29.93, 75.8],
  Malerkotla: [30.53, 75.88],
  Patiala: [30.34, 76.39],
  Barnala: [30.38, 75.55],
};

// Processor / depot anchor used by the route map. Defaults to Sangrur.
export const DEFAULT_DEPOT = { name: "Sangrur Biomass Pellets", lat: VILLAGE_COORDS.Sangrur[0], lng: VILLAGE_COORDS.Sangrur[1] };
