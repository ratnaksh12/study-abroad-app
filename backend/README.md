# Study Abroad App - Backend Setup

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```

The server will run on `http://localhost:3001`

### 3. Open the Frontend
Open `index.html` in your browser or use a local server.

## API Endpoints

- `GET /api/universities?country=X&field=Y` - Search universities
- `GET /api/universities/:id` - Get university details
- `GET /api/countries` - List all supported countries
- `GET /api/programs` - List all programs
- `POST /api/universities/search` - Advanced search

## Database

The system uses a curated JSON database with 100 verified universities from 20 countries:
- United States, Canada, United Kingdom, Australia, Germany
- New Zealand, France, Ireland, Singapore, Netherlands
- United Arab Emirates, Italy, Spain, Russia, Georgia
- Austria, Malaysia, Japan, South Korea, Poland

Each university includes:
- Official name and location
- QS and THE rankings
- Programs offered
- Tuition costs
- Acceptance rates
- International student percentages

## Features

✅ **Real University Data** - No fake names, only verified institutions
✅ **Smart Filtering** - By country, field of study, ranking, budget
✅ **Accurate Stats** - Real acceptance rates, costs, and rankings
✅ **Program Matching** - Universities filtered by available programs
