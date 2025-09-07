import gql from 'graphql-tag';

const typeDefs = gql`
  type City {
    id: ID!
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
  }

  type Query {
    searchCities(query: String!, limit: Int = 10): [City!]!
  }

`;

export default typeDefs;


