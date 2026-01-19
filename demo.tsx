import React, { useState, useCallback, useEffect } from 'react';

// Since deck.gl and maplibre aren't available in the artifact environment,
// I'll create a mock visualization that demonstrates the concept
// For the real thing, you'll need to run this locally

// Sample data - cities in Netherlands with mock values
const CITIES_DATA = [
  { name: 'Amsterdam', x: 180, y: 120, population: 872680, growth: 150 },
  { name: 'Rotterdam', x: 160, y: 220, population: 651446, growth: 120 },
  { name: 'The Hague', x: 130, y: 180, population: 545163, growth: 90 },
  { name: 'Utrecht', x: 220, y: 160, population: 361924, growth: 180 },
  { name: 'Eindhoven', x: 260, y: 280, population: 234456, growth: 140 },
  { name: 'Groningen', x: 340, y: 40, population: 232826, growth: 100 },
  { name: 'Tilburg', x: 220, y: 260, population: 219632, growth: 80 },
  { name: 'Almere', x: 240, y: 130, population: 212472, growth: 200 },
  { name: 'Breda', x: 180, y: 280, population: 184126, growth: 70 },
  { name: 'Nijmegen', x: 320, y: 230, population: 177776, growth: 110 },
];

const CONNECTIONS = [
  { from: 'Amsterdam', to: 'Rotterdam', value: 5000 },
  { from: 'Amsterdam', to: 'Utrecht', value: 8000 },
  { from: 'Amsterdam', to: 'The Hague', value: 4000 },
  { from: 'Rotterdam', to: 'Breda', value: 2000 },
  { from: 'Utrecht', to: 'Eindhoven', value: 3000 },
];

const getColor = (value, max) => {
  const ratio = value / max;
  const r = Math.floor(50 + ratio * 200);
  const g = Math.floor(100 + (1 - ratio) * 100);
  const b = Math.floor(200 - ratio * 150);
  return `rgb(${r}, ${g}, ${b})`;
};

const getCityByName = (name) => CITIES_DATA.find(c => c.name === name);

export default function DeckGLConceptDemo() {
  const [activeLayer, setActiveLayer] = useState('columns');
  const [hoveredCity, setHoveredCity] = useState(null);
  const [rotation, setRotation] = useState(0);

  const maxPopulation = Math.max(...CITIES_DATA.map(d => d.population));
  const maxGrowth = Math.max(...CITIES_DATA.map(d => d.growth));

  // Animate rotation for 3D effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getBarHeight = (pop) => (pop / maxPopulation) * 120;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">DeckGL Layer Proof of Concept</h1>
        <p className="text-slate-400 text-sm">
          This demonstrates the layer types available in deck.gl. 
          The actual library requires a local dev environment to run.
        </p>
      </div>

      <div className="flex gap-4">
        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-4 w-56 shrink-0">
          <h3 className="font-semibold mb-3 text-sm">Layer Type</h3>
          <div className="flex flex-col gap-2">
            {[
              { id: 'columns', label: '📊 ColumnLayer', desc: '3D bars on map' },
              { id: 'scatter', label: '⭕ ScatterplotLayer', desc: 'Sized circles' },
              { id: 'arcs', label: '🌈 ArcLayer', desc: 'Curved connections' },
              { id: 'all', label: '✨ All Layers', desc: 'Combined view' },
            ].map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setActiveLayer(id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  activeLayer === id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs opacity-70">{desc}</div>
              </button>
            ))}
          </div>

          {/* Hovered city info */}
          {hoveredCity && (
            <div className="mt-4 p-3 bg-slate-700 rounded-lg">
              <h4 className="font-semibold">{hoveredCity.name}</h4>
              <p className="text-sm text-slate-300">
                Pop: {hoveredCity.population.toLocaleString()}
              </p>
              <p className="text-sm text-slate-300">
                Growth: {hoveredCity.growth}
              </p>
            </div>
          )}
        </div>

        {/* Map Visualization */}
        <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden relative" style={{ minHeight: 500 }}>
          {/* Fake map background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 40%, #1e40af 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, #0f766e 0%, transparent 40%)
              `,
            }}
          />
          
          {/* Grid lines for map effect */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            {[...Array(20)].map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 5 + '%'} y1="0" x2={i * 5 + '%'} y2="100%" stroke="white" />
                <line x1="0" y1={i * 5 + '%'} x2="100%" y2={i * 5 + '%'} stroke="white" />
              </React.Fragment>
            ))}
          </svg>

          {/* Arc Layer */}
          {(activeLayer === 'arcs' || activeLayer === 'all') && (
            <svg className="absolute inset-0 w-full h-full">
              {CONNECTIONS.map((conn, i) => {
                const from = getCityByName(conn.from);
                const to = getCityByName(conn.to);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2 - 40;
                return (
                  <path
                    key={i}
                    d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                    fill="none"
                    stroke="url(#arcGradient)"
                    strokeWidth={conn.value / 1500}
                    opacity={0.8}
                  />
                );
              })}
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00b4e6" />
                  <stop offset="100%" stopColor="#ff6464" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Scatterplot Layer */}
          {(activeLayer === 'scatter' || activeLayer === 'all') && (
            <svg className="absolute inset-0 w-full h-full">
              {CITIES_DATA.map((city, i) => (
                <circle
                  key={i}
                  cx={city.x}
                  cy={city.y}
                  r={city.growth / 8}
                  fill={getColor(city.growth, maxGrowth)}
                  opacity={0.7}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer transition-all hover:opacity-100"
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                />
              ))}
            </svg>
          )}

          {/* Column Layer (3D bars) */}
          {(activeLayer === 'columns' || activeLayer === 'all') && (
            <div className="absolute inset-0" style={{ perspective: 800 }}>
              {CITIES_DATA.map((city, i) => {
                const height = getBarHeight(city.population);
                return (
                  <div
                    key={i}
                    className="absolute cursor-pointer transition-transform hover:scale-110"
                    style={{
                      left: city.x - 15,
                      top: city.y - height,
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(60deg) rotateZ(${rotation * 0.1}deg)`,
                    }}
                    onMouseEnter={() => setHoveredCity(city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    {/* 3D Column */}
                    <div
                      className="relative"
                      style={{
                        width: 30,
                        height: height,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute inset-0 rounded-t"
                        style={{
                          background: getColor(city.population, maxPopulation),
                          transform: 'translateZ(15px)',
                        }}
                      />
                      {/* Top face */}
                      <div
                        className="absolute w-full rounded"
                        style={{
                          height: 30,
                          background: getColor(city.population, maxPopulation),
                          filter: 'brightness(1.3)',
                          transform: 'rotateX(-90deg) translateZ(0px)',
                          top: 0,
                        }}
                      />
                      {/* Side face */}
                      <div
                        className="absolute rounded-t"
                        style={{
                          width: 30,
                          height: height,
                          background: getColor(city.population, maxPopulation),
                          filter: 'brightness(0.7)',
                          transform: 'rotateY(90deg) translateZ(15px)',
                          left: 0,
                        }}
                      />
                    </div>
                    {/* Label */}
                    <div 
                      className="absolute text-xs font-medium text-white whitespace-nowrap"
                      style={{ 
                        top: height + 5, 
                        left: '50%', 
                        transform: 'translateX(-50%) rotateX(-60deg)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}
                    >
                      {city.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur p-3 rounded-lg">
            <div className="text-xs font-medium mb-2">
              {activeLayer === 'columns' && 'Population (bar height)'}
              {activeLayer === 'scatter' && 'Growth Index (circle size)'}
              {activeLayer === 'arcs' && 'Traffic Flow (line width)'}
              {activeLayer === 'all' && 'Combined Visualization'}
            </div>
            <div 
              className="w-24 h-2 rounded"
              style={{ background: 'linear-gradient(to right, #5090c8, #c86450)' }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Note */}
          <div className="absolute top-4 right-4 bg-blue-900/80 backdrop-blur px-3 py-2 rounded-lg text-xs max-w-xs">
            <strong>Note:</strong> This is a CSS/SVG mockup. The real deck.gl 
            renders via WebGL with actual map tiles and smooth 60fps interactions.
          </div>
        </div>
      </div>

      {/* Code example */}
      <div className="mt-4 bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Real DeckGL Code (run locally):</h3>
        <pre className="text-xs bg-slate-900 p-3 rounded overflow-x-auto text-green-400">
{`import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';

const layer = new ColumnLayer({
  id: 'columns',
  data: CITIES_DATA,
  getPosition: d => d.coordinates,
  getElevation: d => d.population / 100,
  getFillColor: d => [48, 128, d.population/5000, 255],
  radius: 3000,
  extruded: true,
  pickable: true,
});

<DeckGL layers={[layer]} controller={true}>
  <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
</DeckGL>`}
        </pre>
      </div>
    </div>
  );
}