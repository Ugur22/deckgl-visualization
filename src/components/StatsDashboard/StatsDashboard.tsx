import { useMemo } from 'react';
import { ChargingStation } from '../../data/chargingStations';
import { TripData } from '../../types';
import { StationType, TripType } from '../Legend';
import './StatsDashboard.css';

interface StatsDashboardProps {
  stations: ChargingStation[];
  trips: TripData[];
  stationFilters: Set<StationType>;
  tripFilters: Set<TripType>;
}

// Helper to get trip type from color (same logic as tripsLayer)
function getTripTypeFromColor(color: [number, number, number]): 'delivery' | 'roadtrip' | 'commuter' {
  // Delivery: terracotta [185, 110, 90]
  if (color[0] > 180 && color[1] > 100 && color[1] < 120) return 'delivery';
  // Lighter colors are commuters
  if (color[0] > 100 && color[1] > 100 && color[2] > 100) return 'commuter';
  // Rest are roadtrips
  return 'roadtrip';
}

export function StatsDashboard({
  stations,
  trips,
  stationFilters,
  tripFilters,
}: StatsDashboardProps) {
  const stats = useMemo(() => {
    // Station stats
    const totalStations = stations.length;
    const superfast = stations.filter((s) => s.type === 'superfast').length;
    const fast = stations.filter((s) => s.type === 'fast').length;
    const standard = stations.filter((s) => s.type === 'standard').length;

    // Filtered stations count
    const visibleStations = stations.filter((s) => stationFilters.has(s.type)).length;

    // Charger availability
    const totalChargers = stations.reduce((sum, s) => sum + s.chargers, 0);
    const availableChargers = stations.reduce((sum, s) => sum + s.available, 0);
    const utilization = totalChargers > 0
      ? Math.round(((totalChargers - availableChargers) / totalChargers) * 100)
      : 0;

    // Trip stats
    const totalTrips = trips.length;
    const commuterTrips = trips.filter((t) => getTripTypeFromColor(t.color) === 'commuter').length;
    const deliveryTrips = trips.filter((t) => getTripTypeFromColor(t.color) === 'delivery').length;
    const roadtrips = trips.filter((t) => getTripTypeFromColor(t.color) === 'roadtrip').length;

    // Visible trips count (based on filters)
    const visibleTrips = tripFilters.size > 0 ? trips.filter((t) => {
      const color = t.color;
      // Map trip color to TripType for filtering
      if (color[0] > 180 && color[1] > 100 && color[1] < 120) {
        return tripFilters.has('delivery');
      }
      if (color[1] > 150 && color[0] < 150) {
        return tripFilters.has('high_battery');
      }
      if (color[0] > 180 && color[1] < 140 && color[2] < 140) {
        return tripFilters.has('low_battery');
      }
      return tripFilters.has('medium_battery');
    }).length : 0;

    return {
      totalStations,
      superfast,
      fast,
      standard,
      visibleStations,
      totalChargers,
      availableChargers,
      utilization,
      totalTrips,
      commuterTrips,
      deliveryTrips,
      roadtrips,
      visibleTrips,
    };
  }, [stations, trips, stationFilters, tripFilters]);

  return (
    <div className="stats-dashboard">
      <div className="stats-group">
        <div className="stat-item">
          <span className="stat-label">Stations</span>
          <span className="stat-value">{stats.visibleStations}</span>
          <span className="stat-detail">of {stats.totalStations}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item compact">
          <span className="stat-badge superfast">{stats.superfast}</span>
          <span className="stat-badge fast">{stats.fast}</span>
          <span className="stat-badge standard">{stats.standard}</span>
        </div>
      </div>

      <div className="stats-group">
        <div className="stat-item">
          <span className="stat-label">Active Trips</span>
          <span className="stat-value">{stats.visibleTrips}</span>
          <span className="stat-detail">of {stats.totalTrips}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item compact">
          <span className="stat-mini">
            <span className="dot commuter" /> {stats.commuterTrips}
          </span>
          <span className="stat-mini">
            <span className="dot delivery" /> {stats.deliveryTrips}
          </span>
          <span className="stat-mini">
            <span className="dot roadtrip" /> {stats.roadtrips}
          </span>
        </div>
      </div>

      <div className="stats-group">
        <div className="stat-item">
          <span className="stat-label">Chargers</span>
          <span className="stat-value">{stats.totalChargers}</span>
          <span className="stat-detail">/ {stats.availableChargers} avail</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Usage</span>
          <span className={`stat-value ${stats.utilization > 70 ? 'high' : stats.utilization > 40 ? 'medium' : 'low'}`}>
            {stats.utilization}%
          </span>
          <span className="stat-detail">&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
