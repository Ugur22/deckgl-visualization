export interface ChargingStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  chargers: number; // Number of charging points
  type: 'fast' | 'superfast' | 'standard';
  operator: string;
  available: number; // Currently available chargers
}

// Seeded random for consistent generation
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const random = seededRandom(123);

const operators = ['Tesla', 'Fastned', 'Shell Recharge', 'Allego', 'Ionity', 'BP Pulse', 'EVBox'];

// Major city centers for dense station placement
const cityHubs: { name: string; coords: [number, number]; density: number }[] = [
  { name: 'Amsterdam', coords: [4.895168, 52.370216], density: 25 },
  { name: 'Rotterdam', coords: [4.462456, 51.926517], density: 20 },
  { name: 'The Hague', coords: [4.288788, 52.078663], density: 18 },
  { name: 'Utrecht', coords: [5.104480, 52.092876], density: 18 },
  { name: 'Eindhoven', coords: [5.47778, 51.44083], density: 15 },
  { name: 'Groningen', coords: [6.56667, 53.21917], density: 12 },
  { name: 'Tilburg', coords: [5.0913, 51.55551], density: 10 },
  { name: 'Almere', coords: [5.222124, 52.371353], density: 12 },
  { name: 'Breda', coords: [4.768323, 51.571915], density: 10 },
  { name: 'Nijmegen', coords: [5.8528, 51.8425], density: 10 },
];

// Highway service stations (along major routes)
const highwayStations: { name: string; coords: [number, number] }[] = [
  // A1 corridor
  { name: 'A1 Amersfoort', coords: [5.387, 52.156] },
  { name: 'A1 Deventer', coords: [6.155, 52.251] },
  { name: 'A1 Hengelo', coords: [6.793, 52.265] },

  // A2 corridor (Amsterdam - Maastricht)
  { name: 'A2 Breukelen', coords: [4.989, 52.172] },
  { name: 'A2 Vianen', coords: [5.091, 51.989] },
  { name: 'A2 Den Bosch', coords: [5.299, 51.688] },
  { name: 'A2 Eindhoven Noord', coords: [5.462, 51.481] },
  { name: 'A2 Weert', coords: [5.707, 51.252] },

  // A4 corridor (Amsterdam - Rotterdam)
  { name: 'A4 Hoofddorp', coords: [4.689, 52.303] },
  { name: 'A4 Leiden', coords: [4.497, 52.160] },
  { name: 'A4 Delft', coords: [4.357, 51.998] },

  // A12 corridor
  { name: 'A12 Woerden', coords: [4.881, 52.085] },
  { name: 'A12 Ede', coords: [5.666, 52.039] },
  { name: 'A12 Arnhem', coords: [5.898, 51.985] },

  // A28 corridor
  { name: 'A28 Amersfoort Zuid', coords: [5.387, 52.130] },
  { name: 'A28 Harderwijk', coords: [5.620, 52.342] },
  { name: 'A28 Zwolle', coords: [6.083, 52.508] },

  // A27 corridor
  { name: 'A27 Hilversum', coords: [5.176, 52.223] },
  { name: 'A27 Gorinchem', coords: [4.973, 51.834] },

  // A58/A67 corridor (south)
  { name: 'A58 Roosendaal', coords: [4.465, 51.530] },
  { name: 'A58 Bergen op Zoom', coords: [4.292, 51.495] },
  { name: 'A67 Venlo', coords: [6.172, 51.370] },

  // North
  { name: 'A7 Hoorn', coords: [5.059, 52.642] },
  { name: 'A7 Afsluitdijk', coords: [5.271, 53.017] },
  { name: 'A7 Heerenveen', coords: [5.924, 52.960] },
  { name: 'A28 Assen', coords: [6.562, 52.993] },
];

function generateStationsAroundCity(
  cityName: string,
  center: [number, number],
  count: number,
  startId: number
): ChargingStation[] {
  const stations: ChargingStation[] = [];

  for (let i = 0; i < count; i++) {
    // Random position within city radius (0.02-0.08 degrees, roughly 2-8km)
    const angle = random() * Math.PI * 2;
    const distance = 0.02 + random() * 0.06;

    const lng = center[0] + Math.cos(angle) * distance;
    const lat = center[1] + Math.sin(angle) * distance * 0.7; // Adjust for lat/lng ratio

    const type = random() < 0.2 ? 'superfast' : random() < 0.5 ? 'fast' : 'standard';
    const chargers = type === 'superfast' ? 8 + Math.floor(random() * 8) :
                     type === 'fast' ? 4 + Math.floor(random() * 6) :
                     2 + Math.floor(random() * 4);

    stations.push({
      id: `station-${startId + i}`,
      name: `${cityName} ${['Noord', 'Zuid', 'Oost', 'West', 'Centrum', 'Station', 'Park', 'Mall'][Math.floor(random() * 8)]} ${i + 1}`,
      coordinates: [lng, lat],
      chargers,
      type,
      operator: operators[Math.floor(random() * operators.length)],
      available: Math.floor(random() * (chargers + 1)),
    });
  }

  return stations;
}

function generateHighwayStation(
  name: string,
  coords: [number, number],
  id: number
): ChargingStation {
  // Highway stations are typically fast/superfast with more chargers
  const type = random() < 0.4 ? 'superfast' : 'fast';
  const chargers = type === 'superfast' ? 12 + Math.floor(random() * 12) : 6 + Math.floor(random() * 8);

  // Add slight random offset
  const lng = coords[0] + (random() - 0.5) * 0.01;
  const lat = coords[1] + (random() - 0.5) * 0.01;

  return {
    id: `highway-${id}`,
    name: `${name} Charging Plaza`,
    coordinates: [lng, lat],
    chargers,
    type,
    operator: operators[Math.floor(random() * operators.length)],
    available: Math.floor(random() * (chargers + 1)),
  };
}

// Generate all stations
export function generateChargingStations(): ChargingStation[] {
  const stations: ChargingStation[] = [];
  let stationId = 0;

  // Generate city stations
  cityHubs.forEach((city) => {
    const cityStations = generateStationsAroundCity(
      city.name,
      city.coords,
      city.density,
      stationId
    );
    stations.push(...cityStations);
    stationId += city.density;
  });

  // Generate highway stations
  highwayStations.forEach((highway, i) => {
    stations.push(generateHighwayStation(highway.name, highway.coords, i));
  });

  console.log(`Generated ${stations.length} EV charging stations`);
  return stations;
}

// Pre-generated data
export const chargingStations: ChargingStation[] = generateChargingStations();

// Color schemes for different station types
export const stationColors = {
  superfast: [0, 255, 136] as [number, number, number],    // Bright green
  fast: [0, 200, 255] as [number, number, number],         // Cyan
  standard: [255, 200, 0] as [number, number, number],     // Yellow
};
