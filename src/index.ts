import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import express, { RequestHandler } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import typeDefs from './schema';
import Resolvers from './resolvers';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers: new Resolvers().getResolvers() as any,
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  const graphqlMiddleware = expressMiddleware(server as any) as unknown as RequestHandler;
  app.use('/graphql', ((req, res, next) => graphqlMiddleware(req, res, next)) as RequestHandler);

  app.get('/', (_req, res) => {
    res.json({
      message: 'Travel Planning GraphQL API',
      version: '1.0.0',
      endpoints: { graphql: '/graphql' },
    });
  });

  const PORT = Number(process.env.PORT) || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve as any));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


