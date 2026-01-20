import { useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChargingStation, chargingStations, stationColors } from '../../data/chargingStations';
import './StationDetailPanel.css';

interface StationDetailPanelProps {
  station: ChargingStation;
  onClose: () => void;
  onStationSelect: (station: ChargingStation) => void;
}

// Calculate distance between two coordinates in km
function getDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371;
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[1] * Math.PI / 180) *
    Math.cos(coord2[1] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const operatorColors: Record<string, string> = {
  'Tesla': '#cc0000',
  'Fastned': '#ffd800',
  'Shell Recharge': '#ff9900',
  'Allego': '#00aa55',
  'Ionity': '#0066cc',
  'BP Pulse': '#00aa00',
  'EVBox': '#00bbff',
};

const typeLabels: Record<string, string> = {
  superfast: 'Superfast (150+ kW)',
  fast: 'Fast (50-150 kW)',
  standard: 'Standard (< 50 kW)',
};

export function StationDetailPanel({ station, onClose, onStationSelect }: StationDetailPanelProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find nearby stations within 10km
  const nearbyStations = useMemo(() => {
    return chargingStations
      .filter((s) => s.id !== station.id)
      .map((s) => ({
        ...s,
        distance: getDistance(station.coordinates, s.coordinates),
      }))
      .filter((s) => s.distance <= 10)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [station]);

  // Current utilization (average of all hours for display)
  const currentUtil = Math.round(
    station.utilizationHistory.reduce((sum, h) => sum + h.utilization, 0) / 24
  );

  const stationTypeColor = `rgb(${stationColors[station.type].join(',')})`;
  const operatorColor = operatorColors[station.operator] || '#888';

  return (
    <div className="station-detail-panel" onClick={(e) => e.stopPropagation()}>
      <div className="station-detail-header">
        <div>
          <h2>{station.name}</h2>
          <div className="station-badges">
            <span
              className="operator-badge"
              style={{ backgroundColor: operatorColor }}
            >
              {station.operator}
            </span>
            <span
              className="type-badge"
              style={{ backgroundColor: stationTypeColor }}
            >
              {station.type.charAt(0).toUpperCase() + station.type.slice(1)}
            </span>
          </div>
        </div>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      <div className="station-detail-content">
        {/* Info Grid */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Type</span>
              <span className="info-value">{typeLabels[station.type]}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Chargers</span>
              <span className="info-value">{station.chargers}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Available</span>
              <span className={`info-value ${station.available > 0 ? 'available' : 'unavailable'}`}>
                {station.available} / {station.chargers}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Price</span>
              <span className="info-value price">€{station.pricePerKwh.toFixed(2)}/kWh</span>
            </div>
          </div>
        </section>

        {/* Utilization Chart */}
        <section className="chart-section">
          <h3>24-Hour Utilization Pattern</h3>
          <div className="current-util">
            <span>Avg. Utilization:</span>
            <span className={`util-value ${currentUtil > 70 ? 'high' : currentUtil > 40 ? 'medium' : 'low'}`}>
              {currentUtil}%
            </span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={station.utilizationHistory}>
                <defs>
                  <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stationTypeColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={stationTypeColor} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  tickFormatter={(h) => `${h}:00`}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Utilization']}
                  labelFormatter={(label) => `${label}:00`}
                  contentStyle={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke={stationTypeColor}
                  strokeWidth={2}
                  fill="url(#utilGradient)"
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Nearby Stations */}
        {nearbyStations.length > 0 && (
          <section className="nearby-section">
            <h3>Nearby Stations (within 10km)</h3>
            <div className="nearby-list">
              {nearbyStations.map((nearby) => (
                <button
                  key={nearby.id}
                  className="nearby-item"
                  onClick={() => onStationSelect(nearby)}
                >
                  <span
                    className="nearby-type-dot"
                    style={{ backgroundColor: `rgb(${stationColors[nearby.type].join(',')})` }}
                  />
                  <div className="nearby-info">
                    <span className="nearby-name">{nearby.name}</span>
                    <span className="nearby-meta">
                      {nearby.available}/{nearby.chargers} available • {nearby.operator}
                    </span>
                  </div>
                  <span className="nearby-distance">{nearby.distance.toFixed(1)} km</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
