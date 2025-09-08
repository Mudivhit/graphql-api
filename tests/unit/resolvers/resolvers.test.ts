import Resolvers from '../../../src/resolvers';
import OpenMeteoService from '../../../src/services/openmeteoService';

// Mock OpenMeteoService
jest.mock('../../../src/services/openmeteoService');

describe('Resolvers', () => {
  let resolvers: any;
  const MockedOpenMeteoService = OpenMeteoService as jest.MockedClass<typeof OpenMeteoService>;

  beforeEach(() => {
    MockedOpenMeteoService.mockClear();
    resolvers = new Resolvers().getResolvers().Query;
  });

  describe('searchCities', () => {
    it('should validate search query length', async () => {
      await expect(
        resolvers.searchCities(null, { query: 'a', limit: 10 })
      ).rejects.toThrow('Search query must be at least 2 characters long');
    });

    it('should return cities for valid query', async () => {
      const mockCities = [
        { id: '1', name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 }
      ];

      MockedOpenMeteoService.prototype.searchCities.mockResolvedValue(mockCities);

      const result = await resolvers.searchCities(null, { query: 'London', limit: 10 });

      expect(result).toEqual(mockCities);
      expect(MockedOpenMeteoService.prototype.searchCities).toHaveBeenCalledWith('London', 10);
    });

    it('should handle service errors', async () => {
      MockedOpenMeteoService.prototype.searchCities.mockRejectedValue(new Error('Service error'));

      await expect(
        resolvers.searchCities(null, { query: 'London', limit: 10 })
      ).rejects.toThrow('Service error');
    });
  });

  describe('getWeatherForecast', () => {
    const validCoords = { latitude: 51.5074, longitude: -0.1278 };

    it('should validate latitude range', async () => {
      await expect(
        resolvers.getWeatherForecast(null, { ...validCoords, latitude: 91 })
      ).rejects.toThrow('Latitude must be a number between -90 and 90');
    });

    it('should validate longitude range', async () => {
      await expect(
        resolvers.getWeatherForecast(null, { ...validCoords, longitude: 181 })
      ).rejects.toThrow('Longitude must be a number between -180 and 180');
    });

    it('should validate days parameter', async () => {
      await expect(
        resolvers.getWeatherForecast(null, { ...validCoords, days: 17 })
      ).rejects.toThrow('Days parameter must be between 1 and 16');
    });

    it('should return weather forecast for valid coordinates', async () => {
      const mockForecast = {
        current: { temperature: 20, weatherCode: 1, windSpeed: 5, precipitation: 0, time: '2025-09-08T12:00:00Z' },
        hourly: [],
        daily: []
      };

      MockedOpenMeteoService.prototype.getWeatherForecast.mockResolvedValue(mockForecast);

      const result = await resolvers.getWeatherForecast(null, validCoords);

      expect(result).toEqual(mockForecast);
      expect(MockedOpenMeteoService.prototype.getWeatherForecast).toHaveBeenCalledWith(
        validCoords.latitude,
        validCoords.longitude,
        7 // default value
      );
    });
  });

  describe('getRecommendedActivities', () => {
    const validCoords = { latitude: 51.5074, longitude: -0.1278 };

    it('should validate latitude range', async () => {
      await expect(
        resolvers.getRecommendedActivities(null, { ...validCoords, latitude: -91 })
      ).rejects.toThrow('Latitude must be a number between -90 and 90');
    });

    it('should validate longitude range', async () => {
      await expect(
        resolvers.getRecommendedActivities(null, { ...validCoords, longitude: -181 })
      ).rejects.toThrow('Longitude must be a number between -180 and 180');
    });

    it('should return recommended activities for valid coordinates', async () => {
      const mockActivities = [
        { activity: 'Skiing', score: 90, description: 'Perfect conditions!' },
        { activity: 'Indoor Sightseeing', score: 70, description: 'Good option.' }
      ];

      MockedOpenMeteoService.prototype.getRecommendedActivities.mockResolvedValue(mockActivities);

      const result = await resolvers.getRecommendedActivities(null, validCoords);

      expect(result).toEqual(mockActivities);
      expect(MockedOpenMeteoService.prototype.getRecommendedActivities).toHaveBeenCalledWith(
        validCoords.latitude,
        validCoords.longitude
      );
    });

    it('should handle service errors', async () => {
      MockedOpenMeteoService.prototype.getRecommendedActivities.mockRejectedValue(new Error('Service error'));

      await expect(
        resolvers.getRecommendedActivities(null, validCoords)
      ).rejects.toThrow('Service error');
    });
  });
});
