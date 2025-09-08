# Travel Planning GraphQL API

GraphQL API that provides weather forecasts and weather-based activity recommendations powered by the Open-Meteo APIs.

Purpose
-------
This repository exposes a GraphQL schema for searching cities, fetching weather forecasts, and getting recommended activities (e.g. skiing, surfing, sightseeing) based on current weather conditions.

Architecture Overview
-------------------
- **Tech Stack**:
  - TypeScript for type safety and better developer experience
  - Express.js as the HTTP server framework
  - Apollo Server for GraphQL implementation
  - Jest for testing
  - Helmet for security headers
  - Axios for HTTP requests
  
- **Code Organization**:
  - GraphQL schema definitions (`src/graphql/`)
  - Thin resolvers for input validation (`src/resolvers/`)
  - Service layer for business logic (`src/services/`)
  - Clear interfaces for DTOs and service contracts
  
- **Key Design Patterns**:
  - Repository pattern for API integrations (OpenMeteoService)
  - Factory pattern for resolver creation

Omissions & Trade-offs
--------------------
1. **Data Caching**:
   - Currently no caching layer for weather/geocoding responses
   This simplified implementation although it could lead to potential API rate limits
   
2. **Error Handling**:
   - Basic error wrapping with GraphQLError
   - Missing detailed error codes/categories
   This was quick to implement than detailed error reporting

3. **Activity Scoring**:
   - Simple heuristic-based scoring
   - Hard-coded weather interpretation
   With a proper scoring standard/criteria this could be implemented for accuracy

4. **Testing**:
   - Unit tests and basic integration tests
   - Missing E2E tests and load tests
   Testing the core functionality coverage was faster and easier to begin with

Future Improvements
-----------------

1. **Developer Experience**:
   - Add OpenAPI/Swagger documentation
   - Implement GraphQL schema stitching for modular development
   - Add more comprehensive logging
   - Improve error handling with custom error types

2. **Quality & Testing**:
   - Add E2E tests with real API integration
   - Implement performance benchmarking
   - Add load testing scenarios
   - Improve test coverage

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
