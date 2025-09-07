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

export default class OpenMeteoService {
  private readonly baseURL: string;
  private readonly client: AxiosInstance;

  constructor() {
    this.baseURL = process.env.OPENMETEO_BASE_URL || 'https://geocoding-api.open-meteo.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  async searchCities(query: string, limit: number = 10) {
    try {
      const response = await this.client.get<SearchCityResponse>('/search', {
        params: { name: query, count: limit, language: 'en', format: 'json' },
      });
      console.log('City search response:', response.data);

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
}


