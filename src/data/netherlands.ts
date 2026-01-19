import { City, ArcData, PopulationDataPoint, EconomicSector } from '../types';

// Generate historical population data based on current population and growth index
function generatePopulationHistory(currentPop: number, growthIndex: number): PopulationDataPoint[] {
  return Array.from({ length: 10 }, (_, i) => {
    const year = 2016 + i;
    const yearsFromNow = 2025 - year;
    const population = Math.round(currentPop / Math.pow(1 + (growthIndex - 1) * 0.01, yearsFromNow));
    return { year, population };
  });
}

// Generate economic breakdown with some variation per city
function generateEconomicBreakdown(cityIndex: number): EconomicSector[] {
  const baseBreakdowns = [
    { sector: 'Services', percentage: 45 + (cityIndex % 3) * 5 },
    { sector: 'Technology', percentage: 20 + (cityIndex % 4) * 3 },
    { sector: 'Industry', percentage: 15 - (cityIndex % 3) * 2 },
    { sector: 'Tourism', percentage: 12 + (cityIndex % 5) * 2 },
    { sector: 'Agriculture', percentage: 8 - (cityIndex % 4) },
  ];
  // Normalize to 100%
  const total = baseBreakdowns.reduce((sum, b) => sum + b.percentage, 0);
  return baseBreakdowns.map(b => ({
    sector: b.sector,
    percentage: Math.round((b.percentage / total) * 100),
  }));
}

const cityData = [
  { name: 'Amsterdam', coordinates: [4.895168, 52.370216] as [number, number], population: 905234, growthIndex: 1.8 },
  { name: 'Rotterdam', coordinates: [4.462456, 51.926517] as [number, number], population: 656050, growthIndex: 1.5 },
  { name: 'The Hague', coordinates: [4.288788, 52.078663] as [number, number], population: 552995, growthIndex: 1.3 },
  { name: 'Utrecht', coordinates: [5.104480, 52.092876] as [number, number], population: 361924, growthIndex: 2.1 },
  { name: 'Eindhoven', coordinates: [5.47778, 51.44083] as [number, number], population: 238478, growthIndex: 2.4 },
  { name: 'Groningen', coordinates: [6.56667, 53.21917] as [number, number], population: 234249, growthIndex: 1.9 },
  { name: 'Tilburg', coordinates: [5.0913, 51.55551] as [number, number], population: 224702, growthIndex: 1.6 },
  { name: 'Almere', coordinates: [5.222124, 52.371353] as [number, number], population: 218096, growthIndex: 2.8 },
  { name: 'Breda', coordinates: [4.768323, 51.571915] as [number, number], population: 184716, growthIndex: 1.4 },
  { name: 'Nijmegen', coordinates: [5.8528, 51.8425] as [number, number], population: 179073, growthIndex: 1.7 },
];

export const cities: City[] = cityData.map((city, index) => ({
  ...city,
  populationHistory: generatePopulationHistory(city.population, city.growthIndex),
  economicBreakdown: generateEconomicBreakdown(index),
}));

// Create connections between major cities
export const arcData: ArcData[] = [
  { source: cities[0], target: cities[1] }, // Amsterdam - Rotterdam
  { source: cities[0], target: cities[2] }, // Amsterdam - The Hague
  { source: cities[0], target: cities[3] }, // Amsterdam - Utrecht
  { source: cities[1], target: cities[2] }, // Rotterdam - The Hague
  { source: cities[3], target: cities[4] }, // Utrecht - Eindhoven
  { source: cities[0], target: cities[5] }, // Amsterdam - Groningen
  { source: cities[0], target: cities[7] }, // Amsterdam - Almere
  { source: cities[4], target: cities[6] }, // Eindhoven - Tilburg
  { source: cities[1], target: cities[8] }, // Rotterdam - Breda
  { source: cities[3], target: cities[9] }, // Utrecht - Nijmegen
];

export const INITIAL_VIEW_STATE = {
  longitude: 5.2913,
  latitude: 52.1326,
  zoom: 7,
  pitch: 45,
  bearing: 0,
};

// Mapbox styles
export const MAP_STYLES = {
  CUSTOM: 'mapbox://styles/ugur222/cmjevlbg9005601qq5641bgl0',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
} as const;

export const MAP_STYLE = MAP_STYLES.CUSTOM;

// Mapbox access token
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
