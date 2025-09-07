import axios, { AxiosInstance } from 'axios';

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

export interface ActivityScore {
  activity: string;
  score: number;
  description: string;
}

class OpenMeteoService {
  private readonly geocodingURL: string;
  private readonly weatherURL: string;
  private readonly client: AxiosInstance;

  constructor() {
    this.geocodingURL = process.env.OPENMETEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1';
    this.weatherURL = process.env.OPENMETEO_WEATHER_URL || 'https://api.open-meteo.com/v1';
    this.client = axios.create({
      timeout: 10000,
    });
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
        this.calculateSkiingScore(current),
        this.calculateSurfingScore(current),
        this.calculateIndoorSightseeingScore(current),
        this.calculateOutdoorSightseeingScore(current),
      ];

      // Sort activities by score in descending order
      return activityScores.sort((a, b) => b.score - a.score);
    } catch (error: any) {
      console.error('Error generating activity recommendations:', error.message);
      throw new Error(`Failed to generate activity recommendations: ${error.message}`);
    }
  }

  private calculateSkiingScore(weather: WeatherData): ActivityScore {
    // Ideal conditions: cold temperature and snow (weather codes for snow: 71-77, 85-86)
    const isSnowing = (weather.weatherCode >= 71 && weather.weatherCode <= 77) ||
      weather.weatherCode === 85 ||
      weather.weatherCode === 86;

    const tempScore = Math.max(0, 1 - (Math.abs(-5 - weather.temperature) / 20)); // Best around -5°C
    const windPenalty = Math.min(1, weather.windSpeed / 30); // Penalize high winds

    let score = 0;
    if (isSnowing) {
      score = 70 + (tempScore * 30); // Base 70 if snowing
    } else {
      score = tempScore * 50; // Lower score if not snowing
    }

    score *= (1 - windPenalty * 0.5); // Reduce score for high winds

    return {
      activity: 'Skiing',
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: isSnowing ? 'Perfect conditions for skiing with fresh snow!' : 'Skiing conditions are not ideal right now.'
    };
  }

  private calculateSurfingScore(weather: WeatherData): ActivityScore {
    // Good conditions: moderate wind and not too cold
    const windScore = Math.min(1, weather.windSpeed / 15) * 50; // Best around 15 m/s
    const tempScore = weather.temperature > 10 ? 50 : (weather.temperature / 10) * 50; // Better when warmer
    const rainPenalty = weather.precipitation > 5 ? 20 : 0; // Penalize heavy rain

    const score = windScore + tempScore - rainPenalty;

    return {
      activity: 'Surfing',
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: weather.windSpeed > 8 ? 'Good waves for surfing!' : 'Waves might be too calm for surfing.'
    };
  }

  private calculateIndoorSightseeingScore(weather: WeatherData): ActivityScore {
    // Good when weather is bad (rain, snow, extreme temperatures)
    const isBadWeather = weather.precipitation > 2 ||
      weather.temperature < 0 ||
      weather.temperature > 30 ||
      (weather.weatherCode >= 51 && weather.weatherCode <= 86);

    const score = isBadWeather ? 80 : 30;

    return {
      activity: 'Indoor Sightseeing',
      score,
      description: isBadWeather ? 'Great day to explore indoor attractions!' : 'Consider outdoor activities instead.'
    };
  }

  private calculateOutdoorSightseeingScore(weather: WeatherData): ActivityScore {
    // Good when weather is nice (clear, partly cloudy, comfortable temperature)
    const isGoodWeather = (weather.weatherCode === 0 || weather.weatherCode === 1 || weather.weatherCode === 2) &&
      weather.precipitation < 2 &&
      weather.temperature >= 15 &&
      weather.temperature <= 28;

    const windPenalty = Math.min(30, weather.windSpeed * 2);
    const tempScore = 1 - (Math.abs(21.5 - weather.temperature) / 20) * 100; // Best around 21.5°C

    let score = isGoodWeather ? 80 : 30;
    score = (score + tempScore) / 2; // Average of base score and temperature score
    score = Math.max(0, score - windPenalty); // Apply wind penalty

    return {
      activity: 'Outdoor Sightseeing',
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: isGoodWeather ? 'Perfect weather for exploring outdoors!' : 'Weather conditions might not be ideal for outdoor sightseeing.'
    };
  }
}

export default OpenMeteoService;


