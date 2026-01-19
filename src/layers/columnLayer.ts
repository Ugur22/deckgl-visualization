import { ColumnLayer } from '@deck.gl/layers';
import { City } from '../types';

export function createColumnLayer(data: City[], selectedCityName?: string | null) {
  return new ColumnLayer<City>({
    id: 'column-layer',
    data,
    diskResolution: 12,
    radius: 2000,
    extruded: true,
    pickable: true,
    elevationScale: 50,
    getPosition: (d) => d.coordinates,
    getFillColor: (d) => {
      const isSelected = d.name === selectedCityName;
      if (isSelected) {
        return [33, 150, 243, 255]; // Bright blue for selected
      }
      const ratio = d.population / 1000000;
      return [
        Math.min(255, 100 + ratio * 155),
        Math.max(0, 200 - ratio * 100),
        100,
        selectedCityName ? 140 : 200, // Dim others when one is selected
      ];
    },
    getElevation: (d) => {
      const isSelected = d.name === selectedCityName;
      const baseElevation = d.population / 1000;
      return isSelected ? baseElevation * 1.15 : baseElevation; // Selected is 15% taller
    },
    updateTriggers: {
      getFillColor: [selectedCityName],
      getElevation: [selectedCityName],
    },
  });
}
