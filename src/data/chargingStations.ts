export interface UtilizationDataPoint {
  hour: number;
  utilization: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  chargers: number; // Number of charging points
  type: 'fast' | 'superfast' | 'standard';
  operator: string;
  available: number; // Currently available chargers
  pricePerKwh: number; // Price in EUR per kWh
  utilizationHistory: UtilizationDataPoint[]; // 24-hour utilization
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

// Coastal boundaries to prevent stations from being placed in water
// The Hague: coastline curves near Scheveningen, so use 4.30 to ensure all stations are on land
const coastalBoundaries: Record<string, { minLng: number }> = {
  'The Hague': { minLng: 4.30 },
};

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
  const boundary = coastalBoundaries[cityName];

  for (let i = 0; i < count; i++) {
    // Random position within city radius (0.02-0.08 degrees, roughly 2-8km)
    // Use do-while to regenerate coordinates if they fall in water
    let lng: number;
    let lat: number;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const angle = random() * Math.PI * 2;
      const distance = 0.02 + random() * 0.06;
      lng = center[0] + Math.cos(angle) * distance;
      lat = center[1] + Math.sin(angle) * distance * 0.7; // Adjust for lat/lng ratio
      attempts++;
    } while (boundary && lng < boundary.minLng && attempts < maxAttempts);

    // Clamp to boundary as fallback if still invalid
    if (boundary && lng < boundary.minLng) {
      lng = boundary.minLng + random() * 0.01;
    }

    const type = random() < 0.2 ? 'superfast' : random() < 0.5 ? 'fast' : 'standard';
    const chargers = type === 'superfast' ? 8 + Math.floor(random() * 8) :
                     type === 'fast' ? 4 + Math.floor(random() * 6) :
                     2 + Math.floor(random() * 4);

    // Generate price based on type
    const pricePerKwh = type === 'superfast' ? 0.45 + random() * 0.20
      : type === 'fast' ? 0.35 + random() * 0.15
      : 0.25 + random() * 0.10;

    // Generate 24-hour utilization pattern (higher during day, peaks at morning/evening commute)
    const utilizationHistory: UtilizationDataPoint[] = Array.from({ length: 24 }, (_, hour) => {
      const baseUtil = hour >= 7 && hour <= 9 ? 0.7 + random() * 0.25 // Morning peak
        : hour >= 17 && hour <= 19 ? 0.75 + random() * 0.20 // Evening peak
        : hour >= 10 && hour <= 16 ? 0.4 + random() * 0.3 // Midday
        : hour >= 20 && hour <= 23 ? 0.3 + random() * 0.25 // Evening
        : 0.1 + random() * 0.15; // Night
      return { hour, utilization: Math.round(baseUtil * 100) };
    });

    stations.push({
      id: `station-${startId + i}`,
      name: `${cityName} ${['Noord', 'Zuid', 'Oost', 'West', 'Centrum', 'Station', 'Park', 'Mall'][Math.floor(random() * 8)]} ${i + 1}`,
      coordinates: [lng, lat],
      chargers,
      type,
      operator: operators[Math.floor(random() * operators.length)],
      available: Math.floor(random() * (chargers + 1)),
      pricePerKwh: Math.round(pricePerKwh * 100) / 100,
      utilizationHistory,
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

  // Generate price based on type (highway stations slightly more expensive)
  const pricePerKwh = type === 'superfast' ? 0.50 + random() * 0.20
    : 0.40 + random() * 0.15;

  // Highway stations have more consistent utilization throughout the day
  const utilizationHistory: UtilizationDataPoint[] = Array.from({ length: 24 }, (_, hour) => {
    const baseUtil = hour >= 6 && hour <= 22 ? 0.5 + random() * 0.35 // Daytime
      : 0.2 + random() * 0.2; // Night
    return { hour, utilization: Math.round(baseUtil * 100) };
  });

  return {
    id: `highway-${id}`,
    name: `${name} Charging Plaza`,
    coordinates: [lng, lat],
    chargers,
    type,
    operator: operators[Math.floor(random() * operators.length)],
    available: Math.floor(random() * (chargers + 1)),
    pricePerKwh: Math.round(pricePerKwh * 100) / 100,
    utilizationHistory,
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

// Color schemes for different station types - balanced palette (distinct but not neon)
export const stationColors = {
  superfast: [60, 180, 130] as [number, number, number],   // Teal green
  fast: [70, 145, 190] as [number, number, number],        // Ocean blue
  standard: [200, 165, 70] as [number, number, number],    // Warm amber
};
