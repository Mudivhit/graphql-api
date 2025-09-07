import { gql } from 'graphql-tag';

export const WeatherForecastType = gql`
  type WeatherForecast {
    current: Weather!
    hourly: [Weather!]!
    daily: [Weather!]!
  }
`;
