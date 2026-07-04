import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

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
        url: process.env.BACKEND_URL || 'http://localhost:3001',
        description: 'Backend Server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../server.js'),
    path.join(__dirname, '../server.ts')
  ], 
};

export const swaggerSpec = swaggerJsdoc(options);
