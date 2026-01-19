import { ScatterplotLayer } from '@deck.gl/layers';
import { City } from '../types';

export function createScatterplotLayer(data: City[]) {
  return new ScatterplotLayer<City>({
    id: 'scatterplot-layer',
    data,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 1000,
    radiusMinPixels: 5,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 1,
    getPosition: (d) => d.coordinates,
    getRadius: (d) => d.growthIndex * 3,
    getFillColor: (d) => {
      const growth = d.growthIndex;
      if (growth > 2.0) return [76, 175, 80, 200];  // Green - high growth
      if (growth > 1.5) return [255, 193, 7, 200];   // Yellow - medium growth
      return [244, 67, 54, 200];                      // Red - low growth
    },
    getLineColor: [255, 255, 255],
  });
}
