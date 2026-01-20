import { useState, useCallback } from 'react';
import './Legend.css';

export type StationType = 'superfast' | 'fast' | 'standard';
export type TripType = 'high_battery' | 'medium_battery' | 'low_battery' | 'delivery';

interface LegendProps {
  stationFilters: Set<StationType>;
  tripFilters: Set<TripType>;
  onStationFilterChange: (filters: Set<StationType>) => void;
  onTripFilterChange: (filters: Set<TripType>) => void;
  showTrips: boolean;
}

const stationItems: { type: StationType; label: string; color: string }[] = [
  { type: 'superfast', label: 'Superfast', color: 'rgb(60, 180, 130)' },
  { type: 'fast', label: 'Fast', color: 'rgb(70, 145, 190)' },
  { type: 'standard', label: 'Standard', color: 'rgb(200, 165, 70)' },
];

const tripItems: { type: TripType; label: string; color: string }[] = [
  { type: 'high_battery', label: 'High Battery', color: 'rgb(70, 185, 125)' },
  { type: 'medium_battery', label: 'Medium Battery', color: 'rgb(205, 175, 65)' },
  { type: 'low_battery', label: 'Low Battery', color: 'rgb(195, 95, 95)' },
  { type: 'delivery', label: 'Delivery', color: 'rgb(185, 110, 90)' },
];

export function Legend({
  stationFilters,
  tripFilters,
  onStationFilterChange,
  onTripFilterChange,
  showTrips,
}: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleStation = useCallback(
    (type: StationType) => {
      const newFilters = new Set(stationFilters);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      onStationFilterChange(newFilters);
    },
    [stationFilters, onStationFilterChange]
  );

  const toggleTrip = useCallback(
    (type: TripType) => {
      const newFilters = new Set(tripFilters);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      onTripFilterChange(newFilters);
    },
    [tripFilters, onTripFilterChange]
  );

  return (
    <div className={`legend ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="legend-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="legend-title">Legend</span>
        <span className="legend-toggle">{isCollapsed ? '▶' : '▼'}</span>
      </div>

      {!isCollapsed && (
        <div className="legend-content">
          <div className="legend-section">
            <div className="legend-section-title">Charging Stations</div>
            {stationItems.map((item) => (
              <label key={item.type} className="legend-item">
                <input
                  type="checkbox"
                  checked={stationFilters.has(item.type)}
                  onChange={() => toggleStation(item.type)}
                />
                <span
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-label">{item.label}</span>
              </label>
            ))}
          </div>

          {showTrips && (
            <div className="legend-section">
              <div className="legend-section-title">EV Trips</div>
              {tripItems.map((item) => (
                <label key={item.type} className="legend-item">
                  <input
                    type="checkbox"
                    checked={tripFilters.has(item.type)}
                    onChange={() => toggleTrip(item.type)}
                  />
                  <span
                    className="legend-color trip"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="legend-label">{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
