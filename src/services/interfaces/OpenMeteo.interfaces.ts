export interface WeatherDTO {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  time: string;
}

export interface OpenMeteoSearchResult {
  id: number | string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface OpenMeteoSearchResponse {
  results?: OpenMeteoSearchResult[];
}

export interface OpenMeteoWeatherResponse {
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
