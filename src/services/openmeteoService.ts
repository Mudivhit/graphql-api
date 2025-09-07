import axios, { AxiosInstance } from 'axios';
import { ActivityRecommendationService, ActivityScore } from './activityRecommendationService';

interface SearchCityResponse {
  results?: Array<{
    id: number | string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    wind_speed_10m_max: number[];
    precipitation_sum: number[];
  };
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  generationtime_ms: number;
  utc_offset_seconds: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  time: string;
}


class OpenMeteoService {
  private readonly geocodingURL: string;
  private readonly weatherURL: string;
  private readonly client: AxiosInstance;
  private readonly activityRecommendationService: ActivityRecommendationService;

  constructor() {
    this.geocodingURL = process.env.OPENMETEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1';
    this.weatherURL = process.env.OPENMETEO_WEATHER_URL || 'https://api.open-meteo.com/v1';
    this.client = axios.create({
      timeout: 10000,
    });
    this.activityRecommendationService = new ActivityRecommendationService();
  }

  async searchCities(query: string, limit: number = 10) {
    try {
      const response = await this.client.get<SearchCityResponse>(
        `${this.geocodingURL}/search`,
        {
          params: {
            name: query,
            count: limit,
            language: 'en',
            format: 'json'
          },
        }
      );

      return (
        response.data.results?.map((city) => ({
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
    try {
      const response = await this.client.get<WeatherResponse>(
        `${this.weatherURL}/forecast`,
        {
          params: {
            latitude,
            longitude,
            current: 'temperature_2m,weather_code,wind_speed_10m,precipitation',
            hourly: 'temperature_2m,weather_code,wind_speed_10m,precipitation',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum',
            timezone: 'auto',
            forecast_days: Math.min(days, 16), // Max 16 days forecast
          },
        }
      );

      const { current, hourly, daily } = response.data;

      // Process current weather
      const currentWeather: WeatherData = {
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        time: current.time,
      };

      // Process hourly forecast (next 24 hours)
      const hourlyForecast: WeatherData[] = hourly.time.slice(0, 24).map((time, index) => ({
        temperature: hourly.temperature_2m[index],
        weatherCode: hourly.weather_code[index],
        windSpeed: hourly.wind_speed_10m[index],
        precipitation: hourly.precipitation[index],
        time,
      }));

      // Process daily forecast
      const dailyForecast: WeatherData[] = daily.time.map((time, index) => ({
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


