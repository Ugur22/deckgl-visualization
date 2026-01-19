import { useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { City } from '../../types';
import { cities } from '../../data/netherlands';
import './DetailPanel.css';

interface DetailPanelProps {
  city: City;
  onClose: () => void;
}

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0'];

const growthColors = (growth: number) => {
  if (growth > 2.0) return '#4caf50';
  if (growth > 1.5) return '#ffc107';
  return '#f44336';
};

export function DetailPanel({ city, onClose }: DetailPanelProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prepare growth comparison data
  const growthData = cities
    .map((c) => ({
      name: c.name,
      growth: c.growthIndex,
      isSelected: c.name === city.name,
    }))
    .sort((a, b) => b.growth - a.growth);

  // Prepare pie chart data with index signature
  const pieData = city.economicBreakdown.map((item) => ({
    ...item,
    name: item.sector,
    value: item.percentage,
  }));

  return (
    <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
      <div className="detail-panel-header">
        <div>
          <h2>{city.name}</h2>
          <p className="population">
            Population: {city.population.toLocaleString()}
          </p>
        </div>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      <div className="detail-panel-content">
        {/* Population Trend Chart */}
        <section className="chart-section">
          <h3>Population Trend (2016-2025)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={city.populationHistory}>
                <defs>
                  <linearGradient id="populationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : `${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    'Population',
                  ]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="population"
                  stroke="#2196f3"
                  strokeWidth={2}
                  fill="url(#populationGradient)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Growth Comparison Chart */}
        <section className="chart-section">
          <h3>Growth Index Comparison</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={growthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" domain={[0, 3]} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    'Growth Index',
                  ]}
                />
                <Bar dataKey="growth" animationDuration={600}>
                  {growthData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={growthColors(entry.growth)}
                      stroke={entry.isSelected ? '#000' : 'none'}
                      strokeWidth={entry.isSelected ? 2 : 0}
                      opacity={entry.isSelected ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Economic Breakdown Chart */}
        <section className="chart-section">
          <h3>Economic Sectors</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  animationDuration={800}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    typeof value === 'number' ? `${value}%` : value,
                    'Share',
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
