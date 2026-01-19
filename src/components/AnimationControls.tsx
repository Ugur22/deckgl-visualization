interface AnimationControlsProps {
  isPlaying: boolean;
  currentTime: number;
  maxTime: number;
  animationSpeed: number;
  onPlayPause: () => void;
  onTimeChange: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
  padding: '16px 24px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  minWidth: '400px',
};

const buttonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: '#2196f3',
  color: 'white',
  fontSize: '18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease',
};

const sliderContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  cursor: 'pointer',
  accentColor: '#2196f3',
};

const timeDisplayStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textAlign: 'center',
};

const speedButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  fontSize: '12px',
  fontWeight: 500,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: isActive ? '#2196f3' : '#e0e0e0',
  color: isActive ? 'white' : '#333',
  transition: 'all 0.2s ease',
});

const speedContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
};

function formatTime(time: number, maxTime: number): string {
  const percentage = (time / maxTime) * 100;
  const minutes = Math.floor((time / maxTime) * 30);
  const seconds = Math.floor(((time / maxTime) * 30 * 60) % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} (${percentage.toFixed(0)}%)`;
}

export function AnimationControls({
  isPlaying,
  currentTime,
  maxTime,
  animationSpeed,
  onPlayPause,
  onTimeChange,
  onSpeedChange,
}: AnimationControlsProps) {
  const speeds = [0.1, 0.25, 0.5, 1, 2];

  return (
    <div style={containerStyle}>
      <button
        style={buttonStyle}
        onClick={onPlayPause}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1976d2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2196f3';
        }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={sliderContainerStyle}>
        <input
          type="range"
          min={0}
          max={maxTime}
          value={currentTime}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          style={sliderStyle}
        />
        <div style={timeDisplayStyle}>
          {formatTime(currentTime, maxTime)}
        </div>
      </div>

      <div style={speedContainerStyle}>
        {speeds.map((speed) => (
          <button
            key={speed}
            style={speedButtonStyle(animationSpeed === speed)}
            onClick={() => onSpeedChange(speed)}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
