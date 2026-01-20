import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl';
import { Layer, PickingInfo } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

import { cities, arcData, INITIAL_VIEW_STATE, MAP_STYLE, MAPBOX_TOKEN } from '../data/netherlands';
import { chargingStations } from '../data/chargingStations';
import { MAX_TRIP_TIME, initializeRoutes, refreshTripData } from '../data/tripData';
import { TripData } from '../types';
import { createColumnLayer } from '../layers/columnLayer';
import { createScatterplotLayer } from '../layers/scatterplotLayer';
import { createArcLayer } from '../layers/arcLayer';
import { createTripsLayer } from '../layers/tripsLayer';
import { createChargingStationLayer } from '../layers/chargingStationLayer';
import { LayerControls } from './LayerControls';
import { HoverInfoPanel } from './HoverInfoPanel';
import { DetailPanel } from './DetailPanel';
import { AnimationControls } from './AnimationControls';
import { Legend, StationType, TripType } from './Legend';
import { StatsDashboard } from './StatsDashboard';
import { StationDetailPanel } from './StationDetailPanel';
import { ChargingStation } from '../data/chargingStations';
import { LayerType, HoverInfo, City, ArcData } from '../types';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Best Practice 6.3: Hoist static style objects outside component
const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  position: 'relative',
};

function isCity(obj: City | ArcData | ChargingStation): obj is City {
  return 'name' in obj && 'population' in obj;
}

function isChargingStation(obj: City | ArcData | ChargingStation): obj is ChargingStation {
  return 'chargers' in obj && 'operator' in obj;
}

// Best Practice 5.5: Use lazy state initialization
const getInitialViewState = (): ViewState => ({
  longitude: INITIAL_VIEW_STATE.longitude,
  latitude: INITIAL_VIEW_STATE.latitude,
  zoom: INITIAL_VIEW_STATE.zoom,
  pitch: INITIAL_VIEW_STATE.pitch,
  bearing: INITIAL_VIEW_STATE.bearing,
});

// Initialize routes at module level for instant availability
// This runs once when the module is first imported
initializeRoutes();
const initialTripsData = refreshTripData();

export function DeckGLMap() {
  const [activeLayer, setActiveLayer] = useState<LayerType>('trips');
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [viewState, setViewState] = useState<ViewState>(getInitialViewState);

  // Animation state for trips layer
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(0.50);
  const animationRef = useRef<number>();

  // Trip data - initialized instantly from pre-computed routes at module level
  const [tripsData] = useState<TripData[]>(initialTripsData);

  // Filter states for Legend
  const [stationFilters, setStationFilters] = useState<Set<StationType>>(
    () => new Set(['superfast', 'fast', 'standard'])
  );
  const [tripFilters, setTripFilters] = useState<Set<TripType>>(
    () => new Set(['high_battery', 'medium_battery', 'low_battery', 'delivery'])
  );

  // Animation loop for trips layer
  useEffect(() => {
    if (!isPlaying || activeLayer !== 'trips') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Advance time based on animation speed (10 units per frame at 1x speed)
      setCurrentTime((t) => {
        const next = t + (delta * 0.1 * animationSpeed);
        return next > MAX_TRIP_TIME ? 0 : next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, activeLayer, animationSpeed]);

  const layers = useMemo(() => {
    const result: Layer[] = [];

    // Show city columns (not for trips view)
    if (activeLayer === 'columns' || activeLayer === 'all') {
      result.push(createColumnLayer(cities, selectedCity?.name));
    }
    if (activeLayer === 'scatter' || activeLayer === 'all') {
      result.push(createScatterplotLayer(cities));
    }
    if (activeLayer === 'arcs' || activeLayer === 'all') {
      result.push(createArcLayer(arcData));
    }
    if (activeLayer === 'trips') {
      // Add charging stations layer (instead of city columns)
      result.push(createChargingStationLayer(chargingStations, selectedStation?.id, stationFilters));

      // Add trips animation if loaded
      if (tripsData.length > 0) {
        result.push(createTripsLayer(tripsData, currentTime, 50, tripFilters));
      }
    }

    return result;
  }, [activeLayer, selectedCity, selectedStation, currentTime, tripsData, stationFilters, tripFilters]);

  const onHover = useCallback((info: PickingInfo<City | ArcData>) => {
    if (info.object) {
      setHoverInfo({
        object: info.object,
        x: info.x,
        y: info.y,
        layer: info.layer ? { id: info.layer.id } : null,
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onClick = useCallback((info: PickingInfo<City | ArcData | ChargingStation>) => {
    if (info.object) {
      if (isCity(info.object)) {
        const clickedCity = info.object;
        setSelectedCity((prev) =>
          prev?.name === clickedCity.name ? null : clickedCity
        );
        setSelectedStation(null);
      } else if (isChargingStation(info.object)) {
        const clickedStation = info.object;
        setSelectedStation((prev) =>
          prev?.id === clickedStation.id ? null : clickedStation
        );
        setSelectedCity(null);
      }
    }
  }, []);

  // Best Practice 8.2: Use ref for stable callback without stale closures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewStateChange = useCallback((params: any) => {
    const newViewState = params.viewState;
    if (newViewState && typeof newViewState.longitude === 'number' && typeof newViewState.latitude === 'number') {
      setViewState((current) => ({
        longitude: newViewState.longitude,
        latitude: newViewState.latitude,
        zoom: newViewState.zoom ?? current.zoom,
        pitch: newViewState.pitch ?? current.pitch,
        bearing: newViewState.bearing ?? current.bearing,
      }));
    }
  }, []);

  const handleLayerChange = useCallback((layer: LayerType) => {
    setActiveLayer(layer);
    setSelectedCity(null);
    setSelectedStation(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCity(null);
  }, []);

  const handleCloseStationPanel = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const handleStationSelect = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setAnimationSpeed(speed);
  }, []);

  return (
    <div style={containerStyle}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        onHover={onHover}
        onClick={onClick}
        getTooltip={undefined}
      >
        <Map
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>

      <LayerControls activeLayer={activeLayer} onLayerChange={handleLayerChange} />
      <HoverInfoPanel hoverInfo={hoverInfo} />

      {activeLayer === 'trips' && (
        <>
          <Legend
            stationFilters={stationFilters}
            tripFilters={tripFilters}
            onStationFilterChange={setStationFilters}
            onTripFilterChange={setTripFilters}
            showTrips={tripsData.length > 0}
          />
          <StatsDashboard
            stations={chargingStations}
            trips={tripsData}
            stationFilters={stationFilters}
            tripFilters={tripFilters}
          />
        </>
      )}

      {selectedCity && (
        <DetailPanel city={selectedCity} onClose={handleClosePanel} />
      )}

      {selectedStation && (
        <StationDetailPanel
          station={selectedStation}
          onClose={handleCloseStationPanel}
          onStationSelect={handleStationSelect}
        />
      )}

      {activeLayer === 'trips' && tripsData.length > 0 && (
        <AnimationControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          maxTime={MAX_TRIP_TIME}
          animationSpeed={animationSpeed}
          onPlayPause={handlePlayPause}
          onTimeChange={handleTimeChange}
          onSpeedChange={handleSpeedChange}
        />
      )}
    </div>
  );
}
