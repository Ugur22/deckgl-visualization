import { ColumnLayer } from '@deck.gl/layers';
import { ChargingStation, stationColors } from '../data/chargingStations';

export function createChargingStationLayer(
  data: ChargingStation[],
  selectedStationId?: string
) {
  return new ColumnLayer<ChargingStation>({
    id: 'charging-stations-layer',
    data,
    pickable: true,
    extruded: true,
    diskResolution: 8,
    radius: 150, // Smaller radius than city columns
    elevationScale: 50,
    getPosition: (d) => d.coordinates,
    getFillColor: (d) => {
      // Highlight selected station
      if (selectedStationId && d.id === selectedStationId) {
        return [255, 255, 255, 255];
      }
      // Color by station type
      const baseColor = stationColors[d.type];
      return [...baseColor, 220] as [number, number, number, number];
    },
    getElevation: (d) => d.chargers * 2, // Height based on number of chargers
    updateTriggers: {
      getFillColor: [selectedStationId],
    },
  });
}

// Alternative: Icon-style layer with glow effect for available chargers
export function createChargingStationGlowLayer(data: ChargingStation[]) {
  return new ColumnLayer<ChargingStation>({
    id: 'charging-stations-glow-layer',
    data: data.filter((d) => d.available > 0), // Only show stations with availability
    pickable: false,
    extruded: true,
    diskResolution: 12,
    radius: 200,
    elevationScale: 30,
    getPosition: (d) => d.coordinates,
    getFillColor: (d) => {
      const baseColor = stationColors[d.type];
      // More transparent for glow effect
      return [...baseColor, 100] as [number, number, number, number];
    },
    getElevation: (d) => d.available * 1.5,
  });
}
