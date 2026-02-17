import { gql } from 'graphql-request';

export const exerciseQuery = gql`
  query GetExercises {
    exercises {
      name
      type
      muscle
      equipments
      difficulty
      instructions
    }
  }
`;

export const exerciseDetailQuery = gql`
  query GetExerciseDetail($name: String!) {
    exercises(name: $name) {
      name
      type
      muscle
      equipments
      difficulty
      instructions
    }
  }
`;
