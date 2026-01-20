export interface TripWaypoint {
  coordinates: [number, number];
  timestamp: number;
}

export type TripType = 'commuter' | 'roadtrip' | 'delivery';

export interface TripData {
  id: string;
  waypoints: TripWaypoint[];
  vehicle: string;
  color: [number, number, number];
  // Enhanced metadata for interactivity
  vehicleBrand?: string;
  fromStationName?: string;
  toStationName?: string;
  tripType?: TripType;
  batteryStart?: number;
  batteryEnd?: number;
  distanceKm?: number;
}
