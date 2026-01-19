export interface TripWaypoint {
  coordinates: [number, number];
  timestamp: number;
}

export interface TripData {
  id: string;
  waypoints: TripWaypoint[];
  vehicle: string;
  color: [number, number, number];
}
