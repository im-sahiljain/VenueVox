import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VenueVox API',
      version: '1.0.0',
      description: 'API Documentation for VenueVox backend',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);
