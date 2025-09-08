import axios, { AxiosInstance } from 'axios';
import { ActivityRecommendationService, ActivityScore } from './activityRecommendationService';
import {
  WeatherDTO,
  OpenMeteoSearchResponse,
  OpenMeteoWeatherResponse,
} from './interfaces/OpenMeteo.interfaces';

export type WeatherData = WeatherDTO; // backward-compatible alias for existing imports

/**
 * Service responsible for talking to the Open-Meteo APIs and normalizing
 * responses into the project's DTOs. This class encapsulates HTTP requests,
 * default timeouts, and small transformation helpers.
 *
 * Environment variables:
 * - OPENMETEO_GEOCODING_URL: optional override for the geocoding API base URL
 * - OPENMETEO_WEATHER_URL: optional override for the weather API base URL
 */
class OpenMeteoService {
  private readonly geocodingURL: string;
  private readonly weatherURL: string;
  private readonly client: AxiosInstance;
  private readonly activityRecommendationService: ActivityRecommendationService;

  constructor() {
    this.geocodingURL =
      process.env.OPENMETEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1';
    this.weatherURL = process.env.OPENMETEO_WEATHER_URL || 'https://api.open-meteo.com/v1';
    this.client = axios.create({
      timeout: 10000,
    });
    this.activityRecommendationService = new ActivityRecommendationService();
  }

  async searchCities(query: string, limit: number = 10) {
    /**
     * Search cities by name using the Open-Meteo geocoding endpoint.
     * @param query - Partial or full city name to search for.
     * @param limit - Maximum number of results to return (default 10).
     * @returns Array of City objects with id, name, country, latitude and longitude.
     * @throws Error when the HTTP request fails.
     */
    try {
      const response = await this.client.get<OpenMeteoSearchResponse>(
        `${this.geocodingURL}/search`,
        {
          params: {
            name: query,
            count: limit,
            language: 'en',
            format: 'json',
          },
        }
      );

      return (
        response.data.results?.map(city => ({
          id: `${city.id}`,
          name: city.name,
          country: city.country,
          latitude: city.latitude,
          longitude: city.longitude,
        })) || []
      );
    } catch (error: any) {
      console.error('Error searching cities:', error.message);
      throw new Error(`Failed to search cities: ${error.message}`);
    }
  }

  async getWeatherForecast(latitude: number, longitude: number, days: number = 7) {
    /**
     * Fetch a forecast from the Open-Meteo API and normalize it to the
     * WeatherDTO-friendly shape used by the GraphQL schema.
     *
     * Notes:
     * - `days` is capped at 16 to match the remote API limits.
     * - Returned units are assumed to be: temperature (°C), windSpeed (m/s), precipitation (mm).
     *
     * @param latitude - Latitude in decimal degrees (-90..90).
     * @param longitude - Longitude in decimal degrees (-180..180).
     * @param days - Number of days to request (default 7).
     * @returns An object with `current`, `hourly` (next 24 items) and `daily` arrays.
     * @throws Error when the HTTP request fails or response shape is unexpected.
     */
    try {
      const response = await this.client.get<OpenMeteoWeatherResponse>(
        `${this.weatherURL}/forecast`,
        {
          params: {
            latitude,
            longitude,
            current: 'temperature_2m,weather_code,wind_speed_10m,precipitation',
            hourly: 'temperature_2m,weather_code,wind_speed_10m,precipitation',
            daily:
              'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum',
            timezone: 'auto',
            forecast_days: Math.min(days, 16), // Max 16 days forecast
          },
        }
      );

      const { current, hourly, daily } = response.data;

      // Process current weather
      const currentWeather: WeatherDTO = {
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        time: current.time,
      };

      // Process hourly forecast (next 24 hours)
      const hourlyForecast: WeatherDTO[] = hourly.time.slice(0, 24).map((time, index) => ({
        temperature: hourly.temperature_2m[index],
        weatherCode: hourly.weather_code[index],
        windSpeed: hourly.wind_speed_10m[index],
        precipitation: hourly.precipitation[index],
        time,
      }));

      // Process daily forecast
      const dailyForecast: WeatherDTO[] = daily.time.map((time, index) => ({
        temperature: (daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2,
        weatherCode: daily.weather_code[index],
        windSpeed: daily.wind_speed_10m_max[index],
        precipitation: daily.precipitation_sum[index],
        time,
      }));

      return {
        current: currentWeather,
        hourly: hourlyForecast,
        daily: dailyForecast,
      };
    } catch (error: any) {
      console.error('Error fetching weather forecast:', error.message);
      throw new Error(`Failed to fetch weather forecast: ${error.message}`);
    }
  }

  async getRecommendedActivities(latitude: number, longitude: number): Promise<ActivityScore[]> {
    /**
     * Obtain recommendations by fetching the current weather and running
     * a set of heuristic scoring functions.
     *
     * @param latitude - Latitude in decimal degrees.
     * @param longitude - Longitude in decimal degrees.
     * @returns Sorted list of ActivityScore objects (highest score first).
     * @throws Error when weather fetch or recommendation generation fails.
     */
    try {
      const { current } = await this.getWeatherForecast(latitude, longitude, 1);
      const activityScores = [
        this.activityRecommendationService.calculateSkiingScore(current),
        this.activityRecommendationService.calculateSurfingScore(current),
        this.activityRecommendationService.calculateIndoorSightseeingScore(current),
        this.activityRecommendationService.calculateOutdoorSightseeingScore(current),
      ];

      // Sort activities by score in descending order
      return activityScores.sort((a, b) => b.score - a.score);
    } catch (error: any) {
      console.error('Error generating activity recommendations:', error.message);
      throw new Error(`Failed to generate activity recommendations: ${error.message}`);
    }
  }
}

export default OpenMeteoService;
