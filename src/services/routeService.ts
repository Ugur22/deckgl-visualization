import { MAPBOX_TOKEN } from '../data/netherlands';

export interface RouteGeometry {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
}

// Cache for fetched routes
const routeCache = new Map<string, RouteGeometry>();

function getCacheKey(start: [number, number], end: [number, number]): string {
  return `${start[0].toFixed(4)},${start[1].toFixed(4)}-${end[0].toFixed(4)},${end[1].toFixed(4)}`;
}

export async function fetchRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteGeometry | null> {
  const cacheKey = getCacheKey(start, end);

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Route fetch failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found');
      return null;
    }

    const route = data.routes[0];
    const geometry: RouteGeometry = {
      coordinates: route.geometry.coordinates as [number, number][],
      duration: route.duration,
      distance: route.distance,
    };

    console.log(`Route fetched: ${geometry.coordinates.length} points, ${(geometry.distance / 1000).toFixed(1)}km`);
    routeCache.set(cacheKey, geometry);
    return geometry;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export async function fetchAllRoutes(
  routePairs: Array<{ start: [number, number]; end: [number, number] }>
): Promise<Map<string, RouteGeometry>> {
  const results = new Map<string, RouteGeometry>();

  // Fetch in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < routePairs.length; i += batchSize) {
    const batch = routePairs.slice(i, i + batchSize);
    const promises = batch.map(({ start, end }) => fetchRoute(start, end));
    const routes = await Promise.all(promises);

    batch.forEach(({ start, end }, index) => {
      const route = routes[index];
      if (route) {
        results.set(getCacheKey(start, end), route);
      }
    });

    // Small delay between batches
    if (i + batchSize < routePairs.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

export function getRouteFromCache(
  start: [number, number],
  end: [number, number]
): RouteGeometry | null {
  return routeCache.get(getCacheKey(start, end)) || null;
}

export function clearRouteCache(): void {
  routeCache.clear();
}
