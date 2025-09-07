import { gql } from 'graphql-tag';

const typeDefs = gql`
  type City {
    id: ID!
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
  }

  type Weather {
    temperature: Float!
    weatherCode: Int!
    windSpeed: Float!
    precipitation: Float!
    time: String!
  }

  type ActivityScore {
    activity: String!
    score: Int!
    description: String!
  }

  type WeatherForecast {
    current: Weather!
    hourly: [Weather!]!
    daily: [Weather!]!
  }

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


