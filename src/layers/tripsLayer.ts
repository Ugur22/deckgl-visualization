import { TripsLayer } from '@deck.gl/geo-layers';
import { TripData } from '../types';

export function createTripsLayer(
  data: TripData[],
  currentTime: number,
  trailLength: number = 50
): TripsLayer<TripData> {
  return new TripsLayer<TripData>({
    id: 'trips-layer',
    data,
    getPath: (d) => d.waypoints.map((w) => w.coordinates),
    getTimestamps: (d) => d.waypoints.map((w) => w.timestamp),
    getColor: (d) => d.color,
    currentTime,
    trailLength,
    widthMinPixels: 4,
    capRounded: true,
    jointRounded: true,
  });
}
