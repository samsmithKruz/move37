// src/docs/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Move37 Polling API',
      version: '1.0.0',
      description: 'A real-time polling application API for Move37 Ventures Challenge',
      contact: {
        name: 'Samuel Benny',
        email: 'samspike46@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated unique identifier for the user',
              example: 'clk5zqy8q0000q2q1q2q3q4q5'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john.doe@example.com'
            },
            passwordHash: {
              type: 'string',
              description: 'Hashed password (auto-generated)',
              example: '$2b$10$ExampleHashedPasswordString'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user was last updated'
            }
          }
        },
        Poll: {
          type: 'object',
          required: ['question', 'creatorId'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated unique identifier for the poll',
              example: 'clk5zqy8q0000q2q1q2q3q4q6'
            },
            question: {
              type: 'string',
              description: 'The poll question',
              example: 'What is your favorite programming language?'
            },
            isPublished: {
              type: 'boolean',
              description: 'Whether the poll is published and visible to users',
              default: false
            },
            creatorId: {
              type: 'string',
              description: 'ID of the user who created the poll'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the poll was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the poll was last updated'
            }
          }
        },
        PollOption: {
          type: 'object',
          required: ['text', 'pollId'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated unique identifier for the poll option',
              example: 'clk5zqy8q0000q2q1q2q3q4q7'
            },
            text: {
              type: 'string',
              description: 'The text of the poll option',
              example: 'JavaScript'
            },
            pollId: {
              type: 'string',
              description: 'ID of the poll this option belongs to'
            }
          }
        },
        Vote: {
          type: 'object',
          required: ['userId', 'pollOptionId'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated unique identifier for the vote',
              example: 'clk5zqy8q0000q2q1q2q3q4q8'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who cast the vote'
            },
            pollOptionId: {
              type: 'string',
              description: 'ID of the poll option that was voted for'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the error occurred'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Polls',
        description: 'Poll management endpoints'
      },
      {
        name: 'Votes',
        description: 'Voting endpoints'
      },
      {
        name: 'Health',
        description: 'Server health check'
      }
    ]
  },
  apis: [
    './src/routes/*.js', // Scan route files for JSDoc comments
    './src/controllers/*.js', // Scan controller files
    './src/models/*.js' // Scan model files
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;