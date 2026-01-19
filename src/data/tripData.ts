import { TripData, TripWaypoint } from '../types';
import { chargingStations, ChargingStation } from './chargingStations';
import { fetchRoute, RouteGeometry } from '../services/routeService';

// Seeded random for consistent generation
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// EV vehicle types with battery characteristics
interface EVType {
  type: string;
  brand: string;
  color: [number, number, number];
  speedMult: number;
  rangeKm: number; // Max range in km
}

const evTypes: EVType[] = [
  // Tesla models
  { type: 'sedan', brand: 'Tesla Model 3', color: [255, 255, 255], speedMult: 1.1, rangeKm: 450 },
  { type: 'sedan', brand: 'Tesla Model 3', color: [200, 0, 0], speedMult: 1.1, rangeKm: 450 },
  { type: 'suv', brand: 'Tesla Model Y', color: [50, 50, 50], speedMult: 1.0, rangeKm: 400 },
  { type: 'suv', brand: 'Tesla Model X', color: [0, 0, 150], speedMult: 0.95, rangeKm: 500 },
  // European EVs
  { type: 'hatchback', brand: 'VW ID.3', color: [0, 180, 255], speedMult: 1.0, rangeKm: 350 },
  { type: 'suv', brand: 'VW ID.4', color: [100, 100, 100], speedMult: 0.95, rangeKm: 380 },
  { type: 'sedan', brand: 'BMW i4', color: [0, 100, 200], speedMult: 1.05, rangeKm: 400 },
  { type: 'suv', brand: 'Audi e-tron', color: [80, 80, 80], speedMult: 0.9, rangeKm: 350 },
  // Other EVs
  { type: 'hatchback', brand: 'Hyundai Ioniq 5', color: [180, 180, 180], speedMult: 1.0, rangeKm: 380 },
  { type: 'suv', brand: 'Kia EV6', color: [0, 150, 100], speedMult: 1.0, rangeKm: 400 },
  { type: 'sedan', brand: 'Polestar 2', color: [255, 200, 0], speedMult: 1.05, rangeKm: 400 },
  { type: 'hatchback', brand: 'Nissan Leaf', color: [0, 100, 150], speedMult: 0.9, rangeKm: 280 },
  // Delivery EVs
  { type: 'van', brand: 'Mercedes eVito', color: [255, 200, 0], speedMult: 0.85, rangeKm: 250 },
  { type: 'van', brand: 'VW e-Crafter', color: [255, 140, 0], speedMult: 0.8, rangeKm: 200 },
  { type: 'van', brand: 'Rivian EDV', color: [0, 50, 100], speedMult: 0.85, rangeKm: 300 },
];

// Battery level colors
function getBatteryColor(batteryPercent: number): [number, number, number] {
  if (batteryPercent > 60) return [0, 255, 136];    // Green - good charge
  if (batteryPercent > 30) return [255, 200, 0];    // Yellow - medium
  return [255, 80, 80];                              // Red - low battery
}

// Calculate distance between two coordinates (Haversine formula)
function getDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[1] * Math.PI / 180) *
    Math.cos(coord2[1] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearby stations within a distance range
function findNearbyStations(
  station: ChargingStation,
  minKm: number,
  maxKm: number,
  random: () => number
): ChargingStation[] {
  return chargingStations
    .filter((s) => {
      if (s.id === station.id) return false;
      const dist = getDistance(station.coordinates, s.coordinates);
      return dist >= minKm && dist <= maxKm;
    })
    .sort(() => random() - 0.5); // Shuffle for variety
}

// Generate EV trip routes between stations
interface EVRoute {
  from: ChargingStation;
  to: ChargingStation;
  tripType: 'commuter' | 'roadtrip' | 'delivery';
  weight: number;
}

// Store for route geometries
let routeGeometries: Map<string, RouteGeometry> = new Map();
let routesLoaded = false;
let evRoutes: EVRoute[] = [];

function getRouteKey(fromId: string, toId: string): string {
  return `${fromId}-${toId}`;
}

// Generate EV-specific route network
function generateEVRouteNetwork(random: () => number): EVRoute[] {
  const routes: EVRoute[] = [];

  // Get highway stations (these are key hubs)
  const highwayStations = chargingStations.filter((s) => s.id.startsWith('highway-'));
  const cityStations = chargingStations.filter((s) => !s.id.startsWith('highway-'));

  // 1. Highway corridor trips (long-distance road trips)
  highwayStations.forEach((station) => {
    const nearby = findNearbyStations(station, 20, 80, random);
    // Connect to 2-3 nearby highway stations
    nearby.slice(0, 3).forEach((target) => {
      if (target.id.startsWith('highway-')) {
        routes.push({
          from: station,
          to: target,
          tripType: 'roadtrip',
          weight: 3 + Math.floor(random() * 4),
        });
      }
    });
  });

  // 2. City to highway trips (people going on trips)
  cityStations.forEach((station) => {
    if (random() > 0.3) return; // Only 70% of city stations connect to highways
    const nearbyHighway = highwayStations
      .filter((h) => getDistance(station.coordinates, h.coordinates) < 40)
      .sort(() => random() - 0.5)[0];

    if (nearbyHighway) {
      routes.push({
        from: station,
        to: nearbyHighway,
        tripType: 'roadtrip',
        weight: 2,
      });
    }
  });

  // 3. Local commuter trips (short city trips)
  cityStations.forEach((station) => {
    const nearbyCity = findNearbyStations(station, 3, 25, random);
    // Connect to 1-2 nearby city stations
    nearbyCity
      .filter((s) => !s.id.startsWith('highway-'))
      .slice(0, 2)
      .forEach((target) => {
        routes.push({
          from: station,
          to: target,
          tripType: 'commuter',
          weight: 4 + Math.floor(random() * 4),
        });
      });
  });

  // 4. Delivery routes (within cities, higher frequency)
  // Pick stations with 'superfast' chargers as delivery hubs
  const deliveryHubs = cityStations.filter((s) => s.type === 'superfast');
  deliveryHubs.forEach((hub) => {
    const nearbyStations = findNearbyStations(hub, 2, 15, random);
    nearbyStations.slice(0, 4).forEach((target) => {
      routes.push({
        from: hub,
        to: target,
        tripType: 'delivery',
        weight: 5 + Math.floor(random() * 5),
      });
    });
  });

  console.log(`Generated ${routes.length} EV route connections`);
  return routes;
}

// Generate EV trip using real route geometry with battery simulation
function generateEVTripFromRoute(
  route: RouteGeometry,
  startTime: number,
  ev: EVType,
  tripId: number,
  evRoute: EVRoute,
  random: () => number
): TripData {
  const coordinates = route.coordinates;
  const numWaypoints = coordinates.length;

  // Duration based on actual route duration, scaled for animation
  const scaledDuration = (route.duration / 60) * 20 / ev.speedMult;
  const timePerStep = numWaypoints > 1 ? scaledDuration / (numWaypoints - 1) : 0;

  // Simulate battery level during trip
  const tripDistanceKm = route.distance / 1000;
  const startBattery = 30 + random() * 60; // Start with 30-90% battery
  const batteryUsed = (tripDistanceKm / ev.rangeKm) * 100;
  const endBattery = Math.max(5, startBattery - batteryUsed);

  // Use battery-based color that interpolates during the trip
  const avgBattery = (startBattery + endBattery) / 2;

  // Color based on trip type and battery
  let color: [number, number, number];
  if (evRoute.tripType === 'delivery') {
    // Delivery vehicles in amber/orange
    color = [255, 160, 0];
  } else if (evRoute.tripType === 'roadtrip') {
    // Long trips show battery status more prominently
    color = getBatteryColor(avgBattery);
  } else {
    // Commuters - slight tint based on battery
    const batteryColor = getBatteryColor(avgBattery);
    // Mix with white for a lighter appearance
    color = [
      Math.min(255, batteryColor[0] + 80),
      Math.min(255, batteryColor[1] + 80),
      Math.min(255, batteryColor[2] + 80),
    ];
  }

  const waypoints: TripWaypoint[] = coordinates.map((coords, i) => ({
    coordinates: coords,
    timestamp: startTime + i * timePerStep,
  }));

  return {
    id: `ev-${tripId}-${evRoute.from.name.slice(0, 10)}-${evRoute.to.name.slice(0, 10)}`,
    waypoints,
    vehicle: ev.type,
    color,
  };
}

// Fetch all required routes from Mapbox for EV network
export async function initializeRoutes(): Promise<void> {
  if (routesLoaded) return;

  console.log('Generating EV route network...');
  const random = seededRandom(42);
  evRoutes = generateEVRouteNetwork(random);

  console.log('Fetching route geometries from Mapbox...');

  // Collect unique route pairs
  const routePairs: Array<{ from: ChargingStation; to: ChargingStation }> = [];
  const seenKeys = new Set<string>();

  evRoutes.forEach((route) => {
    const key = getRouteKey(route.from.id, route.to.id);
    const reverseKey = getRouteKey(route.to.id, route.from.id);

    if (!seenKeys.has(key)) {
      routePairs.push({ from: route.from, to: route.to });
      seenKeys.add(key);
    }
    if (!seenKeys.has(reverseKey)) {
      routePairs.push({ from: route.to, to: route.from });
      seenKeys.add(reverseKey);
    }
  });

  console.log(`Need to fetch ${routePairs.length} unique routes`);

  // Fetch routes in batches
  const batchSize = 5;
  let fetched = 0;

  for (let i = 0; i < routePairs.length; i += batchSize) {
    const batch = routePairs.slice(i, i + batchSize);

    const promises = batch.map(async ({ from, to }) => {
      const key = getRouteKey(from.id, to.id);
      if (routeGeometries.has(key)) return;

      const route = await fetchRoute(from.coordinates, to.coordinates);
      if (route) {
        routeGeometries.set(key, route);
        fetched++;
      }
    });

    await Promise.all(promises);

    // Progress update every 10 batches
    if (fetched % 25 === 0 || i + batchSize >= routePairs.length) {
      console.log(`Fetched ${fetched}/${routePairs.length} EV routes...`);
    }

    // Small delay to avoid rate limiting
    if (i + batchSize < routePairs.length) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  routesLoaded = true;
  console.log(`EV route initialization complete! ${routeGeometries.size} routes cached.`);
}

// Generate EV trips using real routes between charging stations
export function generateTripData(): TripData[] {
  const random = seededRandom(42);
  const trips: TripData[] = [];
  let tripId = 0;

  const LOOP_DURATION = 1800;

  // Generate trips for each EV route
  evRoutes.forEach((evRoute) => {
    const forwardKey = getRouteKey(evRoute.from.id, evRoute.to.id);
    const reverseKey = getRouteKey(evRoute.to.id, evRoute.from.id);

    const forwardRoute = routeGeometries.get(forwardKey);
    const reverseRoute = routeGeometries.get(reverseKey);

    const numTrips = evRoute.weight;

    // Select EV types based on trip type
    const eligibleEVs = evRoute.tripType === 'delivery'
      ? evTypes.filter((ev) => ev.type === 'van')
      : evTypes.filter((ev) => ev.type !== 'van');

    for (let i = 0; i < numTrips; i++) {
      const startTime = (i * (LOOP_DURATION / numTrips) + random() * 50) % LOOP_DURATION;
      const ev = eligibleEVs[Math.floor(random() * eligibleEVs.length)];

      // Forward trip
      if (forwardRoute) {
        trips.push(generateEVTripFromRoute(forwardRoute, startTime, ev, tripId++, evRoute, random));
      }

      // Return trip (some vehicles return, some don't)
      if (random() > 0.3 && reverseRoute) {
        const returnStartTime = (startTime + LOOP_DURATION / 2 + random() * 200) % LOOP_DURATION;
        const returnEV = eligibleEVs[Math.floor(random() * eligibleEVs.length)];

        const returnEvRoute: EVRoute = {
          from: evRoute.to,
          to: evRoute.from,
          tripType: evRoute.tripType,
          weight: evRoute.weight,
        };
        trips.push(generateEVTripFromRoute(reverseRoute, returnStartTime, returnEV, tripId++, returnEvRoute, random));
      }
    }
  });

  console.log(`Generated ${trips.length} EV trips between charging stations`);
  return trips;
}

// Check if routes are loaded
export function areRoutesLoaded(): boolean {
  return routesLoaded;
}

// Initial empty data (will be populated after routes load)
export let tripData: TripData[] = [];

// Maximum timestamp for animation
export const MAX_TRIP_TIME = 1800;

// Function to regenerate trip data after routes are loaded
export function refreshTripData(): TripData[] {
  tripData = generateTripData();
  return tripData;
}
