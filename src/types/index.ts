import { ChargingStation } from '../data/chargingStations';
import { TripData as TripDataType } from './trip';

export interface PopulationDataPoint {
  year: number;
  population: number;
}

export interface EconomicSector {
  sector: string;
  percentage: number;
}

export interface City {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  population: number;
  growthIndex: number;
  populationHistory: PopulationDataPoint[];
  economicBreakdown: EconomicSector[];
}

export interface ArcData {
  source: City;
  target: City;
}

export type LayerType = 'columns' | 'scatter' | 'arcs' | 'trips' | 'all';

export type { TripWaypoint, TripData } from './trip';

export interface HoverInfo {
  object?: City | ArcData | ChargingStation | TripDataType;
  x: number;
  y: number;
  layer?: { id: string } | null;
}
