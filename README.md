# Deck.GL Netherlands Visualization

An interactive 3D geospatial visualization of major cities in the Netherlands, built with Deck.GL and React.

## Features

### Visualization Layers
- **Column Layer** - 3D columns representing city populations, with height proportional to population size
- **Scatterplot Layer** - Population density visualization using colored circles
- **Arc Layer** - Animated connections showing transportation/communication links between cities
- **Trips Layer** - Animated vehicle trips along real road routes (fetched from Mapbox Directions API)
- **Charging Stations** - EV charging station locations displayed in trips view

### Interactive Elements
- **Hover tooltips** - View city information on hover
- **Click to select** - Click on cities to open a detailed panel with:
  - Population statistics
  - Historical population growth chart (2016-2025)
  - Economic sector breakdown (pie chart)
- **Layer controls** - Toggle between different visualization modes
- **Animation controls** - Play/pause, scrub timeline, and adjust speed for trip animations

### Cities Included
Amsterdam, Rotterdam, The Hague, Utrecht, Eindhoven, Groningen, Tilburg, Almere, Breda, and Nijmegen

## Tech Stack

- **React 18** - UI framework
- **Deck.GL 9** - WebGL-powered geospatial visualization
- **Mapbox GL** - Base map tiles and routing API
- **Recharts** - Charts for the detail panel
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites
- Node.js 18+
- A Mapbox access token ([get one free](https://www.mapbox.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ugur22/deckgl-visualization.git
   cd deckgl-visualization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Mapbox token:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your token:
   ```
   VITE_MAPBOX_TOKEN=your_actual_mapbox_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── DeckGLMap.tsx      # Main map component
│   ├── LayerControls.tsx  # Layer toggle buttons
│   ├── HoverInfoPanel.tsx # Tooltip on hover
│   ├── AnimationControls.tsx # Trip animation controls
│   └── DetailPanel/       # City detail sidebar
├── layers/
│   ├── columnLayer.ts     # 3D population columns
│   ├── scatterplotLayer.ts # Population density circles
│   ├── arcLayer.ts        # City connection arcs
│   ├── tripsLayer.ts      # Animated vehicle trips
│   └── chargingStationLayer.ts
├── data/
│   ├── netherlands.ts     # City data and coordinates
│   ├── chargingStations.ts # EV station locations
│   └── tripData.ts        # Trip route generation
├── services/
│   └── routeService.ts    # Mapbox Directions API client
└── types/
    └── index.ts           # TypeScript interfaces
```

## License

MIT
