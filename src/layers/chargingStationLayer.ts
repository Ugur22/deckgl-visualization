import { ColumnLayer } from '@deck.gl/layers';
import { ChargingStation, stationColors } from '../data/chargingStations';
import { StationType } from '../components/Legend';

export function createChargingStationLayer(
  data: ChargingStation[],
  selectedStationId?: string,
  visibleTypes?: Set<StationType>
) {
  // Filter data based on visible types
  const filteredData = visibleTypes && visibleTypes.size > 0
    ? data.filter((d) => visibleTypes.has(d.type))
    : data;

  return new ColumnLayer<ChargingStation>({
    id: 'charging-stations-layer',
    data: filteredData,
    pickable: true,
    extruded: true,
    diskResolution: 8,
    radius: 150, // Smaller radius than city columns
    elevationScale: 50,
    getPosition: (d) => d.coordinates,
    getFillColor: (d) => {
      // Highlight selected station (softened white)
      if (selectedStationId && d.id === selectedStationId) {
        return [240, 240, 245, 255];
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
      // More transparent for glow effect (reduced from 100 to 80)
      return [...baseColor, 80] as [number, number, number, number];
    },
    getElevation: (d) => d.available * 1.5,
  });
}
