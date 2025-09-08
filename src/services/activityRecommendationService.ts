import { WeatherData } from "./openmeteoService";
import { ActivityScoreDTO } from './interfaces/ActivityRecommendation.interfaces';

export type ActivityScore = ActivityScoreDTO; // backward-compatible alias

/**
 * Service that contains heuristic scoring functions mapping a single
 * WeatherData sample to an `ActivityScoreDTO` for different activities.
 *
 * Notes:
 * - All scoring functions are heuristic and return an integer score in 0..100.
 * - Magic numbers (temperature targets, wind thresholds, weather codes) are
 *   documented near each function and intended to be tunable.
 */
export class ActivityRecommendationService {
  /**
   * Compute a skiing suitability score from current weather.
   * Heuristic highlights:
   * - Prefers temperatures near -5°C and presence of snow-related weather codes.
   * - Penalizes high winds.
   *
   * @param weather - WeatherData object (temperature °C, windSpeed m/s, precipitation mm, weatherCode per OpenMeteo)
   * @returns ActivityScoreDTO with integer score 0..100 and a short description.
   */
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

  /**
   * Compute a surfing suitability score.
   * Heuristic highlights:
   * - Prefers moderate to strong winds (approx. 15 m/s best), and warmer temperatures.
   * - Penalizes heavy precipitation.
   *
   * @param weather - WeatherData sample
   * @returns ActivityScoreDTO
   */
  calculateSurfingScore(weather: WeatherData): ActivityScoreDTO {
    // Good conditions: moderate wind and not too cold
    const windScore = Math.min(1, weather.windSpeed / 15) * 60; // Best around 15 m/s
    const tempScore =
      weather.temperature > 10 ? 40 : (weather.temperature / 10) * 40; // Better when warmer
    const windThresholdPenalty = weather.windSpeed < 5 ? 30 : 0; // Significant penalty for too little wind
    const rainPenalty = weather.precipitation > 5 ? 20 : 0; // Penalize heavy rain

    const score = windScore + tempScore - rainPenalty - windThresholdPenalty;

    return {
      activity: "Surfing",
      score: Math.min(100, Math.max(0, Math.round(score))),
      description:
        weather.windSpeed > 8
          ? "Good waves for surfing!"
          : "Waves might be too calm for surfing.",
    };
  }

  /**
   * Compute indoor sightseeing score. Higher when weather is poor (rain/snow/extreme temps).
   * @param weather - WeatherData sample
   * @returns ActivityScoreDTO
   */
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

  /**
   * Compute outdoor sightseeing score. Prefers clear or partly cloudy, low precipitation,
   * and comfortable temperatures (around 21.5°C). Applies a wind penalty.
   * @param weather - WeatherData sample
   * @returns ActivityScoreDTO
   */
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
    const tempScore = Math.max(0, 1 - (Math.abs(21.5 - weather.temperature) / 10) * 100); // Best around 21.5°C

    const baseScore = isGoodWeather ? 85 : 30;
    const finalTempScore = tempScore > 0 ? tempScore * 0.8 : 0; // Weight temperature more heavily
    const score = Math.max(0, baseScore + finalTempScore - windPenalty);

    return {
      activity: "Outdoor Sightseeing",
      score: Math.min(100, Math.max(0, Math.round(score))),
      description: isGoodWeather
        ? "Perfect weather for exploring outdoors!"
        : "Weather conditions might not be ideal for outdoor sightseeing.",
    };
  }
}
