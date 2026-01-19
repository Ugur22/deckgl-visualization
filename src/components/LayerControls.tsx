import { LayerType } from '../types';

interface LayerControlsProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

const buttonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: isActive ? '#2196f3' : 'rgba(255, 255, 255, 0.9)',
  color: isActive ? 'white' : '#333',
  boxShadow: isActive
    ? '0 4px 12px rgba(33, 150, 243, 0.4)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
});

export function LayerControls({ activeLayer, onLayerChange }: LayerControlsProps) {
  const layers: { id: LayerType; label: string }[] = [
    { id: 'columns', label: 'Population (3D)' },
    { id: 'scatter', label: 'Growth Index' },
    { id: 'arcs', label: 'Connections' },
    { id: 'trips', label: 'Trips' },
    { id: 'all', label: 'All Layers' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1,
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        maxWidth: '400px',
      }}
    >
      {layers.map(({ id, label }) => (
        <button
          key={id}
          style={buttonStyle(activeLayer === id)}
          onClick={() => onLayerChange(id)}
          onMouseEnter={(e) => {
            if (activeLayer !== id) {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
            }
          }}
          onMouseLeave={(e) => {
            if (activeLayer !== id) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
