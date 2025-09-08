import { GraphQLError } from 'graphql';
import OpenMeteoService from '../services/openmeteoService';
import { ActivityScore } from '../services/activityRecommendationService';

/**
 * Resolver container class.
 *
 * Responsibility: provide functions mapped to the GraphQL `Query` fields.
 * Resolvers should remain thin: perform input validation and delegate business
 * logic to services (see `OpenMeteoService`).
 */
export default class Resolvers {
  private readonly openMeteoService: OpenMeteoService;

  constructor() {
    this.openMeteoService = new OpenMeteoService();
  }

  /**
   * Return resolver map expected by ApolloServer.
   * The map contains Query resolvers which validate inputs and call services.
   */
  getResolvers() {
    return {
      Query: {
        searchCities: async (_: unknown, { query, limit }: { query: string; limit: number }) => {
          try {
            if (!query || query.trim().length < 2) {
              throw new Error('Search query must be at least 2 characters long');
            }
            const cities = await this.openMeteoService.searchCities(query.trim(), limit);
            return cities;
          } catch (error: any) {
            throw new GraphQLError(error.message, {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
        },

        getWeatherForecast: async (
          _: unknown,
          { latitude, longitude, days = 7 }: { latitude: number; longitude: number; days?: number }
        ) => {
          try {
            this.validateCoordinates(latitude, longitude);
            if (days < 1 || days > 16) {
              throw new Error('Days parameter must be between 1 and 16');
            }
            return await this.openMeteoService.getWeatherForecast(latitude, longitude, days);
          } catch (error: any) {
            throw new GraphQLError(error.message, {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
          }
        },

        getRecommendedActivities: async (
          _: unknown,
          { latitude, longitude }: { latitude: number; longitude: number }
        ): Promise<ActivityScore[]> => {
          try {
            this.validateCoordinates(latitude, longitude);
            return await this.openMeteoService.getRecommendedActivities(latitude, longitude);
          } catch (error: any) {
            throw new GraphQLError(error.message, {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
          }
        },
      },
    };
  }

  /**
   * Validate latitude and longitude ranges used by Open-Meteo.
   * @throws Error when values are out of bounds or not numbers.
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be a number between -90 and 90');
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be a number between -180 and 180');
    }
  }
}
