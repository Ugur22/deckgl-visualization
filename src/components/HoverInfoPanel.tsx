import { HoverInfo, City, ArcData, TripData } from '../types';
import { ChargingStation } from '../data/chargingStations';

interface HoverInfoPanelProps {
  hoverInfo: HoverInfo | null;
}

type HoverObject = City | ArcData | ChargingStation | TripData;

function isCity(obj: HoverObject): obj is City {
  return 'name' in obj && 'population' in obj;
}

function isChargingStation(obj: HoverObject): obj is ChargingStation {
  return 'chargers' in obj && 'operator' in obj;
}

function isArcData(obj: HoverObject): obj is ArcData {
  return 'source' in obj && 'target' in obj;
}

function isTripData(obj: HoverObject): obj is TripData {
  return 'waypoints' in obj && 'vehicle' in obj;
}

const tripTypeLabels: Record<string, string> = {
  commuter: 'Commuter',
  roadtrip: 'Road Trip',
  delivery: 'Delivery',
};

const tripTypeColors: Record<string, string> = {
  commuter: '#82c896',
  roadtrip: '#64b57d',
  delivery: '#b96e5a',
};

const typeColors = {
  superfast: '#00ff88',
  fast: '#00c8ff',
  standard: '#ffc800',
};

export function HoverInfoPanel({ hoverInfo }: HoverInfoPanelProps) {
  if (!hoverInfo?.object) return null;

  const { x, y, object, layer } = hoverInfo;

  const renderContent = () => {
    if (isChargingStation(object)) {
      return (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            {object.name}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#aaa' }}>Operator:</span> {object.operator}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#aaa' }}>Chargers:</span> {object.available}/{object.chargers} available
          </div>
          <div>
            <span style={{ color: '#aaa' }}>Type:</span>{' '}
            <span style={{ color: typeColors[object.type], fontWeight: 500 }}>
              {object.type.charAt(0).toUpperCase() + object.type.slice(1)}
            </span>
          </div>
        </>
      );
    }

    if (isCity(object)) {
      return (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            {object.name}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#aaa' }}>Population:</span>{' '}
            {object.population.toLocaleString()}
          </div>
          <div>
            <span style={{ color: '#aaa' }}>Growth Index:</span>{' '}
            <span
              style={{
                color:
                  object.growthIndex > 2.0
                    ? '#4caf50'
                    : object.growthIndex > 1.5
                    ? '#ffc107'
                    : '#f44336',
              }}
            >
              {object.growthIndex.toFixed(1)}
            </span>
          </div>
        </>
      );
    }

    if (isArcData(object)) {
      return (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Connection</div>
          <div>
            {object.source.name} → {object.target.name}
          </div>
        </>
      );
    }

    if (isTripData(object)) {
      const tripType = object.tripType || 'commuter';
      const tripColor = tripTypeColors[tripType] || '#888';

      return (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            {object.vehicleBrand || object.vehicle}
          </div>
          {object.tripType && (
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: tripColor,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                {tripTypeLabels[object.tripType]}
              </span>
            </div>
          )}
          {object.fromStationName && object.toStationName && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#aaa' }}>Route:</span>{' '}
              <span style={{ fontSize: '12px' }}>
                {object.fromStationName.split(' ').slice(0, 2).join(' ')} → {object.toStationName.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
          )}
          {object.batteryStart !== undefined && object.batteryEnd !== undefined && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#aaa' }}>Battery:</span>{' '}
              <span style={{ color: object.batteryStart > 60 ? '#81c784' : object.batteryStart > 30 ? '#ffb74d' : '#e57373' }}>
                {object.batteryStart}%
              </span>
              {' → '}
              <span style={{ color: object.batteryEnd > 60 ? '#81c784' : object.batteryEnd > 30 ? '#ffb74d' : '#e57373' }}>
                {object.batteryEnd}%
              </span>
            </div>
          )}
          {object.distanceKm !== undefined && (
            <div>
              <span style={{ color: '#aaa' }}>Distance:</span>{' '}
              <span style={{ color: '#64b5f6' }}>{object.distanceKm} km</span>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        pointerEvents: 'none',
        left: x,
        top: y,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '250px',
        transform: 'translate(10px, 10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {renderContent()}
      {layer && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          Layer: {layer.id}
        </div>
      )}
    </div>
  );
}
