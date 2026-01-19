import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl';
import { Layer, PickingInfo } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

import { cities, arcData, INITIAL_VIEW_STATE, MAP_STYLE, MAPBOX_TOKEN } from '../data/netherlands';
import { chargingStations } from '../data/chargingStations';
import { MAX_TRIP_TIME, initializeRoutes, refreshTripData, areRoutesLoaded } from '../data/tripData';
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

function isCity(obj: City | ArcData): obj is City {
  return 'name' in obj && 'population' in obj;
}

// Best Practice 5.5: Use lazy state initialization
const getInitialViewState = (): ViewState => ({
  longitude: INITIAL_VIEW_STATE.longitude,
  latitude: INITIAL_VIEW_STATE.latitude,
  zoom: INITIAL_VIEW_STATE.zoom,
  pitch: INITIAL_VIEW_STATE.pitch,
  bearing: INITIAL_VIEW_STATE.bearing,
});

export function DeckGLMap() {
  const [activeLayer, setActiveLayer] = useState<LayerType>('trips');
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [viewState, setViewState] = useState<ViewState>(getInitialViewState);

  // Animation state for trips layer
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(0.50);
  const animationRef = useRef<number>();

  // Route loading state
  const [routesLoading, setRoutesLoading] = useState(false);
  const [tripsData, setTripsData] = useState<TripData[]>([]);

  // Load routes when trips layer is first selected
  useEffect(() => {
    if (activeLayer === 'trips' && !areRoutesLoaded() && !routesLoading) {
      setRoutesLoading(true);

      initializeRoutes().then(() => {
        const data = refreshTripData();
        setTripsData(data);
        setRoutesLoading(false);
      });
    }
  }, [activeLayer, routesLoading]);

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
      result.push(createChargingStationLayer(chargingStations));

      // Add trips animation if loaded
      if (tripsData.length > 0) {
        result.push(createTripsLayer(tripsData, currentTime));
      }
    }

    return result;
  }, [activeLayer, selectedCity, currentTime, tripsData]);

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

  const onClick = useCallback((info: PickingInfo<City | ArcData>) => {
    if (info.object && isCity(info.object)) {
      const clickedCity = info.object;
      setSelectedCity((prev) =>
        prev?.name === clickedCity.name ? null : clickedCity
      );
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
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCity(null);
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

      {selectedCity && (
        <DetailPanel city={selectedCity} onClose={handleClosePanel} />
      )}

      {activeLayer === 'trips' && routesLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '24px 48px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
            Loading Routes...
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Fetching real road data from Mapbox
          </div>
        </div>
      )}

      {activeLayer === 'trips' && !routesLoading && tripsData.length > 0 && (
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
