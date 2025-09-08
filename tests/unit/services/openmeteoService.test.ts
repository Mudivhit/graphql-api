import OpenMeteoService from '../../../src/services/openmeteoService';
import mockAxios from './__mocks__/axios';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

describe('OpenMeteoService', () => {
  let service: OpenMeteoService;
  const mockAxiosGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const mockedAxios = require('axios');
    mockedAxios.create.mockReturnValue({
      get: mockAxiosGet,
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    });
    service = new OpenMeteoService();
  });

  describe('searchCities', () => {
    it('should transform search results correctly', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 123,
              name: 'London',
              country: 'United Kingdom',
              latitude: 51.5074,
              longitude: -0.1278,
            },
          ],
        },
      });

      const result = await service.searchCities('London');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '123',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
      });
    });

    it('should return empty array when no results found', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          results: [],
        },
      });

      const result = await service.searchCities('NonexistentCity');

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.searchCities('London')).rejects.toThrow('Failed to search cities');
    });
  });

  describe('getWeatherForecast', () => {
    const mockWeatherResponse = {
      data: {
        current: {
          time: '2025-09-08T12:00:00Z',
          temperature_2m: 20,
          weather_code: 1,
          wind_speed_10m: 5,
          precipitation: 0,
        },
        hourly: {
          time: Array(24).fill('2025-09-08T12:00:00Z'),
          temperature_2m: Array(24).fill(20),
          weather_code: Array(24).fill(1),
          wind_speed_10m: Array(24).fill(5),
          precipitation: Array(24).fill(0),
        },
        daily: {
          time: Array(7).fill('2025-09-08'),
          temperature_2m_max: Array(7).fill(25),
          temperature_2m_min: Array(7).fill(15),
          weather_code: Array(7).fill(1),
          wind_speed_10m_max: Array(7).fill(8),
          precipitation_sum: Array(7).fill(0),
        },
      },
    };

    it('should transform weather forecast correctly', async () => {
      mockAxiosGet.mockResolvedValueOnce(mockWeatherResponse);

      const result = await service.getWeatherForecast(51.5074, -0.1278);

      expect(result.current).toBeDefined();
      expect(result.hourly).toHaveLength(24);
      expect(result.daily).toHaveLength(7);

      // Check current weather structure
      expect(result.current).toEqual({
        temperature: 20,
        weatherCode: 1,
        windSpeed: 5,
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.getWeatherForecast(51.5074, -0.1278)).rejects.toThrow(
        'Failed to fetch weather forecast'
      );
    });

    it('should respect the days parameter', async () => {
      mockAxiosGet.mockResolvedValueOnce(mockWeatherResponse);

      await service.getWeatherForecast(51.5074, -0.1278, 5);

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            forecast_days: 5,
          }),
        })
      );
    });
  });

  describe('getRecommendedActivities', () => {
    it('should return sorted activities by score', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          current: {
            time: '2025-09-08T12:00:00Z',
            temperature_2m: -5,
            weather_code: 71,
            wind_speed_10m: 5,
            precipitation: 2,
          },
          hourly: {
            time: ['2025-09-08T12:00:00Z'],
            temperature_2m: [-5],
            weather_code: [71],
            wind_speed_10m: [5],
            precipitation: [2],
          },
          daily: {
            time: ['2025-09-08'],
            temperature_2m_max: [-3],
            temperature_2m_min: [-7],
            weather_code: [71],
            wind_speed_10m_max: [5],
            precipitation_sum: [2],
          },
        },
      });

      const result = await service.getRecommendedActivities(51.5074, -0.1278);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('activity');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('description');

      // Verify scores are sorted in descending order
      const scores = result.map(activity => activity.score);
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });

    it('should handle API errors gracefully', async () => {
      (mockAxios.create().get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(service.getRecommendedActivities(51.5074, -0.1278)).rejects.toThrow(
        'Failed to generate activity recommendations'
      );
    });
  });
});
