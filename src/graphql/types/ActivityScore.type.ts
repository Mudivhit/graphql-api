import { gql } from 'graphql-tag';

export const ActivityScoreType = gql`
  type ActivityScore {
    activity: String!
    score: Int!
    description: String!
  }
`;
