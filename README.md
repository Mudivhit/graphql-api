# Travel Planning GraphQL API

GraphQL API that provides weather forecasts and weather-based activity recommendations powered by the Open-Meteo APIs.

Purpose
-------
This repository exposes a GraphQL schema for searching cities, fetching weather forecasts, and getting recommended activities (e.g. skiing, surfing, sightseeing) based on current weather conditions.

Quick start
-----------
1. Copy environment variables:

```bash
cp env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run in development (live reload):

```bash
npm run dev
```

4. Build and run production bundle:

```bash
npm run build
npm start
```

Scripts
-------
- `npm run dev` — starts the server using `ts-node` and `nodemon` (development).
- `npm run build` — runs `tsc` to compile to `dist`.
- `npm start` — runs the compiled `dist/index.js`.
- `npm test` — runs tests via Jest (if present).

Environment
-----------
See `env.example` for variables used by the project. Notable vars:
- `PORT` — server port (default 4000)
- `OPENMETEO_GEOCODING_URL` — optional override for the geocoding API base URL
- `OPENMETEO_WEATHER_URL` — optional override for the weather API base URL

Overview of important files
---------------------------
- `src/index.ts` — Express + Apollo Server bootstrap and middleware wiring.
- `src/graphql/schema.ts` — GraphQL type definitions and Query signatures.
- `src/resolvers/` — Resolver implementations that validate input and delegate to services.
- `src/services/` — Business logic and external API integration (OpenMeteoService, ActivityRecommendationService).

Onboarding notes for contributors
-------------------------------
- To add a new query: add the field to `src/graphql/schema.ts`, then implement the resolver in `src/resolvers` and delegate heavy logic to a new or existing service under `src/services`.
- Keep resolvers thin: validation + mapping to service methods.
- Document any heuristic or magic numbers used in scoring functions (see `ActivityRecommendationService`).

Testing
-------
- Run `npm test` to execute the test suite. Add unit tests for service logic (especially scoring functions) and integration tests for the resolver layer.

Notes
-----------------
- Scoring functions in `ActivityRecommendationService` are heuristic. They are intended as a starting point and should be tuned or replaced with domain-specific logic if needed.
- The code assumes Open-Meteo units (temperatures in °C, wind speed in m/s, precipitation in mm). Confirm if those units need normalization for your use case.
