import { ActivityRecommendationService } from '../../../src/services/activityRecommendationService';
import { WeatherData } from '../../../src/services/openmeteoService';

describe('ActivityRecommendationService', () => {
  let service: ActivityRecommendationService;

  beforeEach(() => {
    service = new ActivityRecommendationService();
  });

  describe('calculateSkiingScore', () => {
    it('should return high score for perfect skiing conditions', () => {
      const weather: WeatherData = {
        temperature: -5, // Ideal temperature
        weatherCode: 71, // Snow (weather code 71-77 indicates snow)
        windSpeed: 5, // Moderate wind
        precipitation: 2,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateSkiingScore(weather);

      expect(result.activity).toBe('Skiing');
      expect(result.score).toBeGreaterThanOrEqual(90); // Should be near perfect
      expect(result.description).toContain('Perfect conditions');
    });

    it('should return low score for warm temperatures without snow', () => {
      const weather: WeatherData = {
        temperature: 20,
        weatherCode: 1, // Clear sky
        windSpeed: 5,
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateSkiingScore(weather);

      expect(result.score).toBeLessThan(50);
      expect(result.description).toContain('not ideal');
    });

    it('should penalize high winds', () => {
      const weather: WeatherData = {
        temperature: -5,
        weatherCode: 71,
        windSpeed: 25, // Very high winds
        precipitation: 2,
        time: '2025-09-08T12:00:00Z',
      };

      const highWindScore = service.calculateSkiingScore(weather).score;

      const lowWindWeather = { ...weather, windSpeed: 5 };
      const lowWindScore = service.calculateSkiingScore(lowWindWeather).score;

      expect(highWindScore).toBeLessThan(lowWindScore);
    });
  });

  describe('calculateSurfingScore', () => {
    it('should return high score for ideal surfing conditions', () => {
      const weather: WeatherData = {
        temperature: 25,
        weatherCode: 1,
        windSpeed: 15, // Optimal wind speed
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateSurfingScore(weather);

      expect(result.activity).toBe('Surfing');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.description).toContain('Good waves');
    });

    it('should penalize heavy rain', () => {
      const weather: WeatherData = {
        temperature: 25,
        weatherCode: 1,
        windSpeed: 15,
        precipitation: 6, // Heavy rain
        time: '2025-09-08T12:00:00Z',
      };

      const rainScore = service.calculateSurfingScore(weather).score;

      const noRainWeather = { ...weather, precipitation: 0 };
      const noRainScore = service.calculateSurfingScore(noRainWeather).score;

      expect(rainScore).toBeLessThan(noRainScore);
    });

    it('should return low score for insufficient wind', () => {
      const weather: WeatherData = {
        temperature: 15, // Cooler temperature
        weatherCode: 1,
        windSpeed: 2, // Very calm
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateSurfingScore(weather);

      expect(result.score).toBeLessThan(50);
      expect(result.description).toContain('too calm');
    });
  });

  describe('calculateIndoorSightseeingScore', () => {
    it('should return high score during bad weather', () => {
      const weather: WeatherData = {
        temperature: 35, // Very hot
        weatherCode: 51, // Light rain
        windSpeed: 10,
        precipitation: 3,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateIndoorSightseeingScore(weather);

      expect(result.activity).toBe('Indoor Sightseeing');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.description).toContain('Great day to explore indoor');
    });

    it('should return lower score during nice weather', () => {
      const weather: WeatherData = {
        temperature: 22,
        weatherCode: 1,
        windSpeed: 5,
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateIndoorSightseeingScore(weather);

      expect(result.score).toBeLessThan(50);
      expect(result.description).toContain('Consider outdoor activities');
    });
  });

  describe('calculateOutdoorSightseeingScore', () => {
    it('should return high score for perfect outdoor conditions', () => {
      const weather: WeatherData = {
        temperature: 21.5, // Perfect temperature
        weatherCode: 0, // Clear sky
        windSpeed: 2, // Light breeze
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateOutdoorSightseeingScore(weather);

      expect(result.activity).toBe('Outdoor Sightseeing');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.description).toContain('Perfect weather');
    });

    it('should apply wind penalty', () => {
      const weather: WeatherData = {
        temperature: 21.5,
        weatherCode: 1,
        windSpeed: 15, // Strong wind
        precipitation: 0,
        time: '2025-09-08T12:00:00Z',
      };

      const windyScore = service.calculateOutdoorSightseeingScore(weather).score;

      const calmWeather = { ...weather, windSpeed: 2 };
      const calmScore = service.calculateOutdoorSightseeingScore(calmWeather).score;

      expect(windyScore).toBeLessThan(calmScore);
    });

    it('should return low score for poor conditions', () => {
      const weather: WeatherData = {
        temperature: 5, // Too cold
        weatherCode: 51, // Light rain
        windSpeed: 10,
        precipitation: 3,
        time: '2025-09-08T12:00:00Z',
      };

      const result = service.calculateOutdoorSightseeingScore(weather);

      expect(result.score).toBeLessThan(50);
      expect(result.description).toContain('might not be ideal');
    });
  });
});
