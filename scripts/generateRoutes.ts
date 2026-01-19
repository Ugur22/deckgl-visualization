#!/usr/bin/env npx tsx

/**
 * Node.js script to pre-compute route geometries from Mapbox Directions API
 *
 * Usage: npx tsx scripts/generateRoutes.ts
 *
 * This script:
 * 1. Generates the EV route network (same logic as tripData.ts)
 * 2. Fetches all route geometries from Mapbox Directions API
 * 3. Saves them to src/data/precomputedRoutes.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv(): void {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('Error: VITE_MAPBOX_TOKEN not found in .env file');
  process.exit(1);
}

// ============================================================================
// Types (copied from src/types and src/services/routeService.ts)
// ============================================================================

interface ChargingStation {
  id: string;
  name: string;
  coordinates: [number, number];
  chargers: number;
  type: 'fast' | 'superfast' | 'standard';
  operator: string;
  available: number;
}

interface RouteGeometry {
  coordinates: [number, number][];
  duration: number;
  distance: number;
}

interface EVRoute {
  from: ChargingStation;
  to: ChargingStation;
  tripType: 'commuter' | 'roadtrip' | 'delivery';
  weight: number;
}

// ============================================================================
// Seeded random for consistent generation (from chargingStations.ts)
// ============================================================================

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ============================================================================
// Charging stations data (from chargingStations.ts)
// ============================================================================

const operators = ['Tesla', 'Fastned', 'Shell Recharge', 'Allego', 'Ionity', 'BP Pulse', 'EVBox'];

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

const highwayStations: { name: string; coords: [number, number] }[] = [
  { name: 'A1 Amersfoort', coords: [5.387, 52.156] },
  { name: 'A1 Deventer', coords: [6.155, 52.251] },
  { name: 'A1 Hengelo', coords: [6.793, 52.265] },
  { name: 'A2 Breukelen', coords: [4.989, 52.172] },
  { name: 'A2 Vianen', coords: [5.091, 51.989] },
  { name: 'A2 Den Bosch', coords: [5.299, 51.688] },
  { name: 'A2 Eindhoven Noord', coords: [5.462, 51.481] },
  { name: 'A2 Weert', coords: [5.707, 51.252] },
  { name: 'A4 Hoofddorp', coords: [4.689, 52.303] },
  { name: 'A4 Leiden', coords: [4.497, 52.160] },
  { name: 'A4 Delft', coords: [4.357, 51.998] },
  { name: 'A12 Woerden', coords: [4.881, 52.085] },
  { name: 'A12 Ede', coords: [5.666, 52.039] },
  { name: 'A12 Arnhem', coords: [5.898, 51.985] },
  { name: 'A28 Amersfoort Zuid', coords: [5.387, 52.130] },
  { name: 'A28 Harderwijk', coords: [5.620, 52.342] },
  { name: 'A28 Zwolle', coords: [6.083, 52.508] },
  { name: 'A27 Hilversum', coords: [5.176, 52.223] },
  { name: 'A27 Gorinchem', coords: [4.973, 51.834] },
  { name: 'A58 Roosendaal', coords: [4.465, 51.530] },
  { name: 'A58 Bergen op Zoom', coords: [4.292, 51.495] },
  { name: 'A67 Venlo', coords: [6.172, 51.370] },
  { name: 'A7 Hoorn', coords: [5.059, 52.642] },
  { name: 'A7 Afsluitdijk', coords: [5.271, 53.017] },
  { name: 'A7 Heerenveen', coords: [5.924, 52.960] },
  { name: 'A28 Assen', coords: [6.562, 52.993] },
];

function generateStationsAroundCity(
  cityName: string,
  center: [number, number],
  count: number,
  startId: number,
  random: () => number
): ChargingStation[] {
  const stations: ChargingStation[] = [];

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 0.02 + random() * 0.06;

    const lng = center[0] + Math.cos(angle) * distance;
    const lat = center[1] + Math.sin(angle) * distance * 0.7;

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
  id: number,
  random: () => number
): ChargingStation {
  const type = random() < 0.4 ? 'superfast' : 'fast';
  const chargers = type === 'superfast' ? 12 + Math.floor(random() * 12) : 6 + Math.floor(random() * 8);

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

function generateChargingStations(): ChargingStation[] {
  const random = seededRandom(123);
  const stations: ChargingStation[] = [];
  let stationId = 0;

  cityHubs.forEach((city) => {
    const cityStations = generateStationsAroundCity(
      city.name,
      city.coords,
      city.density,
      stationId,
      random
    );
    stations.push(...cityStations);
    stationId += city.density;
  });

  highwayStations.forEach((highway, i) => {
    stations.push(generateHighwayStation(highway.name, highway.coords, i, random));
  });

  return stations;
}

// ============================================================================
// Route network generation (from tripData.ts)
// ============================================================================

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

function findNearbyStations(
  station: ChargingStation,
  chargingStations: ChargingStation[],
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
    .sort(() => random() - 0.5);
}

function generateEVRouteNetwork(chargingStations: ChargingStation[], random: () => number): EVRoute[] {
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

  return routes;
}

function getRouteKey(fromId: string, toId: string): string {
  return `${fromId}-${toId}`;
}

// ============================================================================
// Route fetching (from routeService.ts) with retry logic
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRouteWithRetry(
  start: [number, number],
  end: [number, number],
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<RouteGeometry | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await sleep(waitTime);
          continue;
        }
        return null;
      }

      if (!response.ok) {
        if (attempt < maxRetries) {
          await sleep(retryDelay);
          continue;
        }
        return null;
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates as [number, number][],
        duration: route.duration,
        distance: route.distance,
      };
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(retryDelay);
        continue;
      }
      return null;
    }
  }
  return null;
}

// ============================================================================
// Main script
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('EV Route Precomputation Script');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Generate charging stations
  console.log('[1/4] Generating charging stations...');
  const chargingStations = generateChargingStations();
  console.log(`      Generated ${chargingStations.length} charging stations`);
  console.log();

  // Step 2: Generate EV route network
  console.log('[2/4] Generating EV route network...');
  const random = seededRandom(42);
  const evRoutes = generateEVRouteNetwork(chargingStations, random);
  console.log(`      Generated ${evRoutes.length} route connections`);
  console.log();

  // Step 3: Collect unique route pairs
  console.log('[3/4] Collecting unique route pairs...');
  const routePairs: Array<{ from: ChargingStation; to: ChargingStation; key: string }> = [];
  const seenKeys = new Set<string>();

  evRoutes.forEach((route) => {
    const key = getRouteKey(route.from.id, route.to.id);
    const reverseKey = getRouteKey(route.to.id, route.from.id);

    if (!seenKeys.has(key)) {
      routePairs.push({ from: route.from, to: route.to, key });
      seenKeys.add(key);
    }
    if (!seenKeys.has(reverseKey)) {
      routePairs.push({ from: route.to, to: route.from, key: reverseKey });
      seenKeys.add(reverseKey);
    }
  });

  console.log(`      Need to fetch ${routePairs.length} unique routes`);
  console.log();

  // Step 4: Fetch routes from Mapbox
  console.log('[4/4] Fetching routes from Mapbox Directions API...');
  console.log('      (This may take a few minutes due to API rate limits)');
  const routeGeometries: Record<string, RouteGeometry> = {};
  let fetched = 0;
  let failed = 0;

  // Use smaller batch size and longer delays to avoid rate limiting
  const batchSize = 2;
  const delayBetweenBatches = 500; // ms between batches
  const startTime = Date.now();

  for (let i = 0; i < routePairs.length; i += batchSize) {
    const batch = routePairs.slice(i, i + batchSize);

    const promises = batch.map(async ({ from, to, key }) => {
      const route = await fetchRouteWithRetry(from.coordinates, to.coordinates);
      if (route) {
        routeGeometries[key] = route;
        fetched++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    // Progress update
    const progress = Math.min(i + batchSize, routePairs.length);
    const percent = Math.round((progress / routePairs.length) * 100);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(`\r      Progress: ${progress}/${routePairs.length} (${percent}%) - ${fetched} fetched, ${failed} failed - ${elapsed}s elapsed`);

    // Rate limiting delay between batches
    if (i + batchSize < routePairs.length) {
      await sleep(delayBetweenBatches);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();
  console.log(`      Completed in ${elapsed}s`);
  console.log();

  // Save to JSON file
  const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'precomputedRoutes.json');

  // Ensure the directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Saving routes to JSON file...');
  fs.writeFileSync(outputPath, JSON.stringify(routeGeometries, null, 2));

  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`      Saved to: ${outputPath}`);
  console.log(`      File size: ${fileSizeKB} KB`);
  console.log(`      Total routes: ${Object.keys(routeGeometries).length}`);
  console.log();
  console.log('='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

// Run the script
main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
