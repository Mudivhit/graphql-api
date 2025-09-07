import { WeatherData } from "./openmeteoService";
import { ActivityScoreDTO } from './interfaces/ActivityRecommendation.interfaces';

export type ActivityScore = ActivityScoreDTO; // backward-compatible alias

export class ActivityRecommendationService {
  calculateSkiingScore(weather: WeatherData): ActivityScoreDTO {
    // Ideal conditions: cold temperature and snow (weather codes for snow: 71-77, 85-86)
    const isSnowing =
      (weather.weatherCode >= 71 && weather.weatherCode <= 77) ||
      weather.weatherCode === 85 ||
      weather.weatherCode === 86;

    const tempScore = Math.max(0, 1 - Math.abs(-5 - weather.temperature) / 20); // Best around -5°C
    const windPenalty = Math.min(1, weather.windSpeed / 30); // Penalize high winds

    let score = 0;
    if (isSnowing) {
      score = 70 + tempScore * 30; // Base 70 if snowing
    } else {
      score = tempScore * 50; // Lower score if not snowing
    }

    score *= 1 - windPenalty * 0.5; // Reduce score for high winds

    return {
      activity: "Skiing",
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: isSnowing
        ? "Perfect conditions for skiing with fresh snow!"
        : "Skiing conditions are not ideal right now.",
    };
  }

  calculateSurfingScore(weather: WeatherData): ActivityScoreDTO {
    // Good conditions: moderate wind and not too cold
    const windScore = Math.min(1, weather.windSpeed / 15) * 50; // Best around 15 m/s
    const tempScore =
      weather.temperature > 10 ? 50 : (weather.temperature / 10) * 50; // Better when warmer
    const rainPenalty = weather.precipitation > 5 ? 20 : 0; // Penalize heavy rain

    const score = windScore + tempScore - rainPenalty;

    return {
      activity: "Surfing",
      score: Math.min(100, Math.max(0, Math.round(score))),
      description:
        weather.windSpeed > 8
          ? "Good waves for surfing!"
          : "Waves might be too calm for surfing.",
    };
  }

  calculateIndoorSightseeingScore(weather: WeatherData): ActivityScoreDTO {
    // Good when weather is bad (rain, snow, extreme temperatures)
    const isBadWeather =
      weather.precipitation > 2 ||
      weather.temperature < 0 ||
      weather.temperature > 30 ||
      (weather.weatherCode >= 51 && weather.weatherCode <= 86);

    const score = isBadWeather ? 80 : 30;

    return {
      activity: "Indoor Sightseeing",
      score,
      description: isBadWeather
        ? "Great day to explore indoor attractions!"
        : "Consider outdoor activities instead.",
    };
  }

  calculateOutdoorSightseeingScore(weather: WeatherData): ActivityScoreDTO {
    // Good when weather is nice (clear, partly cloudy, comfortable temperature)
    const isGoodWeather =
      (weather.weatherCode === 0 ||
        weather.weatherCode === 1 ||
        weather.weatherCode === 2) &&
      weather.precipitation < 2 &&
      weather.temperature >= 15 &&
      weather.temperature <= 28;

    const windPenalty = Math.min(30, weather.windSpeed * 2);
    const tempScore = 1 - (Math.abs(21.5 - weather.temperature) / 20) * 100; // Best around 21.5°C

    let score = isGoodWeather ? 80 : 30;
    score = (score + tempScore) / 2; // Average of base score and temperature score
    score = Math.max(0, score - windPenalty); // Apply wind penalty

    return {
      activity: "Outdoor Sightseeing",
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: isGoodWeather
        ? "Perfect weather for exploring outdoors!"
        : "Weather conditions might not be ideal for outdoor sightseeing.",
    };
  }
}
