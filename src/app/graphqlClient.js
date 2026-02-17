import { GraphQLClient } from 'graphql-request';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.36:3000/api';

const client = new GraphQLClient(`${API_BASE_URL}/graphql`);

export default client;
