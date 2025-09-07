import { gql } from 'graphql-tag';

export const CityType = gql`
  type City {
    id: ID!
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
  }
`;
