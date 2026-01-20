import { TripsLayer } from '@deck.gl/geo-layers';
import { TripData } from '../types';
import { TripType } from '../components/Legend';

// Determine trip type based on color
function getTripTypeFromColor(color: [number, number, number]): TripType {
  // Delivery: terracotta [185, 110, 90]
  if (color[0] > 180 && color[1] > 100 && color[1] < 120) return 'delivery';
  // High battery: green-ish [70, 185, 125] or lighter variants
  if (color[1] > 150 && color[0] < 150) return 'high_battery';
  // Low battery: coral [195, 95, 95] or lighter variants
  if (color[0] > 180 && color[1] < 140 && color[2] < 140) return 'low_battery';
  // Medium battery: golden [205, 175, 65] or lighter variants
  return 'medium_battery';
}

export function createTripsLayer(
  data: TripData[],
  currentTime: number,
  trailLength: number = 50,
  visibleTripTypes?: Set<TripType>
): TripsLayer<TripData> {
  // Filter data based on visible trip types
  const filteredData = visibleTripTypes && visibleTripTypes.size > 0
    ? data.filter((d) => visibleTripTypes.has(getTripTypeFromColor(d.color)))
    : data;

  return new TripsLayer<TripData>({
    id: 'trips-layer',
    data: filteredData,
    getPath: (d) => d.waypoints.map((w) => w.coordinates),
    getTimestamps: (d) => d.waypoints.map((w) => w.timestamp),
    getColor: (d) => d.color,
    currentTime,
    trailLength,
    opacity: 0.85,
    widthMinPixels: 3,
    capRounded: true,
    jointRounded: true,
    // Trip interactivity
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
  });
}
