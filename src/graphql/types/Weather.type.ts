import { gql } from 'graphql-tag';

export const WeatherType = gql`
  type Weather {
    temperature: Float!
    weatherCode: Int!
    windSpeed: Float!
    precipitation: Float!
    time: String!
  }
`;
