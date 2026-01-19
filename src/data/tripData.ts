import { TripData, TripWaypoint } from '../types';
import { chargingStations, ChargingStation } from './chargingStations';
import { RouteGeometry } from '../services/routeService';
import precomputedRoutes from './precomputedRoutes.json';

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

// Calculate distance between two coordinates in km
function getDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371;
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

// Find nearby stations within distance range
function findNearbyStations(
  station: ChargingStation,
  stations: ChargingStation[],
  minKm: number,
  maxKm: number,
  random: () => number
): ChargingStation[] {
  return stations
    .filter((s) => {
      if (s.id === station.id) return false;
      const dist = getDistance(station.coordinates, s.coordinates);
      return dist >= minKm && dist <= maxKm;
    })
    .sort(() => random() - 0.5);
}

// Generate EV route network (deterministic with seed)
function generateEVRouteNetwork(random: () => number): EVRoute[] {
  const routes: EVRoute[] = [];

  const highwayStations = chargingStations.filter((s) => s.id.startsWith('highway-'));
  const cityStations = chargingStations.filter((s) => !s.id.startsWith('highway-'));

  // 1. Highway corridor trips
  highwayStations.forEach((station) => {
    const nearby = findNearbyStations(station, chargingStations, 20, 80, random);
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

  // 2. City to highway trips
  cityStations.forEach((station) => {
    if (random() > 0.3) return;
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

  // 3. Local commuter trips
  cityStations.forEach((station) => {
    const nearbyCity = findNearbyStations(station, chargingStations, 3, 25, random);
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

  // 4. Delivery routes
  const deliveryHubs = cityStations.filter((s) => s.type === 'superfast');
  deliveryHubs.forEach((hub) => {
    const nearbyStations = findNearbyStations(hub, chargingStations, 2, 15, random);
    nearbyStations.slice(0, 4).forEach((target) => {
      routes.push({
        from: hub,
        to: target,
        tripType: 'delivery',
        weight: 5 + Math.floor(random() * 5),
      });
    });
  });

  // 5. Extra Amsterdam & Rotterdam routes (high traffic cities)
  const amsterdamStations = cityStations.filter((s) => s.name.includes('Amsterdam'));
  const rotterdamStations = cityStations.filter((s) => s.name.includes('Rotterdam'));

  // Amsterdam-Rotterdam inter-city commuter corridor
  amsterdamStations.slice(0, 8).forEach((amsStation) => {
    rotterdamStations.slice(0, 6).forEach((rotStation) => {
      if (random() > 0.6) return; // 40% chance to create route
      routes.push({
        from: amsStation,
        to: rotStation,
        tripType: 'roadtrip',
        weight: 3 + Math.floor(random() * 3),
      });
    });
  });

  // Extra Amsterdam internal commuter routes
  amsterdamStations.forEach((station) => {
    const nearbyAms = amsterdamStations
      .filter((s) => s.id !== station.id)
      .sort(() => random() - 0.5)
      .slice(0, 3);
    nearbyAms.forEach((target) => {
      routes.push({
        from: station,
        to: target,
        tripType: 'commuter',
        weight: 5 + Math.floor(random() * 5),
      });
    });
  });

  // Extra Rotterdam internal commuter routes
  rotterdamStations.forEach((station) => {
    const nearbyRot = rotterdamStations
      .filter((s) => s.id !== station.id)
      .sort(() => random() - 0.5)
      .slice(0, 3);
    nearbyRot.forEach((target) => {
      routes.push({
        from: station,
        to: target,
        tripType: 'commuter',
        weight: 5 + Math.floor(random() * 5),
      });
    });
  });

  // Amsterdam & Rotterdam delivery hub boost
  const amsDeliveryHubs = amsterdamStations.filter((s) => s.type === 'superfast' || s.type === 'fast');
  const rotDeliveryHubs = rotterdamStations.filter((s) => s.type === 'superfast' || s.type === 'fast');

  [...amsDeliveryHubs, ...rotDeliveryHubs].forEach((hub) => {
    const nearbyStations = findNearbyStations(hub, chargingStations, 1, 20, random);
    nearbyStations.slice(0, 6).forEach((target) => {
      routes.push({
        from: hub,
        to: target,
        tripType: 'delivery',
        weight: 6 + Math.floor(random() * 6),
      });
    });
  });

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

// Load pre-computed routes from static JSON file (synchronous)
export function initializeRoutes(): void {
  if (routesLoaded) return;

  console.log('Loading pre-computed route geometries from JSON...');

  // Generate EV route network (fast, deterministic with seed 42)
  const random = seededRandom(42);
  evRoutes = generateEVRouteNetwork(random);

  // Load route geometries from JSON (flat object of route key -> geometry)
  const geometries = precomputedRoutes as unknown as Record<string, RouteGeometry>;
  routeGeometries = new Map(Object.entries(geometries));

  routesLoaded = true;
  console.log(`Generated ${evRoutes.length} EV routes, loaded ${routeGeometries.size} route geometries from pre-computed data.`);
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
