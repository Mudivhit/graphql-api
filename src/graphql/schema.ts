import { gql } from 'graphql-tag';
import { CityType } from './types/City.type';
import { WeatherType } from './types/Weather.type';
import { ActivityScoreType } from './types/ActivityScore.type';
import { WeatherForecastType } from './types/WeatherForecast.type';

const typeDefs = gql`
  ${CityType}
  ${WeatherType}
  ${ActivityScoreType}
  ${WeatherForecastType}

  type Query {
    """
    Search for cities by name with optional result limit
    """
    searchCities(query: String!, limit: Int = 10): [City!]!
    
    """
    Get weather forecast for a specific location
    """
    getWeatherForecast(
      latitude: Float!
      longitude: Float!
      days: Int = 7
    ): WeatherForecast!
    
    """
    Get recommended activities based on weather conditions at a location
    """
    getRecommendedActivities(
      latitude: Float!
      longitude: Float!
    ): [ActivityScore!]!
  }
`;
export default typeDefs;