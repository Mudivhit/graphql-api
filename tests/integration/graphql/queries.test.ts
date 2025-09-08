import { ApolloServer } from '@apollo/server';
import typeDefs from '../../../src/graphql/schema';
import Resolvers from '../../../src/resolvers';
import OpenMeteoService from '../../../src/services/openmeteoService';

jest.mock('../../../src/services/openmeteoService');

describe('GraphQL API Integration Tests', () => {
  let server: ApolloServer;

  beforeAll(async () => {
    const MockedOpenMeteoService = OpenMeteoService as jest.MockedClass<typeof OpenMeteoService>;
    
    // Mock OpenMeteoService methods
    MockedOpenMeteoService.prototype.searchCities.mockResolvedValue([
      { id: '1', name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 }
    ]);

    MockedOpenMeteoService.prototype.getWeatherForecast.mockResolvedValue({
      current: {
        temperature: 20,
        weatherCode: 1,
        windSpeed: 5,
        precipitation: 0,
        time: '2025-09-08T12:00:00Z'
      },
      hourly: [],
      daily: []
    });

    MockedOpenMeteoService.prototype.getRecommendedActivities.mockResolvedValue([
      { activity: 'Skiing', score: 90, description: 'Perfect conditions!' }
    ]);

    server = new ApolloServer({
      typeDefs,
      resolvers: new Resolvers().getResolvers() as any
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Query.searchCities', () => {
    it('should execute searchCities query', async () => {
      const query = `
        query SearchCities($query: String!, $limit: Int) {
          searchCities(query: $query, limit: $limit) {
            id
            name
            country
            latitude
            longitude
          }
        }
      `;

      const response = await server.executeOperation({
        query,
        variables: { query: 'London', limit: 5 }
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(Array.isArray(response.body.singleResult.data?.searchCities)).toBe(true);
      }
    });

    it('should handle invalid query parameter', async () => {
      const query = `
        query SearchCities($query: String!, $limit: Int) {
          searchCities(query: $query, limit: $limit) {
            id
            name
          }
        }
      `;

      const response = await server.executeOperation({
        query,
        variables: { query: 'a', limit: 5 }
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('least 2 characters');
      }
    });
  });

  describe('Query.getWeatherForecast', () => {
    it('should execute getWeatherForecast query', async () => {
      const query = `
        query GetWeatherForecast($latitude: Float!, $longitude: Float!, $days: Int) {
          getWeatherForecast(latitude: $latitude, longitude: $longitude, days: $days) {
            current {
              temperature
              weatherCode
              windSpeed
              precipitation
              time
            }
            hourly {
              temperature
              weatherCode
              windSpeed
              precipitation
              time
            }
            daily {
              temperature
              weatherCode
              windSpeed
              precipitation
              time
            }
          }
        }
      `;

      const response = await server.executeOperation({
        query,
        variables: { latitude: 51.5074, longitude: -0.1278, days: 3 }
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        const data = response.body.singleResult.data as { getWeatherForecast: { current: unknown } };
        expect(data?.getWeatherForecast?.current).toBeDefined();
      }
    });
  });

  describe('Query.getRecommendedActivities', () => {
    it('should execute getRecommendedActivities query', async () => {
      const query = `
        query GetRecommendedActivities($latitude: Float!, $longitude: Float!) {
          getRecommendedActivities(latitude: $latitude, longitude: $longitude) {
            activity
            score
            description
          }
        }
      `;

      const response = await server.executeOperation({
        query,
        variables: { latitude: 51.5074, longitude: -0.1278 }
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(Array.isArray(response.body.singleResult.data?.getRecommendedActivities)).toBe(true);
      }
    });
  });
});
