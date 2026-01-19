import { ArcLayer } from '@deck.gl/layers';
import { ArcData } from '../types';

export function createArcLayer(data: ArcData[]) {
  return new ArcLayer<ArcData>({
    id: 'arc-layer',
    data,
    pickable: true,
    getWidth: 3,
    getSourcePosition: (d) => d.source.coordinates,
    getTargetPosition: (d) => d.target.coordinates,
    getSourceColor: [0, 128, 200, 200],
    getTargetColor: [200, 0, 80, 200],
    getHeight: 0.5,
  });
}
